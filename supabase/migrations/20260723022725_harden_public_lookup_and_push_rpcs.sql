create or replace function public.is_organization_slug_available(
  p_slug text,
  p_exclude_organization_id text default null
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_slug text := public.normalize_organization_slug(p_slug);
  v_effective_exclude text := null;
begin
  if p_exclude_organization_id is not null and (
    exists (
      select 1
      from public.organization_admins oa
      where oa.organization_id = p_exclude_organization_id
        and oa.user_id = auth.uid()
        and oa.invitation_status = 'accepted'
        and oa.role in ('owner','admin')
    )
    or exists (
      select 1
      from public.admins a
      where a.auth_user_id = auth.uid()
        and a.role in ('owner','super_admin','superadmin')
    )
    or coalesce(auth.role(),'') = 'service_role'
  ) then
    v_effective_exclude := p_exclude_organization_id;
  end if;

  return not exists (
    select 1
    from public.organizations o
    where lower(o.slug) = lower(v_slug)
      and (v_effective_exclude is null or o.id <> v_effective_exclude)
  )
  and v_slug not in (
    'www','app','test','admin','api','login','register','registrer',
    'dashboard','support','mail','status'
  );
end;
$$;

revoke all on function public.is_organization_slug_available(text,text) from public;
grant execute on function public.is_organization_slug_available(text,text) to anon, authenticated, service_role;

create or replace function public.get_public_activity_registration_counts(p_activity_ids uuid[])
returns table(activity_id uuid, registered bigint)
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $$
begin
  if p_activity_ids is null then
    return;
  end if;
  if cardinality(p_activity_ids) > 100 then
    raise exception 'too_many_activity_ids';
  end if;

  return query
  select r.activity_id, coalesce(sum(r.attendees),0)::bigint
  from public.activity_registrations r
  join public.organization_activities a on a.id = r.activity_id
  where r.activity_id = any(p_activity_ids)
    and r.status = 'confirmed'
    and a.status = 'published'
    and a.visibility = 'public'
  group by r.activity_id;
end;
$$;

revoke all on function public.get_public_activity_registration_counts(uuid[]) from public;
grant execute on function public.get_public_activity_registration_counts(uuid[]) to anon, authenticated, service_role;

create or replace function public.register_push_subscription(
  subscription_id_input text,
  organization_id_input text,
  endpoint_input text,
  subscription_input jsonb
)
returns void
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $$
declare
  v_subscription_id text := btrim(subscription_id_input);
  v_organization_id text := btrim(organization_id_input);
  v_endpoint text := btrim(endpoint_input);
begin
  if coalesce(v_subscription_id, '') = '' then raise exception 'Subscription id is required'; end if;
  if length(v_subscription_id) > 120 then raise exception 'Subscription id is too long'; end if;
  if coalesce(v_organization_id, '') = '' then raise exception 'Organization is required'; end if;
  if length(v_organization_id) > 120 then raise exception 'Organization id is too long'; end if;
  if coalesce(v_endpoint, '') = '' then raise exception 'Endpoint is required'; end if;
  if length(v_endpoint) > 2048 then raise exception 'Endpoint is too long'; end if;
  if v_endpoint !~* '^https://' then raise exception 'Endpoint must use HTTPS'; end if;
  if subscription_input is null or jsonb_typeof(subscription_input) <> 'object' then raise exception 'Subscription must be an object'; end if;
  if pg_column_size(subscription_input) > 16384 then raise exception 'Subscription is too large'; end if;
  if not exists (select 1 from public.organizations where id = v_organization_id) then raise exception 'Organization not found'; end if;

  perform public.enforce_public_rate_limit(
    'push_subscription',
    v_organization_id,
    v_endpoint,
    interval '10 minutes',
    20
  );

  insert into public.push_subscriptions (id, organization_id, endpoint, subscription)
  values (v_subscription_id, v_organization_id, v_endpoint, subscription_input)
  on conflict (id) do update
  set organization_id = excluded.organization_id,
      endpoint = excluded.endpoint,
      subscription = excluded.subscription;
end;
$$;

revoke all on function public.register_push_subscription(text,text,text,jsonb) from public;
grant execute on function public.register_push_subscription(text,text,text,jsonb) to anon, authenticated, service_role;
