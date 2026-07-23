create extension if not exists pgcrypto;

create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  member_name text not null,
  source_name text not null,
  row_count integer not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.observations (
  id text primary key,
  member_name text not null,
  species_common_name text not null,
  species_scientific_name text,
  date_seen date,
  count_seen text,
  latitude double precision,
  longitude double precision,
  location_name text,
  checklist_id text,
  source_name text,
  import_id uuid references public.imports(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_milestone_badges (
  id text primary key,
  badge_kind text not null check (badge_kind in ('general', 'species')),
  user_id text not null,
  member_name text not null,
  milestone_number integer not null,
  species_id text,
  species_common_name text,
  species_scientific_name text,
  date_seen date,
  location_name text,
  badge_title text not null,
  badge_description text not null,
  badge_image_url text,
  awarded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, badge_kind, milestone_number)
);

create table if not exists public.team_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

insert into public.team_members (user_id, email, display_name)
select
  id,
  email,
  case
    when lower(email) = 'rmphilli@gmail.com' then 'Matt'
    when lower(email) like '%alex%' then 'Alex'
    when lower(email) like '%jeff%' then 'Jeff'
    else initcap(split_part(email, '@', 1))
  end
from auth.users
where email is not null
on conflict (user_id) do update
set email = excluded.email;

create index if not exists observations_member_date_idx
  on public.observations (member_name, date_seen desc);

create index if not exists observations_species_idx
  on public.observations (species_common_name);

create index if not exists imports_member_created_idx
  on public.imports (member_name, created_at desc);

create index if not exists imports_uploaded_by_idx
  on public.imports (uploaded_by);

create index if not exists observations_import_id_idx
  on public.observations (import_id);

grant usage on schema public to anon, authenticated;
grant select on public.team_members to authenticated;
grant select, insert, update, delete on public.imports to authenticated;
grant select, insert, update, delete on public.observations to authenticated;
grant select, insert, update, delete on public.user_milestone_badges to authenticated;
revoke all on public.team_members, public.imports, public.observations, public.user_milestone_badges from anon;

alter table public.team_members enable row level security;
alter table public.imports enable row level security;
alter table public.observations enable row level security;
alter table public.user_milestone_badges enable row level security;

drop policy if exists "team members can read imports" on public.imports;
drop policy if exists "team members can write imports" on public.imports;
drop policy if exists "team members can read observations" on public.observations;
drop policy if exists "team members can write observations" on public.observations;
drop policy if exists "team members can read badges" on public.user_milestone_badges;
drop policy if exists "team members can write badges" on public.user_milestone_badges;
drop policy if exists "team members can manage imports" on public.imports;
drop policy if exists "team members can manage observations" on public.observations;
drop policy if exists "team members can manage badges" on public.user_milestone_badges;
drop policy if exists "team members can read their roster entry" on public.team_members;

create policy "team members can read their roster entry"
  on public.team_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "team members can manage imports"
  on public.imports for all
  to authenticated
  using (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ));

create policy "team members can manage observations"
  on public.observations for all
  to authenticated
  using (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ));

create policy "team members can manage badges"
  on public.user_milestone_badges for all
  to authenticated
  using (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.team_members
    where user_id = (select auth.uid())
  ));

create or replace function public.replace_member_observations(
  p_member_name text,
  p_source_name text,
  p_observations jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_import_id uuid;
  inserted_count integer := 0;
begin
  if p_member_name is null or p_member_name not in ('Jeff', 'Alex', 'Matt') then
    raise exception 'Unknown Rain or Shine team member.';
  end if;

  if jsonb_typeof(coalesce(p_observations, '[]'::jsonb)) <> 'array' then
    raise exception 'Observations must be a JSON array.';
  end if;

  insert into public.imports (member_name, source_name, row_count, uploaded_by)
  values (
    p_member_name,
    coalesce(nullif(p_source_name, ''), 'Bird list upload'),
    jsonb_array_length(coalesce(p_observations, '[]'::jsonb)),
    (select auth.uid())
  )
  returning id into new_import_id;

  delete from public.observations
  where member_name = p_member_name;

  insert into public.observations (
    id,
    member_name,
    species_common_name,
    species_scientific_name,
    date_seen,
    count_seen,
    latitude,
    longitude,
    location_name,
    checklist_id,
    source_name,
    import_id
  )
  select
    incoming.id,
    p_member_name,
    incoming.species_common_name,
    incoming.species_scientific_name,
    incoming.date_seen,
    incoming.count_seen,
    incoming.latitude,
    incoming.longitude,
    incoming.location_name,
    incoming.checklist_id,
    coalesce(incoming.source_name, p_source_name),
    new_import_id
  from jsonb_to_recordset(coalesce(p_observations, '[]'::jsonb)) as incoming (
    id text,
    member_name text,
    species_common_name text,
    species_scientific_name text,
    date_seen date,
    count_seen text,
    latitude double precision,
    longitude double precision,
    location_name text,
    checklist_id text,
    source_name text,
    import_id uuid
  )
  where incoming.id is not null
    and incoming.species_common_name is not null;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function public.replace_member_observations(text, text, jsonb) from public;
grant execute on function public.replace_member_observations(text, text, jsonb) to authenticated;
