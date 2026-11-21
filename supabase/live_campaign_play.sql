-- Keep DM edits scoped to one collection and replay them over older owner saves.
create table ledger_private.sheet_rewards (
  owner_id uuid not null, sheet_id text not null, version bigint not null,
  field text not null check (field in ('inventory','feats')), adding boolean not null, entry jsonb not null,
  primary key(owner_id,sheet_id,version),
  foreign key(owner_id,sheet_id) references public.characters(user_id,id) on delete cascade
);
revoke all on ledger_private.sheet_rewards from public,anon,authenticated;

create function ledger_private.apply_reward(entries jsonb, adding boolean, entry jsonb)
returns jsonb language plpgsql immutable set search_path='' as $$
declare rows jsonb := coalesce(nullif(entries,'null'),'[]'); pos int;
begin
  select ord::int-1 into pos from jsonb_array_elements(rows) with ordinality e(value,ord)
    where case when entry->>'id' is null then value=entry else value->>'id'=entry->>'id' end order by ord limit 1;
  if adding and pos is null then return rows || jsonb_build_array(entry); end if;
  if not adding and pos is not null then return rows - pos; end if;
  return rows;
end $$;

create function ledger_private.apply_sheet_reward(sheet jsonb, field text, adding boolean, entry jsonb)
returns jsonb language plpgsql immutable set search_path='' as $
declare suppressed jsonb:=coalesce(sheet->'campaignRemovedFeatIds','[]');
begin
  sheet:=jsonb_set(sheet,array[field],ledger_private.apply_reward(sheet->field,adding,entry));
  if field='feats' and entry->>'id' is not null then
    if not adding and entry->'automatic'='true'::jsonb and not (suppressed ? (entry->>'id')) then
      sheet:=jsonb_set(sheet,'{campaignRemovedFeatIds}',suppressed||jsonb_build_array(entry->>'id'));
    elsif adding and suppressed ? (entry->>'id') then
      sheet:=jsonb_set(sheet,'{campaignRemovedFeatIds}',suppressed-(entry->>'id'));
    end if;
  end if;
  return sheet;
end $;

create function ledger_private.preserve_rewards() returns trigger language plpgsql security definer set search_path='' as $$
declare change ledger_private.sheet_rewards; seen bigint; latest bigint;
begin
  if not (old.data ? 'campaignRewardVersion') then return new; end if;
  seen := case when new.data->>'campaignRewardVersion' ~ '^[0-9]{1,16}$' then (new.data->>'campaignRewardVersion')::bigint else 0 end;
  for change in select * from ledger_private.sheet_rewards where owner_id=old.user_id and sheet_id=old.id
    and version>seen order by version loop
    new.data := ledger_private.apply_sheet_reward(new.data,change.field,change.adding,change.entry);
  end loop;
  select max(version) into latest from ledger_private.sheet_rewards where owner_id=old.user_id and sheet_id=old.id;
  if latest is not null then new.data:=jsonb_set(new.data,'{campaignRewardVersion}',to_jsonb(latest)); end if;
  return new;
end $$;
create trigger preserve_campaign_rewards before update of data on public.characters for each row execute function ledger_private.preserve_rewards();

create function public.ledger_change_reward(p_campaign uuid,p_owner uuid,p_sheet text,p_field text,p_add boolean,p_entry jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare sheet jsonb; entries jsonb; changed jsonb; revision bigint;
begin
  perform 1 from public.ledger_campaign_sheets where campaign_id=p_campaign and dm_id=auth.uid()
    and user_id=p_owner and character_id=p_sheet for share;
  if not found then raise exception 'Only the current campaign DM may manage this sheet'; end if;
  if p_field is null or p_field not in ('inventory','feats') or p_add is null or p_entry is null
     or jsonb_typeof(p_entry)<>'object' or octet_length(p_entry::text)>150000 then raise exception 'Invalid reward'; end if;
  if p_add and (nullif(btrim(p_entry->>'name'),'') is null or length(p_entry->>'name')>400
       or nullif(p_entry->>'id','') is null) then raise exception 'A reward needs a name and ID'; end if;
  select data into strict sheet from public.characters where user_id=p_owner and id=p_sheet for update;
  entries:=coalesce(nullif(sheet->p_field,'null'),'[]');
  if not p_add and p_entry->>'id' is not null then
    select e into p_entry from jsonb_array_elements(entries) e where e->>'id'=p_entry->>'id' limit 1;
    if not found then return; end if;
  end if;
  changed:=ledger_private.apply_sheet_reward(sheet,p_field,p_add,p_entry);
  if changed=sheet then return; end if;
  select coalesce(max(version),0)+1 into revision from ledger_private.sheet_rewards where owner_id=p_owner and sheet_id=p_sheet;
  insert into ledger_private.sheet_rewards values(p_owner,p_sheet,revision,p_field,p_add,p_entry);
  update public.characters set data=jsonb_set(changed,'{campaignRewardVersion}',to_jsonb(revision))
    where user_id=p_owner and id=p_sheet;
end $$;

-- One active encounter per campaign. Character names and membership are resolved at read time.
alter table public.ledger_campaigns add column live_encounter jsonb;
create function public.ledger_combat_state(p_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare encounter jsonb; players jsonb;
begin
  select live_encounter into encounter from public.ledger_campaigns c where c.id=p_campaign and
    (c.dm_id=auth.uid() or exists(select from public.ledger_campaign_sheets s where s.campaign_id=c.id and s.user_id=auth.uid()));
  if encounter is null then return null; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',s.user_id::text||':'||s.character_id,'name',ch.name,'kind','Player',
    'initiative',encounter->'rolls'->(s.user_id::text||':'||s.character_id)) order by ch.name,s.user_id,s.character_id),'[]')
    into players from public.ledger_campaign_sheets s join public.characters ch on (ch.user_id,ch.id)=(s.user_id,s.character_id)
    where s.campaign_id=p_campaign;
  return jsonb_build_object('id',encounter->'id','name',encounter->'name','entries',players||(encounter->'npcs'));
