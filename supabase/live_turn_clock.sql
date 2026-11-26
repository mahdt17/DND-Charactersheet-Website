-- Apply in one transaction after encounter_logs.sql.
alter table public.characters add column live_timer_version bigint not null default 0,
  add column live_timer_floor bigint not null default 0,
  add column live_timer_expirations jsonb not null default '[]';
-- Limit browser writes to fields supported by existing sheet/import clients.
-- The initiative clock and its reconciliation history are server-owned.
revoke all on public.characters from public,anon,authenticated;
grant select,delete on public.characters to authenticated;
grant insert(user_id,id,name,race,class_name,level,data,institute_access),
  update(user_id,id,name,race,class_name,level,data,institute_access) on public.characters to authenticated;

-- Clock and DM correction commands already notify once after updating the sheets.
drop trigger ledger_shared_sheet_saved on public.characters;
create trigger ledger_shared_sheet_saved after update on public.characters for each row
  when (old.live_timer_version=new.live_timer_version) execute function ledger_private.notify_campaign();

create function ledger_private.timer_key(effect jsonb) returns text language sql immutable set search_path='' as $$
  select coalesce($1->>'timerInstance',$1->>'id')
$$;

-- Preserve clock updates when an older sheet autosave arrives after turn advancement.
create function ledger_private.preserve_live_timers() returns trigger language plpgsql set search_path='' as $$
declare seen bigint; current_effect jsonb; e jsonb; kept jsonb:='[]'; expired_concentration text; expired jsonb;
begin
  if new.live_timer_version<>old.live_timer_version then
    for expired in select a from jsonb_array_elements(coalesce(old.data->'activeEffects','[]')) a
      where (jsonb_typeof(a->'remainingSeconds')='number' or a ? 'expires')
        and not exists(select from jsonb_array_elements(coalesce(new.data->'activeEffects','[]')) b where ledger_private.timer_key(b)=ledger_private.timer_key(a)) loop
      new.live_timer_expirations:=new.live_timer_expirations||jsonb_build_array(jsonb_build_object('key',ledger_private.timer_key(expired),'v',new.live_timer_version));
    end loop;
    if jsonb_array_length(new.live_timer_expirations)>128 then
      select greatest(old.live_timer_floor,max((value->>'v')::bigint)) into new.live_timer_floor from jsonb_array_elements(new.live_timer_expirations) with ordinality
        where ordinality<=jsonb_array_length(new.live_timer_expirations)-128;
      select jsonb_agg(value order by ordinality) into new.live_timer_expirations from jsonb_array_elements(new.live_timer_expirations) with ordinality
        where ordinality>jsonb_array_length(new.live_timer_expirations)-128;
    end if;
    new.data:=jsonb_set(new.data,'{combatClockVersion}',to_jsonb(new.live_timer_version));
    return new;
  end if;
  if old.live_timer_version=0 then return new; end if;
  seen:=case when new.data->>'combatClockVersion' ~ '^[0-9]{1,16}$' then (new.data->>'combatClockVersion')::bigint else 0 end;
  if seen<old.live_timer_floor and coalesce(new.data->'activeEffects','[]')<>'[]' then
    raise exception 'This sheet predates its recent combat history. Reopen the sheet before editing effects.';
  end if;
  if seen<old.live_timer_version then
    for e in select value from jsonb_array_elements(coalesce(new.data->'activeEffects','[]')) loop
      if exists(select from jsonb_array_elements(old.live_timer_expirations) h where h->>'key'=ledger_private.timer_key(e) and (h->>'v')::bigint>seen) then
        expired_concentration:=coalesce(e->>'concentration',expired_concentration);
        continue;
      end if;
      select value into current_effect from jsonb_array_elements(coalesce(old.data->'activeEffects','[]')) where ledger_private.timer_key(value)=ledger_private.timer_key(e) limit 1;
      if current_effect ? 'remainingSeconds' then e:=jsonb_set(e,'{remainingSeconds}',current_effect->'remainingSeconds'); end if;
      if current_effect ? 'expires' then e:=jsonb_set(e,'{expires}',current_effect->'expires'); end if;
      kept:=kept||jsonb_build_array(e);
    end loop;
    new.data:=jsonb_set(new.data,'{activeEffects}',kept);
    if new.data->>'concentration'=expired_concentration and not exists(select from jsonb_array_elements(kept) k where k->>'concentration'=expired_concentration)
      then new.data:=new.data||'{"concentration":null}'; end if;
    if new.data#>>'{totemWarrior,activeRage}'='true' and old.data#>>'{totemWarrior,activeRage}'='false'
      and not exists(select from jsonb_array_elements(kept) k where k->>'stateKey'='rage') then
      new.data:=jsonb_set(new.data,'{totemWarrior,activeRage}','false'); end if;
  end if;
  new.data:=jsonb_set(new.data,'{combatClockVersion}',to_jsonb(old.live_timer_version));
  return new;
