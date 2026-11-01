-- Additive restoration: preserve the current collection before changing permissions.
-- Apply to the existing RoS project; never bootstrap over its uploaded data.
create schema if not exists ros_private;
revoke all on schema ros_private from public, anon, authenticated;

create table if not exists ros_private.recovery_snapshots (
  id uuid primary key default gen_random_uuid(),
  captured_at timestamptz not null default now(),
  captured_by uuid,
  kind text not null,
  member_name text,
  payload jsonb not null
);
alter table ros_private.recovery_snapshots enable row level security;
revoke all on ros_private.recovery_snapshots from public, anon, authenticated;

insert into ros_private.recovery_snapshots(kind, payload)
select 'pre_restoration_20261101', jsonb_build_object(
  'observations',coalesce((select jsonb_agg(to_jsonb(o) order by o.id) from public.observations o),'[]'::jsonb),
  'imports',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at) from public.imports i),'[]'::jsonb),
  'badges',coalesce((select jsonb_agg(to_jsonb(b) order by b.id) from public.user_milestone_badges b),'[]'::jsonb),
  'roster',coalesce((select jsonb_agg(to_jsonb(t) order by t.user_id) from public.team_members t),'[]'::jsonb)
)
where not exists(select 1 from ros_private.recovery_snapshots where kind='pre_restoration_20261101');

-- TRUNCATE bypasses RLS. None of these capabilities is needed by the browser.
revoke truncate, references, trigger on public.observations, public.imports,
  public.user_milestone_badges, public.team_members from authenticated, anon;
revoke insert, update, delete on public.team_members from authenticated, anon;

create or replace function public.replace_member_observations_guarded(
  p_member_name text, p_source_name text, p_observations jsonb,
  p_expected_import_id uuid
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_revision uuid;
  revision_count integer;
  current_count integer;
  new_import_id uuid;
  inserted_count integer;
  expected_count integer;
begin
  if actor is null or not exists(select 1 from public.team_members where user_id=actor) then
    raise exception 'A current Rain or Shine team sign-in is required.' using errcode='42501';
  end if;
  if p_member_name is null or p_member_name not in ('Jeff','Alex','Matt') then
    raise exception 'Unknown Rain or Shine team member.' using errcode='22023';
  end if;
  if p_observations is null or jsonb_typeof(p_observations) <> 'array' then
    raise exception 'Upload a nonempty observation list.' using errcode='22023';
  end if;
  expected_count := jsonb_array_length(p_observations);
  if expected_count < 1 or expected_count > 100000 or pg_column_size(p_observations)>52428800 then
    raise exception 'Upload a nonempty list with at most 100,000 observations (50 MiB).' using errcode='22023';
  end if;
  if exists(select 1 from jsonb_array_elements(p_observations) r
    where jsonb_typeof(r)<>'object' or nullif(btrim(r->>'id'),'') is null
      or nullif(btrim(r->>'species_common_name'),'') is null
      or (r->>'member_name') is distinct from p_member_name) then
    raise exception 'Every uploaded row must contain its ID, species, and selected team member.' using errcode='22023';
  end if;
  if (select count(distinct r->>'id') from jsonb_array_elements(p_observations) r) <> expected_count then
    raise exception 'The upload contains duplicate record IDs.' using errcode='22023';
  end if;

  -- All guarded writes for a member serialize before checking the cloud revision.
  perform pg_advisory_xact_lock(hashtextextended('ros-import:'||p_member_name,0));
  select count(*),count(distinct import_id),min(import_id::text)::uuid
    into current_count,revision_count,current_revision
    from public.observations where member_name=p_member_name;
  if (current_count>0 and (revision_count<>1 or exists(
      select 1 from public.observations where member_name=p_member_name and import_id is null)))
      or current_revision is distinct from p_expected_import_id then
    raise exception 'This life list changed on another device. Refresh shared data and review the saved upload before retrying.' using errcode='40001';
  end if;

  insert into ros_private.recovery_snapshots(captured_by,kind,member_name,payload)
  select actor,'before_member_replacement',p_member_name,
    jsonb_build_object('import_id',current_revision,'observations',coalesce(jsonb_agg(to_jsonb(o) order by o.id),'[]'::jsonb))
  from public.observations o where o.member_name=p_member_name;
  insert into public.imports(member_name,source_name,row_count,uploaded_by)
    values(p_member_name,coalesce(nullif(p_source_name,''),'Bird list upload'),expected_count,actor)
    returning id into new_import_id;
  delete from public.observations where member_name=p_member_name;
  insert into public.observations(id,member_name,species_common_name,species_scientific_name,
    date_seen,count_seen,latitude,longitude,location_name,checklist_id,source_name,import_id)
  select r.id,p_member_name,r.species_common_name,r.species_scientific_name,r.date_seen,
    r.count_seen,r.latitude,r.longitude,r.location_name,r.checklist_id,
    coalesce(r.source_name,p_source_name),new_import_id
  from jsonb_to_recordset(p_observations) as r(id text,member_name text,
    species_common_name text,species_scientific_name text,date_seen date,count_seen text,
    latitude double precision,longitude double precision,location_name text,checklist_id text,source_name text);
  get diagnostics inserted_count = row_count;
  if inserted_count<>expected_count then raise exception 'The entire upload could not be saved.'; end if;
  return inserted_count;
end;
$$;
revoke all on function public.replace_member_observations_guarded(text,text,jsonb,uuid) from public, anon;
grant execute on function public.replace_member_observations_guarded(text,text,jsonb,uuid) to authenticated;
