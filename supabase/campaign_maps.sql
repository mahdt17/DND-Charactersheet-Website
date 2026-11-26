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
create table ledger_private.scene_barriers (
  id uuid primary key,
  floor_id uuid not null references ledger_private.scene_floors(id) on delete cascade,
  kind text not null check(kind in ('wall','door')),
  x1 integer not null check(x1 between 0 and 200), y1 integer not null check(y1 between 0 and 150),
  x2 integer not null check(x2 between 0 and 200), y2 integer not null check(y2 between 0 and 150),
  is_open boolean not null default false check(kind='door' or not is_open),
  revision integer not null default 0,
  erased boolean not null default false,
  check(x1<>x2 or y1<>y2)
);
create index scene_barriers_floor_idx on ledger_private.scene_barriers(floor_id);
alter table ledger_private.scene_barriers enable row level security;
revoke all on ledger_private.scene_barriers from public,anon,authenticated;
create table ledger_private.floor_passages (
  id uuid primary key,
  from_floor uuid not null references ledger_private.scene_floors(id) on delete cascade,
  to_floor uuid not null references ledger_private.scene_floors(id) on delete cascade,
  from_x integer not null check(from_x between 0 and 200), from_y integer not null check(from_y between 0 and 150),
  to_x integer not null check(to_x between 0 and 200), to_y integer not null check(to_y between 0 and 150),
  kind text not null check(kind in ('stairs','ladder','pit')),
  erased boolean not null default false,
  check(from_floor<>to_floor)
);
create index floor_passages_from_idx on ledger_private.floor_passages(from_floor);
create index floor_passages_to_idx on ledger_private.floor_passages(to_floor);
alter table ledger_private.floor_passages enable row level security;
revoke all on ledger_private.floor_passages from public,anon,authenticated;
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
   from ledger_private.scene_rooms r where r.floor_id=f.id and not r.erased),
   'barriers',(select coalesce(jsonb_agg(jsonb_build_object(
     'id',b.id,'kind',b.kind,'x1',b.x1,'y1',b.y1,'x2',b.x2,'y2',b.y2,
     'open',b.is_open,'revision',b.revision) order by b.id),'[]')
     from ledger_private.scene_barriers b where b.floor_id=f.id and not b.erased),
   'passages',(select coalesce(jsonb_agg(jsonb_build_object(
     'id',p.id,'kind',p.kind,'fromFloor',p.from_floor,'toFloor',p.to_floor,
     'fromX',p.from_x,'fromY',p.from_y,'toX',p.to_x,'toY',p.to_y) order by p.id),'[]')
     from ledger_private.floor_passages p where (p.from_floor=f.id or p.to_floor=f.id) and not p.erased))
 from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
 join public.ledger_campaigns c on c.id=s.campaign_id where c.id=p_campaign and c.dm_id=auth.uid() and f.id=p_floor
$$;

