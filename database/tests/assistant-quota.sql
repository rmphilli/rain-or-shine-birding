-- Admission tests only; no OpenAI calls. Test ledger rows are always rolled back.
do $$
declare
  actor uuid;
  other_actor uuid;
  decision record;
  idx integer;
  initial_count integer;
begin
  select user_id into actor from public.team_members where display_name='Matt';
  select user_id into other_actor from public.team_members where display_name='Alex';
  select count(*) into initial_count from ros_private.assistant_usage;
  if has_function_privilege('anon','public.consume_assistant_quota()','EXECUTE')
    or has_table_privilege('authenticated','ros_private.assistant_usage','INSERT')
    or has_schema_privilege('authenticated','ros_private','USAGE') then
    raise exception 'Quota boundary exposes privileged writes.';
  end if;
  perform set_config('request.jwt.claims',json_build_object('sub',actor,'role','authenticated')::text,true);
  begin
    execute 'set local role authenticated';
    for idx in 1..6 loop
      select * into decision from public.consume_assistant_quota();
      if decision.allowed is not true then raise exception 'Normal admission failed.'; end if;
    end loop;
    select * into decision from public.consume_assistant_quota();
    if decision.allowed or decision.retry_after not between 1 and 60 then raise exception 'Minute limit failed.'; end if;
    execute 'reset role';
    raise exception 'Undo quota fixture.' using errcode='ZX001';
  exception when sqlstate 'ZX001' then null;
  end;
  begin
    insert into ros_private.assistant_usage(user_id,charged_at)
      select actor,date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC' from generate_series(1,60);
    execute 'set local role authenticated';
    select * into decision from public.consume_assistant_quota();
    if decision.allowed or decision.retry_after not between 1 and 86400 then raise exception 'User daily limit failed.'; end if;
    execute 'reset role';
    raise exception 'Undo quota fixture.' using errcode='ZX001';
  exception when sqlstate 'ZX001' then null;
  end;
  begin
    insert into ros_private.assistant_usage(user_id,charged_at)
      select other_actor,date_trunc('day',clock_timestamp() at time zone 'UTC') at time zone 'UTC' from generate_series(1,180);
    execute 'set local role authenticated';
    select * into decision from public.consume_assistant_quota();
    if decision.allowed then raise exception 'Team daily limit failed.'; end if;
    execute 'reset role';
    raise exception 'Undo quota fixture.' using errcode='ZX001';
  exception when sqlstate 'ZX001' then null;
  end;
  perform set_config('request.jwt.claims',json_build_object('sub','00000000-0000-0000-0000-000000000001','role','authenticated')::text,true);
  execute 'set local role authenticated';
  begin
    perform public.consume_assistant_quota();
    raise exception 'Nonmember admission succeeded.';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  if (select count(*) from ros_private.assistant_usage)<>initial_count then raise exception 'Quota test left ledger rows.'; end if;
end;
$$;
select 'PASS: normal admission, minute/user-day/team-day limits, nonmember rejection, restricted ledger, and rollback' as assistant_quota_checks;
