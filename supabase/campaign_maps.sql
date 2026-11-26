-- Campaign-owned map preparation. Player projections will expose individually authorized geometry.
create table ledger_private.scenes (
  id uuid primary key,
  campaign_id uuid not null references public.ledger_campaigns(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  created_at timestamptz not null default now()
);
create index scenes_campaign_idx on ledger_private.scenes(campaign_id,created_at);
create table ledger_private.scene_floors (
  id uuid primary key,
  scene_id uuid not null references ledger_private.scenes(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 100),
  elevation_ft integer not null check(elevation_ft between -100000 and 100000),
  created_at timestamptz not null default now()
);
create index scene_floors_scene_idx on ledger_private.scene_floors(scene_id,elevation_ft);
create table ledger_private.scene_rooms (
  id uuid primary key,
  erased boolean not null default false,
  floor_id uuid not null references ledger_private.scene_floors(id) on delete cascade,
  x_ft integer not null check(x_ft between 0 and 195), y_ft integer not null check(y_ft between 0 and 145),
  width_ft integer not null check(width_ft>=5 and width_ft<=200-x_ft),
  depth_ft integer not null check(depth_ft>=5 and depth_ft<=150-y_ft)
);
create index scene_rooms_floor_idx on ledger_private.scene_rooms(floor_id);
alter table ledger_private.scenes enable row level security;
alter table ledger_private.scene_floors enable row level security;
alter table ledger_private.scene_rooms enable row level security;
revoke all on ledger_private.scenes,ledger_private.scene_floors,ledger_private.scene_rooms from public,anon,authenticated;

create function public.ledger_map_catalog(p_campaign uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,'floors',(
   select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.name,'elevation',f.elevation_ft)
     order by f.elevation_ft,f.created_at,f.id),'[]') from ledger_private.scene_floors f where f.scene_id=s.id
 )) order by s.created_at,s.id),'[]')
 from ledger_private.scenes s join public.ledger_campaigns c on c.id=s.campaign_id
 where c.id=p_campaign and c.dm_id=auth.uid()
$$;

create function public.ledger_map_floor(p_campaign uuid,p_floor uuid)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('id',f.id,'rooms',(select coalesce(jsonb_agg(jsonb_build_object(
   'id',r.id,'x',r.x_ft,'y',r.y_ft,'width',r.width_ft,'depth',r.depth_ft) order by r.id),'[]')
   from ledger_private.scene_rooms r where r.floor_id=f.id and not r.erased))
 from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
 join public.ledger_campaigns c on c.id=s.campaign_id where c.id=p_campaign and c.dm_id=auth.uid() and f.id=p_floor
$$;

-- Each immutable insert is identified by its client-generated instance UUID. A retry is
-- accepted only for exactly the same parent and payload. Existing maps aren't overwritten.
create function public.ledger_prepare_map(p_campaign uuid,p_operation text,p_id uuid,p_parent uuid,p_value jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare n text:=btrim(p_value->>'name'); elevation integer; x integer;y integer;w integer;d integer;
begin
 perform 1 from public.ledger_campaigns where id=p_campaign and dm_id=auth.uid() for update;
 if not found or p_id is null then raise exception 'Map preparation unavailable'; end if;
 case p_operation
 when 'scene' then
   if p_parent is not null then raise exception 'Invalid scene parent'; end if;
   if not exists(select from ledger_private.scenes where id=p_id) and (select count(*) from ledger_private.scenes where campaign_id=p_campaign)>=30 then raise exception 'Campaign map limit reached'; end if;
   insert into ledger_private.scenes(id,campaign_id,name) values(p_id,p_campaign,n) on conflict(id) do nothing;
   if not exists(select from ledger_private.scenes where id=p_id and campaign_id=p_campaign and name=n) then raise exception 'Map change conflict'; end if;
   insert into ledger_private.scene_floors(id,scene_id,name,elevation_ft) values(p_id,p_id,'Ground floor',0) on conflict(id) do nothing;
   if not exists(select from ledger_private.scene_floors where id=p_id and scene_id=p_id) then raise exception 'Map change conflict'; end if;
 when 'floor' then
   perform 1 from ledger_private.scenes where id=p_parent and campaign_id=p_campaign;
   if not found then raise exception 'Map unavailable'; end if;
   if not exists(select from ledger_private.scene_floors where id=p_id) and (select count(*) from ledger_private.scene_floors where scene_id=p_parent)>=32 then raise exception 'Map floor limit reached'; end if;
   elevation:=(p_value->>'elevation')::integer;
   insert into ledger_private.scene_floors(id,scene_id,name,elevation_ft) values(p_id,p_parent,n,elevation) on conflict(id) do nothing;
   if not exists(select from ledger_private.scene_floors where id=p_id and scene_id=p_parent and name=n and elevation_ft=elevation) then raise exception 'Map change conflict'; end if;
 when 'room' then
   perform 1 from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id where f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Map unavailable'; end if;
   if not exists(select from ledger_private.scene_rooms where id=p_id) and (select count(*) from ledger_private.scene_rooms where floor_id=p_parent)>=2048 then raise exception 'Floor drawing limit reached'; end if;
   x:=(p_value->>'x')::int; y:=(p_value->>'y')::int; w:=(p_value->>'width')::int; d:=(p_value->>'depth')::int;
   insert into ledger_private.scene_rooms(id,floor_id,x_ft,y_ft,width_ft,depth_ft) values(p_id,p_parent,x,y,w,d) on conflict(id) do nothing;
   if not exists(select from ledger_private.scene_rooms where id=p_id and floor_id=p_parent and (x_ft,y_ft,width_ft,depth_ft)=(x,y,w,d)) then raise exception 'Map change conflict'; end if;
 when 'erase' then
   update ledger_private.scene_rooms r set erased=true from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
     where r.id=p_id and r.floor_id=f.id and f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Room unavailable'; end if;
 else raise exception 'Unknown map command';
 end case;
end $$;
revoke all on function public.ledger_prepare_map(uuid,text,uuid,uuid,jsonb), public.ledger_map_catalog(uuid), public.ledger_map_floor(uuid,uuid) from public,anon;
grant execute on function public.ledger_prepare_map(uuid,text,uuid,uuid,jsonb), public.ledger_map_catalog(uuid), public.ledger_map_floor(uuid,uuid) to authenticated;
