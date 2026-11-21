-- Install in one transaction so an encounter cannot end between setup and cutover.
lock table public.ledger_campaigns in share row exclusive mode;
create table ledger_private.encounter_logs (
  id uuid primary key, campaign_id uuid not null references public.ledger_campaigns(id) on delete cascade,
  name text not null, started_at timestamptz, ended_at timestamptz, final_order jsonb
);
create index encounter_logs_by_campaign on ledger_private.encounter_logs(campaign_id,ended_at desc);
create index encounter_logs_expiry on ledger_private.encounter_logs(ended_at) where ended_at is not null;
create table ledger_private.encounter_events (
  seq bigint generated always as identity primary key,
  encounter_id uuid not null references ledger_private.encounter_logs(id) on delete cascade,
  at timestamptz not null default clock_timestamp(), action text not null, participant text not null, initiative int
);
create index encounter_events_in_order on ledger_private.encounter_events(encounter_id,seq);
alter table ledger_private.encounter_logs enable row level security;
alter table ledger_private.encounter_events enable row level security;
revoke all on ledger_private.encounter_logs,ledger_private.encounter_events from public,anon,authenticated;

-- An encounter already running at installation can still be downloaded. Its true start time is unknown.
insert into ledger_private.encounter_logs(id,campaign_id,name)
select (state->>'id')::uuid,campaign_id,state->>'name' from ledger_private.campaign_encounters;

create function ledger_private.write_encounter_event(encounter uuid, action text, participant text, initiative int default null)
returns void language sql set search_path='' as $$
  insert into ledger_private.encounter_events(encounter_id,action,participant,initiative) values($1,$2,$3,$4);
$$;
revoke all on function ledger_private.write_encounter_event(uuid,text,text,int) from public,anon,authenticated;

create or replace function public.ledger_combat_command(p_campaign uuid,p_encounter uuid,p_action text,p_payload jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare encounter jsonb; dm uuid; actor text; score integer; label text; batch jsonb; item jsonb; visibility jsonb; encounter_id uuid; actor_name text; default_visible boolean;
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
  encounter_id:=(encounter->>'id')::uuid;
  if p_action='start' then
    if encounter is not null then raise exception 'An encounter is already live'; end if;
    label:=btrim(p_payload->>'name');
    if coalesce(length(label),0) not between 1 and 120 then raise exception 'Enter an encounter name'; end if;
    encounter_id:=gen_random_uuid();
    insert into ledger_private.encounter_logs(id,campaign_id,name,started_at) values(encounter_id,p_campaign,label,now());
    encounter:=jsonb_build_object('id',encounter_id,'name',label,'rolls','{}'::jsonb,'npcs','[]'::jsonb);
  else
    if encounter is null or p_encounter is distinct from (encounter->>'id')::uuid then raise exception 'This encounter has ended'; end if;
    visibility:=coalesce(encounter->'visibility','{}');
    case
      when p_action='roll' then
        actor:=auth.uid()::text||':'||(p_payload->>'character');
        if (encounter->'rolls') ? actor then return; end if;
        score:=(p_payload->>'initiative')::integer;
        if score is null or score not between -999 and 999 then raise exception 'Invalid initiative'; end if;
        select name into strict actor_name from public.characters where user_id=auth.uid() and id=p_payload->>'character';
        perform ledger_private.write_encounter_event(encounter_id,'initiative',actor_name,score);
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
          perform ledger_private.write_encounter_event(encounter_id,'added',label,score);
          encounter:=jsonb_set(encounter,'{npcs}',(encounter->'npcs')||jsonb_build_array(
            jsonb_build_object('id',actor,'name',label,'kind',item->>'kind','initiative',score)));
        end loop;
      when p_action='visibility' then
        actor:=p_payload->>'id';
        if jsonb_typeof(p_payload->'visible') is distinct from 'boolean' then raise exception 'Choose a visibility'; end if;
        select n->>'name',false into actor_name,default_visible from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor;
        if not found then
          select ch.name,true into actor_name,default_visible from public.ledger_campaign_sheets s
            join public.characters ch on (ch.user_id,ch.id)=(s.user_id,s.character_id)
            where s.campaign_id=p_campaign and s.user_id::text||':'||s.character_id=actor;
          if not found then raise exception 'This combatant is no longer in the encounter'; end if;
        end if;
        if coalesce((visibility->>actor)::boolean,default_visible)=(p_payload->>'visible')::boolean then return; end if;
        perform ledger_private.write_encounter_event(encounter_id,case when (p_payload->>'visible')::boolean then 'revealed' else 'hidden' end,actor_name);
        encounter:=jsonb_set(encounter,'{visibility}',visibility||jsonb_build_object(actor,p_payload->'visible'));
      when p_action='remove' then
        actor:=p_payload->>'id';
        if actor is null then raise exception 'Missing combatant ID'; end if;
        select n->>'name' into actor_name from jsonb_array_elements(encounter->'npcs') n where n->>'id'=actor;
        if not found then return; end if;
        perform ledger_private.write_encounter_event(encounter_id,'removed',actor_name);
        encounter:=jsonb_set(encounter,'{visibility}',visibility-actor);
        encounter:=jsonb_set(encounter,'{npcs}',(select coalesce(jsonb_agg(n),'[]') from jsonb_array_elements(encounter->'npcs') n where n->>'id'<>actor));
      when p_action='end' then
        update ledger_private.encounter_logs set ended_at=now(),final_order=(
          select coalesce(jsonb_agg(row - 'id' order by (row->>'initiative')::int desc nulls last,row->>'name',row->>'id'),'[]')
          from jsonb_array_elements(public.ledger_combat_state(p_campaign)->'entries') row
        ) where id=encounter_id;
        encounter:=null;
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


create function public.ledger_ended_encounters(p_campaign uuid)
returns table(id uuid,name text,ended_at timestamptz) language sql stable security definer set search_path='' as $$
  select l.id,l.name,l.ended_at from ledger_private.encounter_logs l join public.ledger_campaigns c on c.id=l.campaign_id
  where c.id=p_campaign and c.dm_id=auth.uid() and l.ended_at>now()-interval '7 days' order by l.ended_at desc,l.id;
$$;
create function public.ledger_download_encounter(p_campaign uuid,p_encounter uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object('version',1,'campaign',c.name,'encounter',l.name,'startedAt',l.started_at,
    'endedAt',l.ended_at,'finalOrder',l.final_order,'events',(
      select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('at',e.at,'action',e.action,
        'participant',e.participant,'initiative',e.initiative)) order by e.seq),'[]')
      from ledger_private.encounter_events e where e.encounter_id=l.id))
    from ledger_private.encounter_logs l join public.ledger_campaigns c on c.id=l.campaign_id
    where c.id=p_campaign and c.dm_id=auth.uid() and l.id=p_encounter and l.ended_at>now()-interval '7 days';
$$;
revoke all on function public.ledger_ended_encounters(uuid),public.ledger_download_encounter(uuid,uuid) from public,anon;
grant execute on function public.ledger_ended_encounters(uuid),public.ledger_download_encounter(uuid,uuid) to authenticated;

create extension if not exists pg_cron;
select cron.schedule('ledger-expire-encounter-logs','17 3 * * *',$job$
  delete from ledger_private.encounter_logs where ended_at<=now()-interval '7 days';
  delete from cron.job_run_details where jobid=(select jobid from cron.job where jobname='ledger-expire-encounter-logs')
    and end_time<now()-interval '7 days';
$job$);