-- Each immutable insert is identified by its client-generated instance UUID. A retry is
-- accepted only for exactly the same parent and payload. Existing maps aren't overwritten.
create function public.ledger_prepare_map(p_campaign uuid,p_operation text,p_id uuid,p_parent uuid,p_value jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare n text:=btrim(p_value->>'name'); elevation integer; x integer;y integer;w integer;d integer;
  barrier ledger_private.scene_barriers%rowtype;
  expected_revision integer; requested_open boolean;
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
 when 'barrier' then
   perform 1 from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
     where f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Map unavailable'; end if;
   if not exists(select from ledger_private.scene_barriers where id=p_id) and
     (select count(*) from ledger_private.scene_barriers where floor_id=p_parent)>=2048 then raise exception 'Floor barrier limit reached'; end if;
   insert into ledger_private.scene_barriers(id,floor_id,kind,x1,y1,x2,y2)
     values(p_id,p_parent,p_value->>'kind',(p_value->>'x1')::integer,(p_value->>'y1')::integer,
       (p_value->>'x2')::integer,(p_value->>'y2')::integer) on conflict(id) do nothing;
   if not exists(select from ledger_private.scene_barriers b where b.id=p_id and b.floor_id=p_parent
     and (b.kind,b.x1,b.y1,b.x2,b.y2)=(p_value->>'kind',(p_value->>'x1')::integer,(p_value->>'y1')::integer,
       (p_value->>'x2')::integer,(p_value->>'y2')::integer)) then raise exception 'Barrier change conflict'; end if;
 when 'door_state' then
   select b.* into barrier from ledger_private.scene_barriers b
     join ledger_private.scene_floors f on f.id=b.floor_id join ledger_private.scenes s on s.id=f.scene_id
     where b.id=p_id and b.floor_id=p_parent and s.campaign_id=p_campaign and b.kind='door' and not b.erased;
   if not found then raise exception 'Door unavailable'; end if;
   expected_revision:=(p_value->>'revision')::integer;
   if expected_revision is null or expected_revision<0 or jsonb_typeof(p_value->'open') is distinct from 'boolean'
     then raise exception 'Invalid door state'; end if;
   requested_open:=(p_value->>'open')::boolean;
   if barrier.revision=expected_revision and barrier.is_open<>requested_open then
     update ledger_private.scene_barriers set is_open=requested_open,revision=revision+1 where id=p_id;
   elsif not (barrier.is_open=requested_open and barrier.revision in (expected_revision,expected_revision::bigint+1)) then
     raise exception 'Door changed. Refresh the floor.';
   end if;
 when 'erase_barrier' then
   update ledger_private.scene_barriers b set erased=true from ledger_private.scene_floors f
     join ledger_private.scenes s on s.id=f.scene_id
     where b.id=p_id and b.floor_id=f.id and f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Barrier unavailable'; end if;
 when 'passage' then
   perform 1 from ledger_private.scene_floors a join ledger_private.scenes s on s.id=a.scene_id
     join ledger_private.scene_floors b on b.scene_id=s.id
     where a.id=p_parent and b.id=(p_value->>'toFloor')::uuid and a.id<>b.id and s.campaign_id=p_campaign
       and (p_value->>'kind'<>'pit' or b.elevation_ft<a.elevation_ft);
   if not found then raise exception 'Choose a different floor in this map. Pits must lead down.'; end if;
   if not exists(select from ledger_private.floor_passages where id=p_id) and exists(
     select from (values(p_parent),((p_value->>'toFloor')::uuid)) as ends(floor_id) where
     (select count(*) from ledger_private.floor_passages p where p.from_floor=ends.floor_id or p.to_floor=ends.floor_id)>=256
   ) then raise exception 'Floor passage limit reached'; end if;
   insert into ledger_private.floor_passages(id,from_floor,to_floor,kind,from_x,from_y,to_x,to_y)
   values(p_id,p_parent,(p_value->>'toFloor')::uuid,p_value->>'kind',(p_value->>'fromX')::int,
     (p_value->>'fromY')::int,(p_value->>'toX')::int,(p_value->>'toY')::int) on conflict(id) do nothing;
   if not exists(select from ledger_private.floor_passages where id=p_id and from_floor=p_parent and
     (to_floor,kind,from_x,from_y,to_x,to_y)=((p_value->>'toFloor')::uuid,p_value->>'kind',(p_value->>'fromX')::int,
     (p_value->>'fromY')::int,(p_value->>'toX')::int,(p_value->>'toY')::int)) then raise exception 'Passage change conflict'; end if;
 when 'erase_passage' then
   update ledger_private.floor_passages p set erased=true from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
     where p.id=p_id and f.id in (p.from_floor,p.to_floor) and f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Passage unavailable'; end if;
 when 'erase' then
   update ledger_private.scene_rooms r set erased=true from ledger_private.scene_floors f join ledger_private.scenes s on s.id=f.scene_id
     where r.id=p_id and r.floor_id=f.id and f.id=p_parent and s.campaign_id=p_campaign;
   if not found then raise exception 'Room unavailable'; end if;
 else raise exception 'Unknown map command';
 end case;
end $$;
revoke all on function public.ledger_prepare_map(uuid,text,uuid,uuid,jsonb), public.ledger_map_catalog(uuid), public.ledger_map_floor(uuid,uuid) from public,anon;
grant execute on function public.ledger_prepare_map(uuid,text,uuid,uuid,jsonb), public.ledger_map_catalog(uuid), public.ledger_map_floor(uuid,uuid) to authenticated;
