-- Shared assistant admission control. No caller-supplied identity or limit.
create schema if not exists ros_private;
revoke all on schema ros_private from public, anon, authenticated;

create table if not exists ros_private.assistant_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  charged_at timestamptz not null
);
create index if not exists assistant_usage_user_time_idx
  on ros_private.assistant_usage(user_id, charged_at);
create index if not exists assistant_usage_time_idx
  on ros_private.assistant_usage(charged_at);
alter table ros_private.assistant_usage enable row level security;
revoke all on ros_private.assistant_usage from public, anon, authenticated;

create or replace function public.consume_assistant_quota()
returns table (allowed boolean, retry_after integer)
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  request_time timestamptz;
  day_start timestamptz;
  next_day timestamptz;
  oldest_recent timestamptz;
  minute_calls integer;
  user_calls integer;
  team_calls integer;
begin
  if actor is null or not exists (
    select 1 from public.team_members t where t.user_id = actor
  ) then
    raise exception 'A current Rain or Shine team sign-in is required.' using errcode = '42501';
  end if;

  -- One transaction lock makes both the per-user and team check/increment
  -- atomic across independent serverless instances and direct RPC callers.
  perform pg_advisory_xact_lock(591247, 20261101);
  request_time := clock_timestamp();
  day_start := date_trunc('day', request_time at time zone 'UTC') at time zone 'UTC';
  next_day := ((request_time at time zone 'UTC')::date + 1)::timestamp at time zone 'UTC';
  select
    count(*) filter (where u.user_id = actor and u.charged_at > request_time - interval '1 minute'),
    count(*) filter (where u.user_id = actor and u.charged_at >= day_start),
    count(*) filter (where u.charged_at >= day_start),
    min(u.charged_at) filter (where u.user_id = actor and u.charged_at > request_time - interval '1 minute')
    into minute_calls, user_calls, team_calls, oldest_recent
    from ros_private.assistant_usage u
    where u.charged_at >= least(day_start, request_time - interval '1 minute');

  if user_calls >= 60 or team_calls >= 180 then
    return query select false, greatest(1, ceil(extract(epoch from (next_day - request_time)))::integer);
    return;
  end if;
  if minute_calls >= 6 then
    return query select false, greatest(1, ceil(extract(epoch from
      (oldest_recent + interval '1 minute' - request_time)))::integer);
    return;
  end if;

  insert into ros_private.assistant_usage(user_id, charged_at) values (actor, request_time);
  delete from ros_private.assistant_usage u where u.charged_at < day_start - interval '30 days';
  return query select true, 0;
end;
$$;
revoke all on function public.consume_assistant_quota() from public, anon, authenticated;
grant execute on function public.consume_assistant_quota() to authenticated;
