-- Automatically delete expired manual push messages from Supabase.
-- Run this once in Supabase SQL Editor, or apply it as a Supabase migration.

create extension if not exists pg_cron with schema extensions;

do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'delete-expired-push-messages'
  ) then
    perform cron.unschedule('delete-expired-push-messages');
  end if;
end $$;

select cron.schedule(
  'delete-expired-push-messages',
  '0 * * * *',
  $$
    delete from public.push_messages
    where expires_at < now();
  $$
);
