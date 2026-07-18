insert into public.organization_modules(organization_id,module_id,enabled,status,billing_status,created_at,updated_at)
select o.id,'arrangement-pro',false,'Av','inactive',now(),now()
from public.organizations o
on conflict (organization_id,module_id) do nothing;

create or replace function public.organization_has_arrangement_pro(p_organization_id text)
returns boolean
language sql
stable
security invoker
set search_path=public
as $$
  select exists(
    select 1
    from public.organization_modules om
    where om.organization_id=p_organization_id
      and om.module_id='arrangement-pro'
      and om.enabled=true
      and (om.scheduled_disable_at is null or om.scheduled_disable_at>now())
  );
$$;

revoke all on function public.organization_has_arrangement_pro(text) from public,anon;
grant execute on function public.organization_has_arrangement_pro(text) to authenticated;

create or replace function public.enforce_arrangement_pro_activity_features()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$
begin
  if new.registration_enabled and not public.organization_has_arrangement_pro(new.organization_id) then
    new.registration_enabled:=false;
    new.registration_deadline:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_arrangement_pro_on_activities on public.organization_activities;
create trigger enforce_arrangement_pro_on_activities
before insert or update of registration_enabled,registration_deadline on public.organization_activities
for each row execute function public.enforce_arrangement_pro_activity_features();

create or replace function public.enforce_arrangement_pro_checkins()
returns trigger
language plpgsql
security invoker
set search_path=public
as $$;
begin
  if not public.organization_has_arrangement_pro(new.organization_id) then
    raise exception 'arrangement_pro_required';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_arrangement_pro_on_checkins on public.activity_checkins;
create trigger enforce_arrangement_pro_on_checkins
before insert on public.activity_checkins
for each row execute function public.enforce_arrangement_pro_checkins();

update public.organization_activities a
set registration_enabled=false,registration_deadline=null,updated_at=now()
where registration_enabled=true
  and not public.organization_has_arrangement_pro(a.organization_id);
