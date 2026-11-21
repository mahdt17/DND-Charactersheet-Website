begin;
insert into auth.users(id) values ('84360000-0000-4000-8000-000000000001'),('84360000-0000-4000-8000-000000000002'),('84360000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
insert into public.ledger_campaigns(name) values ('Reward and combat fixture');
select set_config('fixture.c',(select id::text from public.ledger_campaigns where name='Reward and combat fixture'),true);
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000002',true);
insert into public.characters(user_id,id,name,data) values(auth.uid(),'hero','Arden','{"feats":[{"name":"Old feat"}]}');
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
  perform public.ledger_change_reward(c,player,'hero','feats',false,'{"name":"Old feat"}');
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
update public.characters set data='{"hp":{"current":8},"feats":[{"name":"Old feat"}],"inventory":[{"id":"p","name":"Player item"}]}' where id='hero' and user_id=auth.uid();
do $$ declare c uuid:=current_setting('fixture.c')::uuid; encounter uuid:=current_setting('fixture.e')::uuid; sheet jsonb;
begin
  select data into sheet from public.characters where id='hero' and user_id=auth.uid();
  if sheet->'feats'<>'[]' or jsonb_array_length(sheet->'inventory')<>2 or sheet#>>'{hp,current}'<>'8' then raise exception 'Stale save lost edits'; end if;
  perform public.ledger_combat_command(c,encounter,'roll','{"character":"hero","initiative":-2}');
  perform public.ledger_combat_command(c,encounter,'roll','{"character":"hero","initiative":20}');
  if public.ledger_combat_state(c)#>>'{entries,0,initiative}' is distinct from '-2' then raise exception 'Initiative overwritten'; end if;
end $$;
delete from public.ledger_campaign_sheets where user_id=auth.uid() and character_id='hero';
select set_config('request.jwt.claim.sub','84360000-0000-4000-8000-000000000001',true);
do $$ declare c uuid:=current_setting('fixture.c')::uuid;
begin
  if public.ledger_combat_state(c)->'entries'<>'[]' then raise exception 'Departed character remained in combat'; end if;
  begin perform public.ledger_change_reward(c,'84360000-0000-4000-8000-000000000002','hero','inventory',false,'{"id":"s"}'); raise exception 'DM edited departed character'; exception when raise_exception then if sqlerrm='DM edited departed character' then raise; end if; end;
end $$;
rollback;
