
-- Add behavioral intelligence columns to trades
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS pre_trade_check_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS news_intensity TEXT DEFAULT 'none', -- none/low/medium/high
  ADD COLUMN IF NOT EXISTS behavioral_flags JSONB DEFAULT '[]'::jsonb, -- detected patterns like revenge_trade, late_entry, etc.
  ADD COLUMN IF NOT EXISTS entry_hour INTEGER, -- 0-23 UTC for time-of-day clustering
  ADD COLUMN IF NOT EXISTS rule_violations TEXT[] DEFAULT '{}'; -- tracked violations

-- Create edge_scores table for compounding memory
CREATE TABLE public.edge_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 50, -- 0-100, starts at 50
  components JSONB NOT NULL DEFAULT '{}'::jsonb, -- breakdown: discipline, context_awareness, pattern_adherence
  week_start DATE NOT NULL,
  trades_count INTEGER DEFAULT 0,
  wins_in_favorable INTEGER DEFAULT 0, -- wins when conditions were favorable
  losses_against_pattern INTEGER DEFAULT 0, -- losses when pattern said don't trade
  rules_followed INTEGER DEFAULT 0,
  rules_violated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.edge_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own edge scores" ON public.edge_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own edge scores" ON public.edge_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own edge scores" ON public.edge_scores FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_edge_scores_user ON public.edge_scores(user_id, week_start DESC);

CREATE TRIGGER update_edge_scores_updated_at
  BEFORE UPDATE ON public.edge_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
