# Yasaflow – Project Status

Last updated: July 11, 2026

## One-line summary

Yasaflow is a SaaS platform for mosques, associations, churches, sports clubs and other organizations. Owner Dashboard V2 is complete. Administrator Portal is organization-scoped, and Members V1 now provides the first operational organization module with list, search, status filtering and create/edit.

## Current phase

Customer Administrator Portal.

Current priority order:

1. Run the Members migration in Supabase if it has not already been applied.
2. Test Members V1 with real organization data.
3. Migrate News to organization-scoped data.
4. Migrate Activities to organization-scoped data.
5. After July 29, deploy and verify the administrator invitation Edge Function.

## Completed phase: Owner Dashboard V2

Owner Dashboard V2 is complete for the current product phase and should receive only focused bug fixes.

## Administrator Portal status

Completed:

- Separate non-Owner Administrator Portal.
- Organization session resolution through `organization_admins`.
- Organization identity, logo and status.
- Responsive core navigation.
- Members V1.

## Members V1

Implemented:

- Organization-scoped loading from `organization_memberships`.
- Related person data from `people`.
- Search by name, member number, email and phone.
- Active/inactive filtering.
- Empty, loading and migration-error states.
- Create member.
- Edit member.
- Member number uniqueness feedback.
- Member fields: name, member number, email, phone, address, join date, status, internal role and notes.

Current limitations:

- The migration `supabase/migrations/20260710_members_foundation.sql` must be run in Supabase before the module can store data.
- Create uses two database writes (`people`, then `organization_memberships`) rather than one database transaction.
- No delete, QR card, family, group management, attendance, fees or import/export yet.
- `AppContext.login` still starts with the legacy `admins` profile lookup.
- `invite-organization-admin` is not deployed yet.

## Deferred task — after July 29, 2026

- Deploy `invite-organization-admin` to Supabase.
- Verify invitation email, redirect and password setup.
- Verify `organization_admins.user_id` and invitation status.

## Active implementation target

After Members V1 is tested, migrate News to organization-scoped data and expose it in the Administrator Portal.

## Architecture guidance

Keep changes small and focused. Never mix Owner, Administrator and Member concepts. All customer data must be scoped by `organization_id` and protected by RLS.
