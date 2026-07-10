-- Add per-organization deployment links used by Owner Dashboard V2.
-- GitHub is intentionally not stored per organization because all customers
-- use the shared Yasaflow codebase.

alter table public.organizations
  add column if not exists vercel_url text;

alter table public.organizations
  add column if not exists supabase_url text;
