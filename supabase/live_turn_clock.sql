-- Apply in one transaction after encounter_logs.sql.
alter table public.characters add column live_timer_version bigint not null default 0,
  add column live_timer_floor bigint not null default 0,
  add column live_timer_expirations jsonb not null default '[]';
create function ledger_private.timer_key(effect jsonb) returns text language sql immutable set search_path='' as $$
  select coalesce($1->>'timerInstance',$1->>'id')
$$;

-- Preserve clock updates when an older sheet autosave arrives after turn advancement.
create function ledger_private.preserve_live_timers() returns trigger language plpgsql set search_path='' as $$
declare seen bigint; current_effect jsonb; e jsonb; kept jsonb:='[]'; expired_concentration text;
begin
  if new.live_timer_version<>old.live_timer_version then
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
  prior_key text; combatants jsonb; sheet record; e jsonb; effects jsonb; sheet_data jsonb; floor_version bigint; anchors jsonb; sheet_anchors jsonb;
  anchor text; k text; participant text; ticks boolean; ended boolean; starting boolean; ending boolean; expirations jsonb;
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
  for sheet in select c.user_id,c.id,c.name,c.data,c.live_timer_version,c.live_timer_floor,c.live_timer_expirations
    from public.ledger_campaign_sheets s join public.characters c on (c.user_id,c.id)=(s.user_id,s.character_id)
    where s.campaign_id=p_campaign and jsonb_typeof(c.data->'activeEffects')='array' and c.data->'activeEffects'<>'[]'::jsonb
    order by c.user_id,c.id for update of c loop
    participant:=sheet.user_id::text||':'||sheet.id;
    sheet_anchors:='{}'; effects:='[]'; sheet_data:=sheet.data; expirations:=sheet.live_timer_expirations;
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
        expirations:=expirations||jsonb_build_array(jsonb_build_object('key',k,'v',sheet.live_timer_version+1));
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
      floor_version:=sheet.live_timer_floor;
      if jsonb_array_length(expirations)>128 then
        select greatest(floor_version,max((value->>'v')::bigint)) into floor_version from jsonb_array_elements(expirations) with ordinality
          where ordinality<=jsonb_array_length(expirations)-128;
        select jsonb_agg(value order by ordinality) into expirations from jsonb_array_elements(expirations) with ordinality
          where ordinality>jsonb_array_length(expirations)-128;
      end if;
      update public.characters set live_timer_floor=floor_version,data=jsonb_set(sheet_data,'{activeEffects}',effects),live_timer_version=live_timer_version+1,
        live_timer_expirations=expirations where user_id=sheet.user_id and id=sheet.id;
    end if;
  end loop;
  state_row:=state_row||jsonb_build_object('timerAnchors',anchors,'turn',jsonb_build_object('key',next_key,'actor',next_actor->'id','round',next_round,'serial',p_serial+1));
  update ledger_private.campaign_encounters set state=state_row where campaign_id=p_campaign;
  update public.ledger_campaigns set revision=revision+1 where id=p_campaign;
end $$;
revoke all on function public.ledger_advance_turn(uuid,uuid,bigint) from public,anon;
grant execute on function public.ledger_advance_turn(uuid,uuid,bigint) to authenticated;
