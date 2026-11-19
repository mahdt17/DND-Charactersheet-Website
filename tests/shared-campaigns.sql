-- Exercise real account isolation with transaction-local fixtures. Run as the database owner.
begin;
insert into auth.users(id) values
 ('a9702011-13de-4bf7-88d3-b46278accf01'),('a9702011-13de-4bf7-88d3-b46278accf02'),('a9702011-13de-4bf7-88d3-b46278accf03');
set local role authenticated;
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf01',true);
insert into public.ledger_campaigns(name) values ('Test campaign');
select set_config('ledger_test.invite',(select id::text from public.ledger_campaigns where name='Test campaign'),true);
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf02',true);
insert into public.characters(user_id,id,name,data) values
 (auth.uid(),'same-id','Shared hero','{"hp":{"current":12}}'),(auth.uid(),'private','Private sheet','{}'),(auth.uid(),'ledger-workspace','Private notebook','{}');
do $$ begin
 if exists(select from public.ledger_campaigns) then raise exception 'Uninvited player saw a campaign'; end if;
 begin
   insert into public.ledger_campaign_sheets(campaign_id,character_id) values(current_setting('ledger_test.invite')::uuid,'ledger-workspace');
   raise exception 'Workspace was shared';
 exception when check_violation then null; end;
end $$;
insert into public.ledger_campaign_sheets(campaign_id,character_id) values(current_setting('ledger_test.invite')::uuid,'same-id');
do $$ begin
 delete from public.ledger_campaigns where id=current_setting('ledger_test.invite')::uuid;
 if found then raise exception 'Player deleted the DM campaign'; end if;
end $$;
update public.characters set data='{"hp":{"current":7}}' where user_id=auth.uid() and id='same-id';
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf03',true);
insert into public.characters(user_id,id,name) values(auth.uid(),'same-id','Different owner');
do $$ begin
 if exists(select from public.ledger_campaign_sheets) or exists(select from public.characters where user_id<>auth.uid()) then raise exception 'Third account saw another sheet'; end if;
end $$;
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf01',true);
do $$ begin
 if (select count(*) from public.characters)<>1 or (select data#>>'{hp,current}' from public.characters where id='same-id') is distinct from '7' then raise exception 'DM roster data incorrect'; end if;
 if (select revision from public.ledger_campaigns where id=current_setting('ledger_test.invite')::uuid)<>2 then raise exception 'Save signal missing'; end if;
 update public.characters set name='Changed by DM' where id='same-id';
 if found then raise exception 'DM could edit character'; end if;
end $$;
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf02',true);
delete from public.ledger_campaign_sheets where character_id='same-id';
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf01',true);
do $$ begin
 if exists(select from public.characters) then raise exception 'DM retained access after unsharing'; end if;
end $$;
-- Copies, ordinary player saves and upserts must respect the separate sheet grant.
reset role;
update public.characters set institute_access=true where id='same-id' and user_id='a9702011-13de-4bf7-88d3-b46278accf02';
set local role authenticated;
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf03',true);
insert into public.characters(user_id,id,institute_access) values(auth.uid(),'new-id',true);
update public.characters set institute_access=true where user_id=auth.uid();
do $$ begin
 if exists(select from public.characters where user_id=auth.uid() and institute_access) then raise exception 'Player granted institute access'; end if;
end $$;
select set_config('request.jwt.claim.sub','a9702011-13de-4bf7-88d3-b46278accf02',true);
insert into public.characters(user_id,id,name) values(auth.uid(),'same-id','Renamed hero')
 on conflict(user_id,id) do update set name=excluded.name;
do $$ begin
 if not exists(select from public.characters where user_id=auth.uid() and id='same-id' and institute_access) then raise exception 'Owner save lost grant'; end if;
end $$;
rollback;