end $$;

create function public.ledger_combat_command(p_campaign uuid,p_encounter uuid,p_action text,p_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare encounter jsonb; dm uuid; actor text; score integer; label text;
begin
  if auth.uid() is null then raise exception 'Sign in to use live combat'; end if;
  if p_action='roll' then
    perform 1 from public.ledger_campaign_sheets where campaign_id=p_campaign and user_id=auth.uid()
      and character_id=p_payload->>'character' for share;
    if not found then raise exception 'Share this character with the campaign to roll'; end if;
  end if;
  select live_encounter,dm_id into encounter,dm from public.ledger_campaigns where id=p_campaign for update;
  if not found or (p_action is distinct from 'roll' and dm<>auth.uid()) then raise exception 'Campaign action unavailable'; end if;
  if p_action='start' then
    if encounter is not null then raise exception 'An encounter is already live'; end if;
    label:=btrim(p_payload->>'name');
    if coalesce(length(label),0) not between 1 and 120 then raise exception 'Enter an encounter name'; end if;
    encounter:=jsonb_build_object('id',gen_random_uuid(),'name',label,'rolls','{}'::jsonb,'npcs','[]'::jsonb);
  else
    if encounter is null or p_encounter is distinct from (encounter->>'id')::uuid then raise exception 'This encounter has ended'; end if;
    if p_action in ('roll','add') then
      score:=(p_payload->>'initiative')::integer;
      if score is null or score not between -999 and 999 then raise exception 'Invalid initiative'; end if;
    end if;
    case p_action
      when 'roll' then
        actor:=auth.uid()::text||':'||(p_payload->>'character');
        if (encounter->'rolls') ? actor then return; end if;
        encounter:=jsonb_set(encounter,array['rolls',actor],to_jsonb(score));
      when 'add' then
        label:=btrim(p_payload->>'name');
        if coalesce(length(label),0) not between 1 and 120 or coalesce(p_payload->>'kind','') not in ('NPC','Enemy') then raise exception 'Invalid combatant'; end if;
        if jsonb_array_length(encounter->'npcs')>=150 then raise exception 'Encounter is full'; end if;
        actor:=(p_payload->>'id')::uuid::text;
        if actor is null then raise exception 'Missing combatant ID'; end if;
        if exists(select from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor) then return; end if;
        encounter:=jsonb_set(encounter,'{npcs}',(encounter->'npcs')||jsonb_build_array(jsonb_build_object('id',actor,'name',label,'kind',p_payload->>'kind','initiative',score)));
      when 'remove' then
        encounter:=jsonb_set(encounter,'{npcs}',coalesce((select jsonb_agg(n order by ord) from jsonb_array_elements(encounter->'npcs') with ordinality e(n,ord) where n->>'id'<>p_payload->>'id'),'[]'));
      when 'end' then encounter:=null;
      else raise exception 'Unknown encounter action';
    end case;
  end if;
  update public.ledger_campaigns set live_encounter=encounter,revision=revision+1 where id=p_campaign;
end $$;
revoke all on function ledger_private.apply_reward(jsonb,boolean,jsonb),ledger_private.apply_sheet_reward(jsonb,text,boolean,jsonb),ledger_private.preserve_rewards() from public,anon,authenticated;
revoke all on function public.ledger_change_reward(uuid,uuid,text,text,boolean,jsonb),public.ledger_combat_state(uuid),public.ledger_combat_command(uuid,uuid,text,jsonb) from public,anon;
grant execute on function public.ledger_change_reward(uuid,uuid,text,text,boolean,jsonb),public.ledger_combat_state(uuid),public.ledger_combat_command(uuid,uuid,text,jsonb) to authenticated;
