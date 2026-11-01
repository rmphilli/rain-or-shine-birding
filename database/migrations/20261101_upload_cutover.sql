-- Apply only after the guarded-upload frontend is deployed and verified.
-- The guarded definer RPC is the sole browser write entry point for observations/imports.
revoke insert, update, delete on public.observations, public.imports from authenticated, anon;
revoke all on function public.replace_member_observations(text,text,jsonb) from public, anon, authenticated;
grant select on public.observations, public.imports, public.team_members to authenticated;
