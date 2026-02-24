
-- Table: user_behavior_events
CREATE TABLE public.user_behavior_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type text NOT NULL,
  symbol text,
  timeframe text,
  market_context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_behavior_events_user_created ON public.user_behavior_events (user_id, created_at DESC);
CREATE INDEX idx_behavior_events_type ON public.user_behavior_events (event_type);

ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own events
CREATE POLICY "Users can view own behavior events"
  ON public.user_behavior_events FOR SELECT
  USING (auth.uid() = user_id);

-- Block all direct client writes (service role only)
CREATE POLICY "No direct client insert on behavior events"
  ON public.user_behavior_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct client update on behavior events"
  ON public.user_behavior_events FOR UPDATE
  USING (false);

CREATE POLICY "No direct client delete on behavior events"
  ON public.user_behavior_events FOR DELETE
  USING (false);

-- Table: edge_intelligence_summaries
CREATE TABLE public.edge_intelligence_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  summary_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, week_start)
);

CREATE INDEX idx_edge_summaries_user ON public.edge_intelligence_summaries (user_id, week_start DESC);

ALTER TABLE public.edge_intelligence_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edge summaries"
  ON public.edge_intelligence_summaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "No direct client insert on edge summaries"
  ON public.edge_intelligence_summaries FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct client update on edge summaries"
  ON public.edge_intelligence_summaries FOR UPDATE
  USING (false);

CREATE POLICY "No direct client delete on edge summaries"
  ON public.edge_intelligence_summaries FOR DELETE
  USING (false);
