
-- Create analytics_events table for internal behavior tracking
CREATE TABLE public.analytics_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name text NOT NULL,
  user_id uuid NULL,
  session_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Indexes for fast aggregation queries
CREATE INDEX idx_analytics_events_name ON public.analytics_events (event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events (created_at DESC);
CREATE INDEX idx_analytics_events_name_created ON public.analytics_events (event_name, created_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events (user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Only service role can read (admin edge function uses service role)
-- No direct client access — events are inserted via edge function
CREATE POLICY "No direct client read on analytics_events"
  ON public.analytics_events FOR SELECT USING (false);

CREATE POLICY "No direct client insert on analytics_events"
  ON public.analytics_events FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct client update on analytics_events"
  ON public.analytics_events FOR UPDATE USING (false);

CREATE POLICY "No direct client delete on analytics_events"
  ON public.analytics_events FOR DELETE USING (false);
