create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter function public.can_manage_organization(text) set schema private;
alter function public.is_admin() set schema private;
alter function public.is_platform_admin() set schema private;
alter function public.is_super_admin() set schema private;

revoke all on function private.can_manage_organization(text) from public, anon;
revoke all on function private.is_admin() from public, anon;
revoke all on function private.is_platform_admin() from public, anon;
revoke all on function private.is_super_admin() from public, anon;

grant execute on function private.can_manage_organization(text) to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_platform_admin() to authenticated, service_role;
grant execute on function private.is_super_admin() to authenticated, service_role;
