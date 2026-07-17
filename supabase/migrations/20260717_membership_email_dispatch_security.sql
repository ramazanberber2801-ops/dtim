create or replace function public.prepare_membership_email(p_request_id uuid, p_event_type text)
returns table(job_id uuid, recipient_email text, recipient_name text, organization_name text, reply_to_email text, welcome_message text)
language plpgsql security definer set search_path=public
as $$
begin
  if p_event_type not in ('received','approved','rejected') then raise exception 'invalid_event_type'; end if;
  if p_event_type <> 'received' and not exists (
    select 1 from public.organization_membership_requests r
    join public.organization_admins a on a.organization_id=r.organization_id
    where r.id=p_request_id and a.user_id=auth.uid()
  ) then raise exception 'not_authorized'; end if;
  return query
  select j.id,r.email,trim(r.first_name||' '||r.last_name),coalesce(s.display_name,s.short_name,o.name,'Yasaflow'),s.email,s.membership_welcome_message
  from public.membership_email_jobs j
  join public.organization_membership_requests r on r.id=j.request_id
  join public.organizations o on o.id=r.organization_id
  left join public.organization_settings s on s.organization_id=r.organization_id
  where j.request_id=p_request_id and j.event_type=p_event_type and j.status in ('pending','failed','processing')
  limit 1;
end;$$;
grant execute on function public.prepare_membership_email(uuid,text) to anon,authenticated;

create or replace function public.complete_membership_email(p_job_id uuid,p_request_id uuid,p_event_type text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  update public.membership_email_jobs set status='sent',processed_at=now(),last_error=null,attempts=attempts+1 where id=p_job_id and request_id=p_request_id and event_type=p_event_type;
  if p_event_type='received' then update public.organization_membership_requests set received_email_sent_at=now() where id=p_request_id;
  else update public.organization_membership_requests set decision_email_sent_at=now() where id=p_request_id; end if;
end;$$;
grant execute on function public.complete_membership_email(uuid,uuid,text) to anon,authenticated;

create or replace function public.fail_membership_email(p_job_id uuid,p_error text)
returns void language plpgsql security definer set search_path=public
as $$ begin update public.membership_email_jobs set status='failed',last_error=left(p_error,1000),attempts=attempts+1 where id=p_job_id; end; $$;
grant execute on function public.fail_membership_email(uuid,text) to anon,authenticated;
