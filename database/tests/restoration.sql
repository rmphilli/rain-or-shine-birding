-- Live integration checks. All replacement work is inside a rolled-back subtransaction.
-- No email, provider request, or persistent test observation is created.
do $$
declare
  member record;
  actor uuid;
  revision uuid;
  fixture jsonb;
  before_digest text;
  before_imports integer;
  before_snapshots integer;
  expected_rows integer;
  saved_rows integer;
begin
  select md5(jsonb_agg(to_jsonb(o) order by o.id)::text),count(*)
    into before_digest,expected_rows from public.observations o;
  select count(*) into before_imports from public.imports;
  select count(*) into before_snapshots from ros_private.recovery_snapshots;
  if expected_rows=0 then raise exception 'No recovery data to verify.'; end if;
  if has_table_privilege('authenticated','public.observations','TRUNCATE')
     or has_table_privilege('anon','public.observations','TRUNCATE')
     or has_schema_privilege('authenticated','ros_private','USAGE')
     or has_function_privilege('anon','public.replace_member_observations_guarded(text,text,jsonb,uuid)','EXECUTE') then
    raise exception 'Unsafe privilege remains.';
  end if;
  for member in select user_id,display_name from public.team_members loop
    perform set_config('request.jwt.claims',json_build_object('sub',member.user_id,'role','authenticated')::text,true);
    execute 'set local role authenticated';
    if (select count(*) from public.observations)<>expected_rows then
      raise exception 'Signed-in member cannot load the full team collection.';
    end if;
    if (select count(*) from public.team_members)<>1 then
      raise exception 'Roster self-read protection is not enforced.';
    end if;
    execute 'reset role';
  end loop;
  select user_id into actor from public.team_members where display_name='Matt';
  perform set_config('request.jwt.claims',json_build_object('sub',actor,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  select jsonb_agg(to_jsonb(o) order by o.id),min(import_id::text)::uuid
    into fixture,revision from public.observations o where member_name='Matt';
  begin
    perform public.replace_member_observations_guarded('Matt','validation',fixture,null);
    raise exception 'Stale revision was incorrectly accepted.';
  exception when serialization_failure then null;
  end;
  begin
    perform public.replace_member_observations_guarded('Matt','validation','[]'::jsonb,revision);
    raise exception 'Empty replacement was incorrectly accepted.';
  exception when invalid_parameter_value then null;
  end;
  -- Verify a normal complete replacement and archive, then undo it unconditionally.
  begin
    saved_rows:=public.replace_member_observations_guarded('Matt','validation_rolled_back',fixture,revision);
    if saved_rows<>jsonb_array_length(fixture) then raise exception 'Incomplete normal replacement.'; end if;
    raise exception 'Undo the validation replacement.' using errcode='ZX001';
  exception when sqlstate 'ZX001' then null;
  end;
  execute 'reset role';
  if (select md5(jsonb_agg(to_jsonb(o) order by o.id)::text) from public.observations o) is distinct from before_digest
     or (select count(*) from public.imports)<>before_imports
     or (select count(*) from ros_private.recovery_snapshots)<>before_snapshots then
    raise exception 'Integration test changed recovery data.';
  end if;
  -- A valid-looking ID outside the roster must not reach a privileged write.
  perform set_config('request.jwt.claims',json_build_object('sub','00000000-0000-0000-0000-000000000001','role','authenticated')::text,true);
  execute 'set local role authenticated';
  if (select count(*) from public.observations)<>0 then raise exception 'Nonmember can read team data.'; end if;
  begin
    perform public.replace_member_observations_guarded('Matt','validation',fixture,revision);
    raise exception 'Nonmember replacement was accepted.';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
end;
$$;
select 'PASS: all three roster reads, nonmember isolation, privileges, stale/empty rejection, and normal atomic replacement/rollback' as restoration_checks;
