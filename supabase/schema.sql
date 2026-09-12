-- D&D Character Manager database foundation

create table if not exists public.characters (
    user_id uuid not null references auth.users(id) on delete cascade,
    id text not null,
    name text not null default 'Unnamed Character',
    race text not null default '',
    class_name text not null default '',
    level integer not null default 1,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);

create index if not exists characters_user_id_idx
    on public.characters(user_id);

create index if not exists characters_updated_at_idx
    on public.characters(user_id, updated_at desc);

create table if not exists public.content_entries (
    id uuid primary key default gen_random_uuid(),
    ruleset text not null,
    content_type text not null,
    name text not null,
    slug text not null,
    source_type text not null default 'published',
    source_name text,
    data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (ruleset, content_type, slug)
);

create index if not exists content_entries_type_idx
    on public.content_entries(content_type);

create index if not exists content_entries_ruleset_idx
    on public.content_entries(ruleset);

create index if not exists content_entries_source_idx
    on public.content_entries(source_type);

create index if not exists content_entries_name_idx
    on public.content_entries(name);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists characters_set_updated_at on public.characters;
create trigger characters_set_updated_at
before update on public.characters
for each row execute function public.set_updated_at();

drop trigger if exists content_entries_set_updated_at on public.content_entries;
create trigger content_entries_set_updated_at
before update on public.content_entries
for each row execute function public.set_updated_at();

alter table public.characters enable row level security;

drop policy if exists "Users can view their own characters" on public.characters;
create policy "Users can view their own characters"
on public.characters for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their own characters" on public.characters;
create policy "Users can create their own characters"
on public.characters for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own characters" on public.characters;
create policy "Users can update their own characters"
on public.characters for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own characters" on public.characters;
create policy "Users can delete their own characters"
on public.characters for delete to authenticated
using (auth.uid() = user_id);

alter table public.content_entries enable row level security;

drop policy if exists "Authenticated users can view content" on public.content_entries;
create policy "Authenticated users can view content"
on public.content_entries for select to authenticated
using (true);
