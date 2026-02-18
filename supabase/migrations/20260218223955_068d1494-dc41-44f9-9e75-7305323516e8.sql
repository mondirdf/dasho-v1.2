
-- Schedule the unified scheduler to run every minute
-- This replaces the need for 3 separate cron jobs
SELECT cron.schedule(
  'pulseboard-scheduler',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wlustbjdqwemnqtyilxp.supabase.co/functions/v1/scheduler',
    headers := format('{"Content-Type":"application/json","Authorization":"Bearer %s"}',
      current_setting('app.settings.anon_key', true))::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
