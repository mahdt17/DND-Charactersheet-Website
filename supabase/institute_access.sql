alter table public.characters add column if not exists institute_access boolean not null default false;

create unique index if not exists characters_one_institute_grant
on public.characters (institute_access) where institute_access;

create or replace function public.protect_institute_access()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('postgres','service_role','supabase_admin') then
    if tg_op = 'INSERT' then
      new.institute_access := false;
    elsif (new.user_id,new.id) is distinct from (old.user_id,old.id) then
      new.institute_access := false;
    else
      new.institute_access := old.institute_access;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists characters_protect_institute_access on public.characters;
create trigger characters_protect_institute_access before insert or update on public.characters
for each row execute function public.protect_institute_access();
