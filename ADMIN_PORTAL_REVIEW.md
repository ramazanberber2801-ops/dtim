# Yasaflow – Administrator Portal Review

Review date: July 10, 2026

## Conclusion

The customer Administrator Portal is not currently implemented as a usable organization-scoped portal.

`AdminPanelV2` currently routes Owners to `OwnerPanelV2`. A non-Owner administrator only sees an access message and has no operational dashboard.

The repository still contains legacy administration data and CRUD methods in `AppContext`, but these are not yet organized into the new Administrator Portal architecture and must not be treated as production-ready multi-organization functionality.

## What currently works

- Supabase authentication is used for administrator login.
- An authenticated profile is loaded from the legacy `admins` table.
- Owner roles can access Owner Dashboard V2.
- Legacy context methods exist for:
  - News
  - Staff
  - Activities/lessons stored as `sohbet`
  - Settings
  - Inspiration content
  - Administrators
  - Push sending
- Existing public app pages can read current DTIM content.

## Critical gaps

### 1. No customer Administrator Portal UI

`AdminPanelV2` renders `OwnerPanelV2` for Owner roles.

For other administrator roles it renders only:

`Kun Owner har tilgang til Owner V2.`

There is no organization administrator navigation, dashboard or module workspace.

### 2. Legacy data is not organization-scoped

Current `AppContext` queries shared tables such as:

- `news`
- `staff`
- `sohbet`
- `settings`
- `admins`

The queries do not currently filter by `organization_id`.

This is incompatible with Yasaflow's multi-organization architecture. Future Administrator Portal queries and writes must always be scoped to the logged-in administrator's organization.

### 3. Legacy administrator model differs from the new model

Authentication currently loads profiles from the legacy `admins` table.

Owner-created onboarding stores administrators in `organization_admins`.

These models are not yet connected into one clear organization-scoped login and authorization flow.

Do not delete or replace the working invitation flow while resolving this. The first task is to define how an authenticated Supabase user resolves to exactly one organization administrator record.

### 4. Hardcoded DTIM assumptions remain

The app still includes DTIM-specific assumptions, including:

- local storage key `dtim_admin`
- module lookup using organization id `dtim`
- public content tables without organization filters
- Turkish labels and mosque-specific settings in shared context

These should be migrated gradually, not through one large refactor.

### 5. Members module does not exist yet

There is no organization membership table or Administrator Portal UI for Members.

The future Members implementation must follow `DATABASE_GUIDE.md`:

- Members are not administrators.
- Memberships are organization-owned.
- A person may have independent memberships in several organizations.
- All reads and writes must be scoped by `organization_id`.

## Recommended implementation sequence

### Task 1 — Administrator portal shell

Create a separate organization Administrator Portal shell for non-Owner administrators.

It should provide:

- Organization identity/header
- Organization-scoped navigation
- Dashboard placeholder
- Core module entries for News, Activities, Members, Administration and Settings
- No changes to Owner Dashboard V2

### Task 2 — Resolve administrator organization

Connect the authenticated Supabase user to `organization_admins` and its `organization_id`.

The portal must refuse organization data access when no valid organization administrator record exists.

### Task 3 — Members foundation

Add dedicated membership tables through a migration and implement the first Members list and create/edit flow.

### Task 4 — Migrate News

Add organization scoping to News and expose it in the Administrator Portal.

### Task 5 — Migrate Activities

Add organization scoping to Activities and expose it in the Administrator Portal.

## Architecture constraints

- Owner, Administrator and Member must remain separate.
- Owner Dashboard V2 must not be reused as the customer Administrator Portal.
- Do not use a global Members table as the organization membership model.
- Do not perform a large rewrite of `AppContext` in one commit.
- Migrate one functional area at a time.
- Preserve the existing Owner invitation flow.
- Every organization data query must eventually include organization scope and matching RLS.

## Review status

Review complete. No application code was changed in this review.
