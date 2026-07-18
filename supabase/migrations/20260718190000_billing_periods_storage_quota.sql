-- Billing periods, module cancellation scheduling, and 2 GiB organization storage quota.

alter table public.organizations
  add column if not exists billing_anchor_day smallint,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists storage_limit_bytes bigint not null default 2147483648,
  add column if not exists storage_warning_level smallint not null default 0;

alter table public.organizations
  drop constraint if exists organizations_billing_anchor_day_check,
  add constraint organizations_billing_anchor_day_check check (billing_anchor_day is null or billing_anchor_day between 1 and 28),
  drop constraint if exists organizations_storage_limit_bytes_check,
  add constraint organizations_storage_limit_bytes_check check (storage_limit_bytes > 0),
  drop constraint if exists organizations_storage_warning_level_check,
  add constraint organizations_storage_warning_level_check check (storage_warning_level in (0,80,90,100));

alter table public.organization_modules
  add column if not exists billing_status text not null default 'inactive',
  add column if not exists price_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false,
  add column if not exists scheduled_disable_at timestamptz,
  add column if not exists activated_at timestamptz,
  add column if not exists deactivated_at timestamptz;

alter table public.organization_modules
  drop constraint if exists organization_modules_billing_status_check,
  add constraint organization_modules_billing_status_check
    check (billing_status in ('inactive','active','cancel_scheduled','past_due'));

create index if not exists organization_modules_scheduled_disable_idx
  on public.organization_modules (scheduled_disable_at)
  where scheduled_disable_at is not null;

create or replace view public.organization_storage_usage
with (security_invoker = true)
as
select
  o.id as organization_id,
  o.storage_limit_bytes,
  coalesce(sum(coalesce((obj.metadata->>'size')::bigint, 0)), 0)::bigint as used_bytes,
  greatest(o.storage_limit_bytes - coalesce(sum(coalesce((obj.metadata->>'size')::bigint, 0)), 0), 0)::bigint as remaining_bytes,
  case when o.storage_limit_bytes > 0 then round((coalesce(sum(coalesce((obj.metadata->>'size')::bigint, 0)), 0)::numeric / o.storage_limit_bytes::numeric) * 100, 2) else 0 end as used_percent
from public.organizations o
left join storage.objects obj on split_part(obj.name, '/', 1) = o.id
group by o.id, o.storage_limit_bytes;

grant select on public.organization_storage_usage to authenticated;
revoke all on public.organization_storage_usage from anon;

create schema if not exists private;

create or replace function private.enforce_organization_storage_quota()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, storage, private
as $$
declare
  v_org_id text;
  v_limit bigint;
  v_used bigint;
  v_new_size bigint;
begin
  v_org_id := split_part(new.name, '/', 1);
  if v_org_id is null or v_org_id = '' then
    raise exception 'Storage object path must start with organization id';
  end if;

  select storage_limit_bytes into v_limit from public.organizations where id = v_org_id;
  if v_limit is null then
    raise exception 'Unknown organization storage path: %', v_org_id;
  end if;

  v_new_size := coalesce((new.metadata->>'size')::bigint, 0);
  select coalesce(sum(coalesce((metadata->>'size')::bigint, 0)), 0)
  into v_used
  from storage.objects
  where split_part(name, '/', 1) = v_org_id
    and (tg_op <> 'UPDATE' or id <> old.id);

  if v_used + v_new_size > v_limit then
    raise exception 'Organization storage quota exceeded (limit % bytes)', v_limit using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_organization_storage_quota() from public, anon, authenticated;
drop trigger if exists enforce_organization_storage_quota on storage.objects;
create trigger enforce_organization_storage_quota
before insert or update of name, metadata on storage.objects
for each row execute function private.enforce_organization_storage_quota();

