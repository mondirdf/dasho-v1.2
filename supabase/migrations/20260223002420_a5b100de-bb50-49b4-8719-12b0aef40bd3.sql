
-- Watchlist items table
CREATE TABLE public.watchlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL DEFAULT 'crypto',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol, asset_type)
);

ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist" ON public.watchlist_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own watchlist items" ON public.watchlist_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own watchlist items" ON public.watchlist_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own watchlist items" ON public.watchlist_items FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_watchlist_items_updated_at
  BEFORE UPDATE ON public.watchlist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily briefs table
CREATE TABLE public.daily_briefs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brief_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(brief_date)
);

ALTER TABLE public.daily_briefs ENABLE ROW LEVEL SECURITY;

-- Daily briefs are readable by all authenticated users
CREATE POLICY "Authenticated users can read daily briefs" ON public.daily_briefs FOR SELECT USING (true);
