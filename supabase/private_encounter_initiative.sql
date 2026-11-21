-- Run as one transaction. Only revision notifications belong on the published table.
lock table public.ledger_campaigns in access exclusive mode;
create table ledger_private.campaign_encounters (
  campaign_id uuid primary key references public.ledger_campaigns(id) on delete cascade,
  state jsonb not null
);
revoke all on ledger_private.campaign_encounters from public, anon, authenticated;
alter table ledger_private.campaign_encounters enable row level security;
insert into ledger_private.campaign_encounters(campaign_id,state)
select id,live_encounter from public.ledger_campaigns where live_encounter is not null;
alter table public.ledger_campaigns drop column live_encounter;

create or replace function public.ledger_combat_state(p_campaign uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare encounter jsonb; is_dm boolean; entries jsonb; submitted jsonb;
begin
  select e.state,c.dm_id=auth.uid() into encounter,is_dm
  from public.ledger_campaigns c join ledger_private.campaign_encounters e on e.campaign_id=c.id
  where c.id=p_campaign and (c.dm_id=auth.uid() or exists (
    select from public.ledger_campaign_sheets s where s.campaign_id=c.id and s.user_id=auth.uid()
  ));
  if not found then return null; end if;

  with party as (
    select s.user_id,s.character_id,s.user_id::text||':'||s.character_id as id,ch.name
    from public.ledger_campaign_sheets s join public.characters ch on (ch.user_id,ch.id)=(s.user_id,s.character_id)
    where s.campaign_id=p_campaign
  ), combatants as (
    select jsonb_build_object('id',id,'name',name,'kind','Player','initiative',encounter->'rolls'->id) as row,
      coalesce((encounter->'visibility'->>id)::boolean,true) as visible from party
    union all
    select n,coalesce((encounter->'visibility'->>(n->>'id'))::boolean,false)
    from jsonb_array_elements(encounter->'npcs') n
  )
  select (select coalesce(jsonb_agg(row||jsonb_build_object('visible',visible)),'[]') from combatants where is_dm or visible),
         (select coalesce(jsonb_agg(character_id),'[]') from party where user_id=auth.uid() and (encounter->'rolls') ? id)
  into entries,submitted;
  return jsonb_build_object('id',encounter->'id','name',encounter->'name','entries',entries,'submittedCharacterIds',submitted);
end $$;

create or replace function public.ledger_combat_command(p_campaign uuid,p_encounter uuid,p_action text,p_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare encounter jsonb; dm uuid; actor text; score integer; label text; batch jsonb; item jsonb; visibility jsonb;
begin
  if auth.uid() is null then raise exception 'Sign in to use live combat'; end if;
  if p_action='roll' then
    perform 1 from public.ledger_campaign_sheets where campaign_id=p_campaign and user_id=auth.uid()
      and character_id=p_payload->>'character' for share;
    if not found then raise exception 'Share this character with the campaign to roll'; end if;
  end if;
  select dm_id into dm from public.ledger_campaigns where id=p_campaign for update;
  if not found or (p_action is distinct from 'roll' and dm<>auth.uid()) then raise exception 'Campaign action unavailable'; end if;
  select state into encounter from ledger_private.campaign_encounters where campaign_id=p_campaign;
  if p_action='start' then
    if encounter is not null then raise exception 'An encounter is already live'; end if;
    label:=btrim(p_payload->>'name');
    if coalesce(length(label),0) not between 1 and 120 then raise exception 'Enter an encounter name'; end if;
    encounter:=jsonb_build_object('id',gen_random_uuid(),'name',label,'rolls','{}'::jsonb,'npcs','[]'::jsonb);
  else
    if encounter is null or p_encounter is distinct from (encounter->>'id')::uuid then raise exception 'This encounter has ended'; end if;
    visibility:=coalesce(encounter->'visibility','{}');
    case
      when p_action='roll' then
        actor:=auth.uid()::text||':'||(p_payload->>'character');
        if (encounter->'rolls') ? actor then return; end if;
        score:=(p_payload->>'initiative')::integer;
        if score is null or score not between -999 and 999 then raise exception 'Invalid initiative'; end if;
        encounter:=jsonb_set(encounter,array['rolls',actor],to_jsonb(score));
      when p_action in ('add','add_group') then
        batch:=case when p_action='add' then jsonb_build_array(p_payload) else p_payload->'entries' end;
        if jsonb_typeof(batch) is distinct from 'array' or jsonb_array_length(batch) not between 1 and 150 then raise exception 'Choose 1 to 150 combatants'; end if;
        for item in select value from jsonb_array_elements(batch) loop
          actor:=(item->>'id')::uuid::text;
          label:=btrim(item->>'name');
          score:=(item->>'initiative')::integer;
          if actor is null or coalesce(length(label),0) not between 1 and 120 or coalesce(item->>'kind','') not in ('NPC','Enemy')
             or score is null or score not between -999 and 999 then raise exception 'Invalid combatant'; end if;
          if exists(select from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor) then continue; end if;
          if jsonb_array_length(encounter->'npcs')>=150 then raise exception 'Encounter is full'; end if;
          encounter:=jsonb_set(encounter,'{npcs}',(encounter->'npcs')||jsonb_build_array(
            jsonb_build_object('id',actor,'name',label,'kind',item->>'kind','initiative',score)));
        end loop;
      when p_action='visibility' then
        actor:=p_payload->>'id';
        if jsonb_typeof(p_payload->'visible') is distinct from 'boolean' then raise exception 'Choose a visibility'; end if;
        if not exists(select from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor)
           and not exists(select from public.ledger_campaign_sheets s where s.campaign_id=p_campaign and s.user_id::text||':'||s.character_id=actor)
           then raise exception 'This combatant is no longer in the encounter'; end if;
        encounter:=jsonb_set(encounter,'{visibility}',visibility||jsonb_build_object(actor,p_payload->'visible'));
      when p_action='remove' then
        actor:=p_payload->>'id';
        if actor is null then raise exception 'Missing combatant ID'; end if;
        if not exists(select from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor) then return; end if;
        encounter:=jsonb_set(encounter,'{visibility}',visibility-actor);
        encounter:=jsonb_set(encounter,'{npcs}',(select coalesce(jsonb_agg(n),'[]') from jsonb_array_elements(encounter->'npcs') n where n->>'id'<>actor));
      when p_action='end' then encounter:=null;
      else raise exception 'Unknown encounter action';
    end case;
  end if;
  if encounter is null then
    delete from ledger_private.campaign_encounters where campaign_id=p_campaign;
  else
    insert into ledger_private.campaign_encounters(campaign_id,state) values(p_campaign,encounter)
    on conflict(campaign_id) do update set state=excluded.state;
  end if;
  update public.ledger_campaigns set revision=revision+1 where id=p_campaign;
end $$;
