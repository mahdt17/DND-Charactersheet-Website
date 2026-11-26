begin;
insert into auth.users(id) values ('61260000-0000-4000-8000-000000000001'),('61260000-0000-4000-8000-000000000002'),('61260000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub','61260000-0000-4000-8000-000000000001',true);
insert into public.ledger_campaigns(name) values ('Map fixture');
select set_config('map.c',(select id::text from public.ledger_campaigns where name='Map fixture'),true);
do $$ declare c uuid:=current_setting('map.c')::uuid; scene uuid:=gen_random_uuid(); floor uuid:=gen_random_uuid(); room uuid:=gen_random_uuid(); shape jsonb:='{"x":10,"y":15,"width":20,"depth":25}';
begin
  perform public.ledger_prepare_map(c,'scene',scene,null,'{"name":"Private tower"}');
  perform public.ledger_prepare_map(c,'scene',scene,null,'{"name":"Private tower"}');
  perform public.ledger_prepare_map(c,'floor',floor,scene,'{"name":"Secret vault","elevation":-30}');
  perform public.ledger_prepare_map(c,'room',room,floor,shape);
  perform public.ledger_prepare_map(c,'room',room,floor,shape);
  if jsonb_array_length(public.ledger_map_catalog(c))<>1 or public.ledger_map_catalog(c)#>>'{0,floors,0,elevation}' is distinct from '-30' or
     jsonb_array_length(public.ledger_map_floor(c,floor)->'rooms')<>1 then raise exception 'Map creation or replay failed'; end if;
  begin perform public.ledger_prepare_map(c,'room',room,floor,shape||'{"width":35}');raise exception 'Overwrote committed room';
  exception when raise_exception then if sqlerrm='Overwrote committed room' then raise; end if; end;
  begin perform public.ledger_prepare_map(c,'room',gen_random_uuid(),floor,shape||'{"width":200}');raise exception 'Out of bounds room';
  exception when check_violation then null; end;
  -- A new encounter references the same persistent campaign. Closing it preserves the map.
  perform public.ledger_combat_command(c,null,'start','{"name":"Vault fight"}');
  perform public.ledger_combat_command(c,(public.ledger_combat_state(c)->>'id')::uuid,'end','{}');
  if public.ledger_map_floor(c,floor)#>>'{rooms,0,width}' is distinct from '20' then raise exception 'Map reset'; end if;
  perform set_config('request.jwt.claim.sub','61260000-0000-4000-8000-000000000002',true);
  insert into public.characters(user_id,id,name) values(auth.uid(),'hero','Scout');
  insert into public.ledger_campaign_sheets(character_id,campaign_id) values('hero',c);
  if public.ledger_map_catalog(c)<>'[]' or public.ledger_map_floor(c,floor) is not null or has_table_privilege(current_user,'ledger_private.scene_rooms','SELECT')
    then raise exception 'Player accessed private floor'; end if;
  begin perform public.ledger_prepare_map(c,'erase',room,floor,'{}');raise exception 'Player erased room';
  exception when raise_exception then if sqlerrm='Player erased room' then raise; end if; end;
  perform set_config('request.jwt.claim.sub','61260000-0000-4000-8000-000000000003',true);
  if public.ledger_map_floor(c,floor) is not null or public.ledger_map_catalog(c)<>'[]' then raise exception 'Nonmember read map'; end if;
  perform set_config('request.jwt.claim.sub','61260000-0000-4000-8000-000000000001',true);
  perform public.ledger_prepare_map(c,'erase',room,floor,'{}');
  perform public.ledger_prepare_map(c,'room',room,floor,shape);
  if public.ledger_map_floor(c,floor)->'rooms'<>'[]' then raise exception 'Late request resurrected an erased room'; end if;
end $$;
rollback;
