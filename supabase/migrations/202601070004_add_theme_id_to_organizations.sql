alter table public.organizations
add column if not exists theme_id text default 'classic-mosque';