create or replace function private.defer_paid_module_disable()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_period_end timestamptz;
begin
  if old.enabled = true and new.enabled = false then
    v_period_end := coalesce(old.current_period_end, new.current_period_end,
      (select current_period_end from public.organizations where id = old.organization_id));
    if v_period_end is not null and v_period_end > now() then
      new.enabled := true;
      new.status := 'På';
      new.billing_status := 'cancel_scheduled';
      new.cancel_at_period_end := true;
      new.scheduled_disable_at := v_period_end;
      new.deactivated_at := null;
    else
      new.billing_status := 'inactive';
      new.cancel_at_period_end := false;
      new.scheduled_disable_at := null;
      new.deactivated_at := now();
    end if;
  elsif new.enabled = true then
    new.billing_status := 'active';
    new.cancel_at_period_end := false;
    new.scheduled_disable_at := null;
    new.activated_at := coalesce(old.activated_at, now());
    new.deactivated_at := null;
  end if;
  return new;
end;
$$;

revoke all on function private.defer_paid_module_disable() from public, anon, authenticated;
drop trigger if exists defer_paid_module_disable on public.organization_modules;
create trigger defer_paid_module_disable
before update of enabled on public.organization_modules
for each row execute function private.defer_paid_module_disable();

create or replace function private.capture_paddle_billing_period()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_cancel_at_end boolean := false;
  v_price_ids text[] := '{}';
  v_item jsonb;
begin
  v_start := coalesce(nullif(new.payload #>> '{data,current_billing_period,starts_at}', '')::timestamptz,
                      nullif(new.payload #>> '{data,billing_period,starts_at}', '')::timestamptz);
  v_end := coalesce(nullif(new.payload #>> '{data,current_billing_period,ends_at}', '')::timestamptz,
                    nullif(new.payload #>> '{data,billing_period,ends_at}', '')::timestamptz,
                    nullif(new.payload #>> '{data,scheduled_change,effective_at}', '')::timestamptz);
  v_cancel_at_end := (new.payload #>> '{data,scheduled_change,action}') = 'cancel';

  if jsonb_typeof(new.payload #> '{data,items}') = 'array' then
    for v_item in select value from jsonb_array_elements(new.payload #> '{data,items}') loop
      v_price_ids := array_append(v_price_ids, coalesce(v_item #>> '{price,id}', v_item ->> 'price_id'));
    end loop;
    v_price_ids := array_remove(v_price_ids, null);
  end if;

  if new.organization_id is not null then
    update public.organizations
    set current_period_start = coalesce(v_start, current_period_start),
        current_period_end = coalesce(v_end, current_period_end),
        cancel_at_period_end = v_cancel_at_end,
        billing_anchor_day = coalesce(billing_anchor_day, extract(day from coalesce(v_start, created_at))::smallint)
    where id = new.organization_id;

    if cardinality(v_price_ids) > 0 then
      update public.organization_modules m
      set current_period_start = coalesce(v_start, m.current_period_start),
          current_period_end = coalesce(v_end, m.current_period_end),
          cancel_at_period_end = case when v_cancel_at_end then true else m.cancel_at_period_end end,
          scheduled_disable_at = case when v_cancel_at_end then coalesce(v_end, m.scheduled_disable_at) else m.scheduled_disable_at end,
          billing_status = case when v_cancel_at_end then 'cancel_scheduled' else m.billing_status end
      where m.organization_id = new.organization_id and m.price_id = any(v_price_ids);
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.capture_paddle_billing_period() from public, anon, authenticated;
drop trigger if exists capture_paddle_billing_period on public.paddle_webhook_events;
create trigger capture_paddle_billing_period
after insert on public.paddle_webhook_events
for each row execute function private.capture_paddle_billing_period();

create or replace function private.finalize_due_module_cancellations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare v_count integer;
begin
  update public.organization_modules
  set enabled = false, status = 'Av', billing_status = 'inactive', cancel_at_period_end = false,
      scheduled_disable_at = null, deactivated_at = now(), updated_at = now()
  where enabled = true and cancel_at_period_end = true
    and scheduled_disable_at is not null and scheduled_disable_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function private.finalize_due_module_cancellations() from public, anon, authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'finalize-due-module-cancellations') then
    perform cron.unschedule('finalize-due-module-cancellations');
  end if;
  perform cron.schedule('finalize-due-module-cancellations', '5 * * * *',
    'select private.finalize_due_module_cancellations();');
end $$;

alter table public.creem_webhook_events enable row level security;
revoke all on public.creem_webhook_events from anon, authenticated;