end $$;
-- The trigger reads a private helper while executing for sheet owners.
alter function ledger_private.preserve_live_timers() security definer;
revoke all on function ledger_private.timer_key(jsonb),ledger_private.preserve_live_timers() from public,anon,authenticated;
create trigger preserve_live_timers before update on public.characters for each row execute function ledger_private.preserve_live_timers();

-- Order by descending initiative and then a stable identifier, including during roster edits.
-- Keys stay inside the private encounter. The client sees only a visible current combatant.
create function ledger_private.turn_key(combatant jsonb) returns text language sql immutable set search_path='' as $$
  select lpad((999-($1->>'initiative')::int)::text,4,'0')||':'||($1->>'id')
$$;
revoke all on function ledger_private.turn_key(jsonb) from public,anon,authenticated;
alter function public.ledger_combat_state(uuid) set schema ledger_private;
revoke all on function ledger_private.ledger_combat_state(uuid) from public,authenticated,anon;
create function public.ledger_combat_state(p_campaign uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare view_state jsonb; cursor_state jsonb; visible_actor jsonb;
begin
  view_state:=ledger_private.ledger_combat_state(p_campaign);
  if view_state is null then return null; end if;
  select state->'turn' into cursor_state from ledger_private.campaign_encounters where campaign_id=p_campaign;
  if cursor_state is null then return view_state; end if;
  select e into visible_actor from jsonb_array_elements(view_state->'entries') e where e->>'id'=cursor_state->>'actor';
  return view_state||jsonb_build_object('turn',jsonb_build_object('serial',cursor_state->'serial','round',cursor_state->'round','actor',visible_actor->'id','name',visible_actor->'name'));
end $$;
revoke all on function public.ledger_combat_state(uuid) from public,anon;
grant execute on function public.ledger_combat_state(uuid) to authenticated;

create function public.ledger_advance_turn(p_campaign uuid,p_encounter uuid,p_serial bigint) returns void
language plpgsql security definer set search_path='' as $$
declare state_row jsonb; prior jsonb; next_actor jsonb; next_key text; next_round int; wrapped boolean;
  prior_key text; combatants jsonb; sheet record; e jsonb; effects jsonb; sheet_data jsonb; anchors jsonb; sheet_anchors jsonb;
  anchor text; k text; participant text; ticks boolean; ended boolean; starting boolean; ending boolean;
begin
  perform 1 from public.ledger_campaigns where id=p_campaign and dm_id=auth.uid() for update;
  if not found then raise exception 'Only the campaign DM can advance initiative'; end if;
  select state into state_row from ledger_private.campaign_encounters where campaign_id=p_campaign;
  if state_row is null or (state_row->>'id')::uuid is distinct from p_encounter then raise exception 'This encounter has ended'; end if;
  prior:=state_row->'turn';
  if coalesce((prior->>'serial')::bigint,0) is distinct from p_serial then return; end if;
  prior_key:=prior->>'key';
  combatants:=ledger_private.ledger_combat_state(p_campaign)->'entries';
  select value into next_actor from jsonb_array_elements(combatants) where value->>'initiative' is not null
    order by (ledger_private.turn_key(value) collate "C">prior_key collate "C") desc,ledger_private.turn_key(value) collate "C" limit 1;
  if next_actor is null then raise exception 'Add a combatant or roll initiative first'; end if;
  next_key:=ledger_private.turn_key(next_actor);
  wrapped:=prior_key is not null and next_key collate "C"<=prior_key collate "C";
  next_round:=coalesce((prior->>'round')::int,1)+wrapped::int;
  anchors:='{}';
  for sheet in select c.user_id,c.id,c.name,c.data
    from public.ledger_campaign_sheets s join public.characters c on (c.user_id,c.id)=(s.user_id,s.character_id)
    where s.campaign_id=p_campaign and jsonb_typeof(c.data->'activeEffects')='array' and c.data->'activeEffects'<>'[]'::jsonb
    order by c.user_id,c.id for update of c nowait loop
    participant:=sheet.user_id::text||':'||sheet.id;
    sheet_anchors:='{}'; effects:='[]'; sheet_data:=sheet.data;
    starting:=participant=next_actor->>'id'; ending:=participant=prior->>'actor';
    for e in select value from jsonb_array_elements(sheet.data->'activeEffects') loop
      k:=ledger_private.timer_key(e);
      if k is null or (jsonb_typeof(e->'remainingSeconds') is distinct from 'number' and e->>'expires' is null) then effects:=effects||jsonb_build_array(e); continue; end if;
      anchor:=coalesce(state_row#>>array['timerAnchors',participant,k],prior_key,next_key);
      -- Cross the activation position once, including when its combatant has left.
      ticks:=prior_key is not null and case when wrapped then anchor collate "C">prior_key collate "C" or anchor collate "C"<=next_key collate "C"
        else anchor collate "C">prior_key collate "C" and anchor collate "C"<=next_key collate "C" end;
      ended:=coalesce(ending and e->>'expires'='end-turn',false) or coalesce(starting and e->>'expires'='start-next-turn',false);
      if starting and e->>'expires'='end-next-turn' then e:=jsonb_set(e,'{expires}','"end-turn"'); end if;
      if ticks and jsonb_typeof(e->'remainingSeconds')='number' and coalesce(e->>'expires','') not in ('start-next-turn','end-next-turn','end-turn') then
        e:=jsonb_set(e,'{remainingSeconds}',to_jsonb((e->>'remainingSeconds')::numeric-6)); ended:=ended or (e->>'remainingSeconds')::numeric<=0;
      end if;
      if ended then
        if e->>'concentration'=sheet_data->>'concentration' then sheet_data:=sheet_data||'{"concentration":null,"concentrationChecks":[]}'; end if;
        if e->>'stateKey'='rage' and sheet_data ? 'totemWarrior' then sheet_data:=jsonb_set(sheet_data,'{totemWarrior,activeRage}','false'); end if;
        perform ledger_private.write_encounter_event(p_encounter,'expired',sheet.name||' · '||coalesce(e->>'name','Effect'));
      else
        effects:=effects||jsonb_build_array(e);
        sheet_anchors:=jsonb_set(sheet_anchors,array[k],to_jsonb(anchor));
      end if;
    end loop;
    if sheet_anchors<>'{}' then anchors:=jsonb_set(anchors,array[participant],sheet_anchors); end if;
    if effects<>sheet.data->'activeEffects' then
      update public.characters set data=jsonb_set(sheet_data,'{activeEffects}',effects),live_timer_version=live_timer_version+1
        where user_id=sheet.user_id and id=sheet.id;
    end if;
  end loop;
  state_row:=state_row||jsonb_build_object('timerAnchors',anchors,'turn',jsonb_build_object('key',next_key,'actor',next_actor->'id','round',next_round,'serial',p_serial+1));
  update ledger_private.campaign_encounters set state=state_row where campaign_id=p_campaign;
  update public.ledger_campaigns set revision=revision+1 where id=p_campaign;
exception when lock_not_available then
  raise exception 'A player is saving a sheet. Retry advancing the turn.' using errcode='55P03';
end $;
revoke all on function public.ledger_advance_turn(uuid,uuid,bigint) from public,anon;
grant execute on function public.ledger_advance_turn(uuid,uuid,bigint) to authenticated;

create function ledger_private.log_sheet_effects() returns trigger language plpgsql security definer set search_path='' as $$
declare encounter uuid; e jsonb;
begin
  select (x.state->>'id')::uuid into encounter from public.ledger_campaign_sheets s
    join ledger_private.campaign_encounters x on x.campaign_id=s.campaign_id where s.user_id=new.user_id and s.character_id=new.id;
  if encounter is null then return new; end if;
  for e in select a from jsonb_array_elements(coalesce(new.data->'activeEffects','[]')) a
    where (a ? 'expires' or jsonb_typeof(a->'remainingSeconds')='number')
      and not exists(select from jsonb_array_elements(coalesce(old.data->'activeEffects','[]')) b where ledger_private.timer_key(a)=ledger_private.timer_key(b))
  loop perform ledger_private.write_encounter_event(encounter,'effect_started',new.name||' · '||coalesce(e->>'name','Effect')); end loop;
  for e in select a from jsonb_array_elements(coalesce(old.data->'activeEffects','[]')) a
    where (a ? 'expires' or jsonb_typeof(a->'remainingSeconds')='number')
      and not exists(select from jsonb_array_elements(coalesce(new.data->'activeEffects','[]')) b where ledger_private.timer_key(a)=ledger_private.timer_key(b))
  loop perform ledger_private.write_encounter_event(encounter,'effect_ended',new.name||' · '||coalesce(e->>'name','Effect')); end loop;
  return new;
end $$;
revoke all on function ledger_private.log_sheet_effects() from public,anon,authenticated;
create trigger log_sheet_effects after update of data on public.characters for each row
  when (new.live_timer_version=old.live_timer_version and (new.data->'activeEffects') is distinct from (old.data->'activeEffects'))
  execute function ledger_private.log_sheet_effects();

create function public.ledger_adjust_effect(p_campaign uuid,p_owner uuid,p_sheet text,p_key text,p_before numeric,p_seconds int)
returns void language plpgsql security definer set search_path='' as $$
declare encounter uuid; sheet jsonb; effect jsonb; pos int; actor_name text;
begin
  perform 1 from public.ledger_campaigns where id=p_campaign and dm_id=auth.uid() for update;
  if not found then raise exception 'Only the campaign DM can adjust effects'; end if;
  select (x.state->>'id')::uuid into encounter from ledger_private.campaign_encounters x where x.campaign_id=p_campaign;
  if encounter is null then raise exception 'Start a live encounter to adjust an effect'; end if;
  perform 1 from public.ledger_campaign_sheets where campaign_id=p_campaign and user_id=p_owner and character_id=p_sheet for share;
  if not found then raise exception 'Character is no longer shared'; end if;
  select data,name into sheet,actor_name from public.characters where user_id=p_owner and id=p_sheet for update nowait;
  select value,ordinality-1 into effect,pos from jsonb_array_elements(sheet->'activeEffects') with ordinality where ledger_private.timer_key(value)=p_key;
  if effect is null or (effect->>'remainingSeconds')::numeric is distinct from p_before then raise exception 'Effect changed. Review the current duration.'; end if;
  if p_seconds is null or p_seconds<0 or (p_seconds>0 and (p_before is null or effect ? 'expires')) then raise exception 'Choose a valid duration'; end if;
  if p_seconds=0 then
    sheet:=jsonb_set(sheet,'{activeEffects}',(sheet->'activeEffects')-pos);
    if effect->>'concentration'=sheet->>'concentration' then sheet:=sheet||'{"concentration":null,"concentrationChecks":[]}'; end if;
    if effect->>'stateKey'='rage' and sheet ? 'totemWarrior' then sheet:=jsonb_set(sheet,'{totemWarrior,activeRage}','false'); end if;
  else sheet:=jsonb_set(sheet,array['activeEffects',pos::text,'remainingSeconds'],to_jsonb(p_seconds)); end if;
  update public.characters set data=sheet,live_timer_version=live_timer_version+1 where user_id=p_owner and id=p_sheet;
  perform ledger_private.write_encounter_event(encounter,'effect_adjusted',actor_name||' · '||coalesce(effect->>'name','Effect')||case when p_seconds=0 then ' ended' else ' · '||p_seconds::text||' seconds remaining' end);
  update public.ledger_campaigns set revision=revision+1 where id=p_campaign;
exception when lock_not_available then
  raise exception 'The sheet is being saved. Retry the correction.' using errcode='55P03';
end $;
revoke all on function public.ledger_adjust_effect(uuid,uuid,text,text,numeric,int) from public,anon;
grant execute on function public.ledger_adjust_effect(uuid,uuid,text,text,numeric,int) to authenticated;
