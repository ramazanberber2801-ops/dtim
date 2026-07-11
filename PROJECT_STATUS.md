# Yasaflow – Project Status

Last updated: July 11, 2026

## One-line summary

Yasaflow now has organization-scoped Administrator Portal modules for Members V1, News V1 and Activities V1. Owner Dashboard V2 remains complete. Real administrator invitation and end-to-end testing remain deferred until the Supabase Edge Function is deployed after July 29, 2026.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Run pending Members, News and Activities migrations in Supabase.
2. Build organization Settings.
3. Build roles and access control.
4. Prepare public delivery of organization-scoped content.
5. After July 29, deploy and verify the administrator invitation Edge Function.

## Completed

- Owner Dashboard V2.
- Organization Administrator Portal shell.
- Administrator-to-organization resolution.
- Members database foundation and Members V1 UI.
- Organization News database foundation and News V1 UI.
- Organization Activities database foundation and Activities V1 UI.

## Activities V1

Implemented:

- Dedicated `organization_activities` table, separate from the legacy global `sohbet` table.
- Organization-scoped RLS.
- Activity list and search.
- Draft, published and cancelled filtering.
- Create and edit activity.
- Title, description, date, start/end time, location and capacity.
- Automatic `published_at` when publishing.
- Clear migration error state.

Current limitations:

- `supabase/migrations/20260711_organization_activities.sql` must be run in Supabase before Activities V1 can store data.
- No delete, registration, waiting list, attendance or QR check-in yet.
- The public application still reads legacy global activity data.
- Real administrator testing remains blocked until the invitation Edge Function is deployed.

## Deferred task — after July 29, 2026

- Deploy `invite-organization-admin` to Supabase.
- Verify invitation email, redirect and password setup.
- Verify `organization_admins.user_id` and invitation status.
- Test Members V1, News V1 and Activities V1 as a real organization administrator.

## Active implementation target

Build organization Settings using the same organization-scoped architecture.

## Architecture guidance

Keep changes small and focused. Do not modify legacy global content tables while organization modules are being introduced. All customer data must be scoped by `organization_id` and protected by RLS.
