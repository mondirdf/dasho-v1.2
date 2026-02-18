
-- Cache table for Fear & Greed index
CREATE TABLE public.cache_fear_greed (
  id TEXT NOT NULL DEFAULT 'current' PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 50,
  value_classification TEXT NOT NULL DEFAULT 'Neutral',
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cache_fear_greed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fear greed cache"
  ON public.cache_fear_greed FOR SELECT
  USING (true);
