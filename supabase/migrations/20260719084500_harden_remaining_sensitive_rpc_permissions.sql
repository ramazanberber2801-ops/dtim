-- Restrict remaining sensitive SECURITY DEFINER RPCs.
-- Public token-based and public-read RPCs are intentionally left unchanged.

revoke all on function public.create_organization_onboarding(text,text,text,text,text,text) from public, anon;
grant execute on function public.create_organization_onboarding(text,text,text,text,text,text) to authenticated, service_role;

revoke all on function public.get_activity_series(uuid) from public, anon;
grant execute on function public.get_activity_series(uuid) to authenticated, service_role;

revoke all on function public.get_arrangement_pro_dashboard(text) from public, anon;
grant execute on function public.get_arrangement_pro_dashboard(text) to authenticated, service_role;

revoke all on function public.join_organization_with_code(text) from public, anon;
grant execute on function public.join_organization_with_code(text) to authenticated, service_role;

revoke all on function public.update_customer_portal_organization(text,text,text,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.update_customer_portal_organization(text,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated, service_role;

-- This helper mutates waitlist ordering and is called internally by trusted functions/triggers.
revoke all on function public.resequence_activity_waitlist(uuid) from public, anon, authenticated;
grant execute on function public.resequence_activity_waitlist(uuid) to service_role;
