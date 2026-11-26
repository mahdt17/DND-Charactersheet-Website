begin;
do $ begin
  if has_table_privilege('anon','public.characters','TRUNCATE') or has_table_privilege('authenticated','public.characters','TRUNCATE')
    or has_column_privilege('authenticated','public.characters','live_timer_version','UPDATE')
    or has_column_privilege('authenticated','public.characters','live_timer_expirations','INSERT')
    or not has_column_privilege('authenticated','public.characters','data','UPDATE') then raise exception 'Unexpected sheet grants'; end if;
end $;
insert into auth.users(id) values ('51360000-0000-4000-8000-000000000001'),('51360000-0000-4000-8000-000000000002');
set local role authenticated;
select set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
insert into public.ledger_campaigns(name) values('Clock fixture');
select set_config('clock.c',(select id::text from public.ledger_campaigns where name='Clock fixture'),true);
select public.ledger_combat_command(current_setting('clock.c')::uuid,null,'start','{"name":"Test rounds"}');
select set_config('clock.e',public.ledger_combat_state(current_setting('clock.c')::uuid)->>'id',true);
select set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000002',true);
insert into public.characters(user_id,id,name,data) values(auth.uid(),'sheet','Solo','{}');
insert into public.ledger_campaign_sheets(character_id,campaign_id) values('sheet',current_setting('clock.c')::uuid);
do $$ declare c uuid:=current_setting('clock.c')::uuid; e uuid:=current_setting('clock.e')::uuid; before_tick bigint;
begin
  perform public.ledger_combat_command(c,e,'roll','{"character":"sheet","initiative":5}');
  begin perform public.ledger_advance_turn(c,e,0);raise exception 'advanced as player';
  exception when raise_exception then if sqlerrm='advanced as player' then raise; end if; end;
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
  perform public.ledger_combat_command(c,e,'add','{"name":"Secret","kind":"Enemy","initiative":20,"id":"51360000-0000-4000-8000-000000000004"}');
  perform public.ledger_advance_turn(c,e,0);
  perform public.ledger_advance_turn(c,e,0);
  if public.ledger_combat_state(c)#>>'{turn,serial}'<>'1' then raise exception 'Retry skipped a turn'; end if;
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000002',true);
  if public.ledger_combat_state(c)::text like '%Secret%' or public.ledger_combat_state(c)#>>'{turn,actor}' is not null then raise exception 'Hidden actor leaked'; end if;
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
  perform public.ledger_advance_turn(c,e,1);
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000002',true);
  update public.characters set data='{"concentration":"Focus","activeEffects":[{"id":"test","name":"Test","remainingSeconds":60},{"id":"short","name":"Focus","remainingSeconds":6,"concentration":"Focus"},{"id":"shield","expires":"start-next-turn","remainingSeconds":6}]}' where user_id=auth.uid() and id='sheet';
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
  perform public.ledger_advance_turn(c,e,2);
  if (select data#>>'{activeEffects,0,remainingSeconds}' from public.characters where id='sheet') is distinct from '60' then raise exception 'Partial round deducted'; end if;
  select revision into before_tick from public.ledger_campaigns where id=c;
  perform public.ledger_advance_turn(c,e,3);
  if (select revision from public.ledger_campaigns where id=c)<>before_tick+1 then raise exception 'A turn with sheet changes must send one campaign notification'; end if;
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000002',true);
  update public.characters set data='{"notes":"offline","concentration":"Focus","activeEffects":[{"id":"test","remainingSeconds":60},{"id":"short","remainingSeconds":6,"concentration":"Focus"},{"id":"shield","expires":"start-next-turn","remainingSeconds":6}]}' where user_id=auth.uid() and id='sheet';
  if not exists(select from public.characters where user_id=auth.uid() and id='sheet' and data#>>'{activeEffects,0,remainingSeconds}'='54' and jsonb_array_length(data->'activeEffects')=1 and data->>'concentration' is null and data->>'notes'='offline') then raise exception 'Concurrent save corrupted clock'; end if;
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
  -- Start a separate minute-long effect at the player's initiative position.
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000002',true);
  begin perform public.ledger_adjust_effect(c,auth.uid(),'sheet','test',54,999); raise exception 'Player used DM correction';
  exception when raise_exception then if sqlerrm='Player used DM correction' then raise; end if; end;
  update public.characters set data=jsonb_set(data,'{activeEffects}',(data->'activeEffects')||'[{"id":"minute","name":"Minute","remainingSeconds":60}]')
    where user_id=auth.uid() and id='sheet';
  perform set_config('request.jwt.claim.sub','51360000-0000-4000-8000-000000000001',true);
  perform public.ledger_adjust_effect(c,'51360000-0000-4000-8000-000000000002','sheet','test',54,18);
  begin perform public.ledger_adjust_effect(c,'51360000-0000-4000-8000-000000000002','sheet','test',54,0); raise exception 'Stale DM correction applied';
  exception when raise_exception then if sqlerrm='Stale DM correction applied' then raise; end if; end;
  perform public.ledger_adjust_effect(c,'51360000-0000-4000-8000-000000000002','sheet','test',18,0);
  for serial in 4..21 loop perform public.ledger_advance_turn(c,e,serial); end loop;
  if (select data#>>'{activeEffects,0,remainingSeconds}' from public.characters where id='sheet') is distinct from '6' then raise exception 'Wrong duration after nine rotations'; end if;
  perform public.ledger_advance_turn(c,e,22);
  perform public.ledger_advance_turn(c,e,23);
  if (select data->'activeEffects' from public.characters where id='sheet') is distinct from '[]'::jsonb then raise exception 'Minute did not expire after ten full rotations'; end if;
  perform public.ledger_combat_command(c,e,'end','{}');
  if not exists(select from jsonb_array_elements(public.ledger_download_encounter(c,e)->'events') ev where ev->>'action'='expired') then raise exception 'Missing log expiry'; end if;
end $$;
rollback;
