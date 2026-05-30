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

alter table public.imports enable row level security;
alter table public.observations enable row level security;
alter table public.user_milestone_badges enable row level security;

drop policy if exists "team members can read imports" on public.imports;
drop policy if exists "team members can write imports" on public.imports;
drop policy if exists "team members can read observations" on public.observations;
drop policy if exists "team members can write observations" on public.observations;
drop policy if exists "team members can read badges" on public.user_milestone_badges;
drop policy if exists "team members can write badges" on public.user_milestone_badges;

create policy "team members can read imports"
  on public.imports for select
  to authenticated
  using (true);

create policy "team members can write imports"
  on public.imports for all
  to authenticated
  using (true)
  with check (true);

create policy "team members can read observations"
  on public.observations for select
  to authenticated
  using (true);

create policy "team members can write observations"
  on public.observations for all
  to authenticated
  using (true)
  with check (true);

create policy "team members can read badges"
  on public.user_milestone_badges for select
  to authenticated
  using (true);

create policy "team members can write badges"
  on public.user_milestone_badges for all
  to authenticated
  using (true)
  with check (true);
