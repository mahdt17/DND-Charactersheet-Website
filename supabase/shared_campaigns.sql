-- Shared campaigns read the player's canonical character row.
create schema if not exists ledger_private;
revoke all on schema ledger_private from public, anon, authenticated;

create table public.ledger_campaigns (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  revision bigint not null default 0,
  unique (id, dm_id)
);
create index ledger_campaigns_dm_idx on public.ledger_campaigns(dm_id);

create table public.ledger_campaign_sheets (
  user_id uuid not null default auth.uid(),
  character_id text not null check (character_id <> 'ledger-workspace'),
  campaign_id uuid not null,
  dm_id uuid not null,
  primary key (user_id, character_id),
  foreign key (user_id, character_id) references public.characters(user_id,id) on delete cascade,
  foreign key (campaign_id, dm_id) references public.ledger_campaigns(id,dm_id) on delete cascade
);
create index ledger_campaign_sheets_campaign_idx on public.ledger_campaign_sheets(campaign_id, dm_id);

-- Resolve the invite at insert time. Clients may supply only the invite and their character ID.
create function ledger_private.set_campaign_dm() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select c.dm_id into new.dm_id from public.ledger_campaigns c where c.id = new.campaign_id;
  if new.dm_id is null then raise exception 'Campaign invite not found'; end if;
  return new;
end $$;
create trigger ledger_assign_dm before insert on public.ledger_campaign_sheets
  for each row execute function ledger_private.set_campaign_dm();

alter table public.ledger_campaigns enable row level security;
alter table public.ledger_campaign_sheets enable row level security;
revoke all on public.ledger_campaigns, public.ledger_campaign_sheets from public, anon, authenticated;
grant select, insert(name) on public.ledger_campaigns to authenticated;
grant select, delete, insert(character_id,campaign_id) on public.ledger_campaign_sheets to authenticated;
create policy ledger_dm_create on public.ledger_campaigns for insert to authenticated
  with check (dm_id = (select auth.uid()));
create policy ledger_campaign_read on public.ledger_campaigns for select to authenticated using (
  dm_id = (select auth.uid()) or exists (select 1 from public.ledger_campaign_sheets s
    where s.campaign_id = ledger_campaigns.id and s.user_id = (select auth.uid()))
);
create policy ledger_assignment_read on public.ledger_campaign_sheets for select to authenticated
  using (user_id = (select auth.uid()) or dm_id = (select auth.uid()));
create policy ledger_player_assign on public.ledger_campaign_sheets for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy ledger_unassign on public.ledger_campaign_sheets for delete to authenticated
  using (user_id = (select auth.uid()) or dm_id = (select auth.uid()));
create policy ledger_dm_read_shared_sheet on public.characters for select to authenticated using (
  exists (select 1 from public.ledger_campaign_sheets s where s.user_id = characters.user_id
    and s.character_id = characters.id and s.dm_id = (select auth.uid()))
);

-- Publish a small change signal. The roster and sheet are always fetched under the viewer's RLS.
create function ledger_private.notify_campaign() returns trigger
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  if tg_table_name = 'characters' then
    select s.campaign_id into target from public.ledger_campaign_sheets s
      where s.user_id = new.user_id and s.character_id = new.id;
  elsif tg_op = 'DELETE' then target := old.campaign_id;
  else target := new.campaign_id;
  end if;
  if target is not null then
    update public.ledger_campaigns set revision = revision+1 where id = target;
  end if;
  return null;
end $$;
create trigger ledger_membership_changed after insert or delete on public.ledger_campaign_sheets
  for each row execute function ledger_private.notify_campaign();
create trigger ledger_shared_sheet_saved after update on public.characters
  for each row execute function ledger_private.notify_campaign();
revoke all on function ledger_private.set_campaign_dm(), ledger_private.notify_campaign() from public, anon, authenticated;
alter publication supabase_realtime add table public.ledger_campaigns;
