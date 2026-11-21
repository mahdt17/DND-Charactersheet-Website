begin;
insert into auth.users(id) values ('84360000-0000-4000-8000-000000000001'),('84360000-0000-4000-8000-000000000002'),('84360000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
insert into public.ledger_campaigns(name) values ('Reward and combat fixture');
select set_config('fixture.c',(select id::text from public.ledger_campaigns where name='Reward and combat fixture'),true);
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
insert into public.characters(user_id,id,name,data) values(auth.uid(),'hero','Arden','{"feats":[{"id":"class:fixture","name":"Old feat","automatic":true}]}');
insert into public.ledger_campaign_sheets(character_id,campaign_id) values('hero',current_setting('fixture.c')::uuid);
do $$ declare c uuid:=current_setting('fixture.c')::uuid;
begin
  begin perform public.ledger_change_reward(c,auth.uid(),'hero','inventory',true,'{"id":"a","name":"A"}'); raise exception 'Player granted reward'; exception when raise_exception then if sqlerrm='Player granted reward' then raise; end if; end;
  begin perform public.ledger_combat_command(c,null,'start','{"name":"Unauthorized"}'); raise exception 'Player started combat'; exception when raise_exception then if sqlerrm='Player started combat' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid; player uuid:='84360000-0000-4000-8000-000000000002';
begin
  perform public.ledger_change_reward(c,player,'hero','inventory',true,'{"id":"s","name":"Seal","qty":2}');
  perform public.ledger_change_reward(c,player,'hero','feats',false,'{"id":"class:fixture","name":"Old feat","automatic":true}');
  perform public.ledger_combat_command(c,null,'start','{"name":"Gate"}');
  perform set_config('fixture.e',public.ledger_combat_state(c)->>'id',true);
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000003',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid;
begin
  if public.ledger_combat_state(c) is not null then raise exception 'Outsider read encounter'; end if;
  begin perform public.ledger_combat_command(c,current_setting('fixture.e')::uuid,'roll','{"character":"hero","initiative":20}'); raise exception 'Outsider rolled'; exception when raise_exception then if sqlerrm='Outsider rolled' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
update public.characters set data='{"hp":{"current":8},"feats":[{"id":"class:fixture","name":"Old feat","automatic":true}],"inventory":[{"id":"p","name":"Player item"}]}' where id='hero' and user_id=auth.uid();
do $$ declare c uuid:=current_setting('fixture.c')::uuid; encounter uuid:=current_setting('fixture.e')::uuid; sheet jsonb;
begin
  select data into sheet from public.characters where id='hero' and user_id=auth.uid();
  if sheet->'feats'<>'[]' or sheet->'campaignRemovedFeatIds' is distinct from '["class:fixture"]'::jsonb or jsonb_array_length(sheet->'inventory')<>2 or sheet#>>'{hp,current}'<>'8' then raise exception 'Stale save lost edits'; end if;
  perform public.ledger_combat_command(c,encounter,'roll','{"character":"hero","initiative":-2}');
  perform public.ledger_combat_command(c,encounter,'roll','{"character":"hero","initiative":20}');
  if public.ledger_combat_state(c)#>>'{entries,0,initiative}' is distinct from '-2' then raise exception 'Initiative overwritten'; end if;
end $$;
do $$ begin
  begin perform public.ledger_edit_shared_sheet(current_setting('fixture.c')::uuid,auth.uid(),'hero','notes','{"before":"","after":"Invalid"}');
    raise exception 'Player used DM editor'; exception when raise_exception then if sqlerrm='Player used DM editor' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid; player uuid:='84360000-0000-4000-8000-000000000002';
begin
  perform public.ledger_edit_shared_sheet(c,player,'hero','remove_quantity','{"item":{"id":"s","qty":2},"amount":1}');
  begin perform public.ledger_edit_shared_sheet(c,player,'hero','remove_quantity','{"item":{"id":"s","qty":2},"amount":1}');
    raise exception 'Stale removal applied twice'; exception when raise_exception then if sqlerrm='Stale removal applied twice' then raise; end if; end;
  perform public.ledger_edit_shared_sheet(c,player,'hero','notes','{"before":"","after":"DM journal"}');
  begin perform public.ledger_edit_shared_sheet(c,player,'hero','notes','{"before":"","after":"Stale draft"}');
    raise exception 'Stale notes overwrote player'; exception when raise_exception then if sqlerrm='Stale notes overwrote player' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
update public.characters set data='{"campaignRewardVersion":2,"hp":{"current":5},"inventory":[{"id":"s","qty":2,"notes":"Player annotation"}]}' where user_id=auth.uid() and id='hero';
do $$ declare sheet jsonb;
begin
  select data into sheet from public.characters where user_id=auth.uid() and id='hero';
  if sheet->>'notes' is distinct from 'DM journal' or sheet#>>'{inventory,0,qty}' is distinct from '1'
     or sheet#>>'{inventory,0,notes}' is distinct from 'Player annotation' then raise exception 'Stale save lost shared edits'; end if;
end $$;
update public.characters set data=jsonb_set(data,'{notes}','"Player follow-up"') where user_id=auth.uid() and id='hero';
update public.characters set data='{"campaignRewardVersion":2,"hp":{"current":7},"inventory":[{"id":"s","qty":2}]}' where user_id=auth.uid() and id='hero';
do $$ begin
  if (select data->>'notes' from public.characters where user_id=auth.uid() and id='hero') is distinct from 'Player follow-up'
    then raise exception 'Stale sheet restored obsolete journal'; end if;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid; e uuid:=current_setting('fixture.e')::uuid;
  target text:='84360000-0000-4000-8000-000000000002:hero';
  enemy jsonb:='{"id":"84360000-0000-4000-8000-000000000004","name":"Secret dragon","kind":"Enemy","initiative":23,"visible":true}';
begin
  perform public.ledger_combat_command(c,e,'add_group',jsonb_build_object('entries',jsonb_build_array(enemy)));
  perform public.ledger_combat_command(c,e,'add_group',jsonb_build_object('entries',jsonb_build_array(enemy)));
  perform public.ledger_combat_command(c,e,'visibility',jsonb_build_object('id',target,'visible',false));
  if jsonb_array_length(public.ledger_combat_state(c)->'entries')<>2 then raise exception 'DM roster incomplete or duplicate'; end if;
  perform set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
  if public.ledger_combat_state(c)->'entries'<>'[]' or public.ledger_combat_state(c)::text like '%Secret dragon%'
     or public.ledger_combat_state(c)->'submittedCharacterIds' is distinct from '["hero"]'::jsonb then raise exception 'Hidden encounter data or own roll status incorrect'; end if;
  if exists(select from public.ledger_campaigns row where row.id=c and (to_jsonb(row) ? 'live_encounter' or to_jsonb(row)::text like '%Secret dragon%')) or
     exists(select from information_schema.role_table_grants where grantee in ('PUBLIC',current_user) and table_schema='ledger_private' and table_name='campaign_encounters' and privilege_type='SELECT') then raise exception 'Encounter publicly readable'; end if;
  begin
    perform public.ledger_combat_command(c,e,'visibility',jsonb_build_object('id',enemy->>'id','visible',true));
    raise exception 'Player revealed enemy';
  exception when raise_exception then if sqlerrm='Player revealed enemy' then raise; end if; end;
  perform set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
  perform public.ledger_combat_command(c,e,'visibility',jsonb_build_object('id',enemy->>'id','visible',true));
  perform set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
  if jsonb_array_length(public.ledger_combat_state(c)->'entries')<>1 or public.ledger_combat_state(c)#>>'{entries,0,name}' is distinct from 'Secret dragon' then raise exception 'Revealed enemy missing'; end if;
  perform set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
  perform public.ledger_combat_command(c,e,'remove',enemy);
end $$;
delete from public.ledger_campaign_sheets where campaign_id=current_setting('fixture.c')::uuid and user_id='84360000-0000-4000-8000-000000000002' and character_id='hero';
do $$ begin
  begin perform public.ledger_edit_shared_sheet(current_setting('fixture.c')::uuid,'84360000-0000-4000-8000-000000000002','hero','notes','{"before":"DM journal","after":"Invalid"}');
    raise exception 'DM edited removed character'; exception when raise_exception then if sqlerrm='DM edited removed character' then raise; end if; end;
end $$;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid;
begin
  if public.ledger_combat_state(c)->'entries'<>'[]' then raise exception 'Departed character remained in combat'; end if;
  begin perform public.ledger_change_reward(c,'84360000-0000-4000-8000-000000000002','hero','inventory',false,'{"id":"s"}'); raise exception 'DM edited departed character'; exception when raise_exception then if sqlerrm='DM edited departed character' then raise; end if; end;
end $$;
do $$ declare c uuid:=current_setting('fixture.c')::uuid; e uuid:=current_setting('fixture.e')::uuid; report jsonb;
begin
  perform public.ledger_combat_command(c,e,'end','{}');
  report:=public.ledger_download_encounter(c,e);
  if report is null or report#>>'{events,0,action}' is distinct from 'initiative' or
     (select count(*) from public.ledger_ended_encounters(c))<>1 then raise exception 'Missing DM archive'; end if;
  perform set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
  insert into public.ledger_campaign_sheets(character_id,campaign_id) values('hero',c);
  if public.ledger_download_encounter(c,e) is not null or exists(select from public.ledger_ended_encounters(c))
    then raise exception 'Player accessed DM archive'; end if;
end $$;
reset role;
update ledger_private.encounter_logs set ended_at=now()-interval '7 days' where id=current_setting('fixture.e')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ begin
  if public.ledger_download_encounter(current_setting('fixture.c')::uuid,current_setting('fixture.e')::uuid) is not null
    then raise exception 'Expired log was downloadable'; end if;
end $$;
rollback;
