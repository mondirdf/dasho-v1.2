
-- Update the scheduler cron job with the anon key directly
-- The anon key is a publishable key, not a secret
SELECT cron.unschedule('pulseboard-scheduler');

SELECT cron.schedule(
  'pulseboard-scheduler',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://wlustbjdqwemnqtyilxp.supabase.co/functions/v1/scheduler',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXN0YmpkcXdlbW5xdHlpbHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTAxOTMsImV4cCI6MjA4NzAyNjE5M30.TTcHFzR-MRHPGV8piY5vkF_nnViZ1ij2kqyg4JnDbwY"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
