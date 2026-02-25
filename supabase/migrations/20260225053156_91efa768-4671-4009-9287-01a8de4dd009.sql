
-- Create trades table for Trade Journal with market context
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL DEFAULT 'BTC',
  direction TEXT NOT NULL DEFAULT 'long', -- long/short
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  entry_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  exit_time TIMESTAMP WITH TIME ZONE,
  position_size NUMERIC DEFAULT 1,
  pnl NUMERIC,
  pnl_percent NUMERIC,
  outcome TEXT, -- win/loss/breakeven
  market_context JSONB NOT NULL DEFAULT '{}'::jsonb, -- regime, volatility, bias, fear_greed, session snapshot
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open', -- open/closed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_trades_user_id ON public.trades(user_id);
CREATE INDEX idx_trades_outcome ON public.trades(user_id, outcome);
CREATE INDEX idx_trades_entry_time ON public.trades(user_id, entry_time DESC);

-- Trigger for updated_at
CREATE TRIGGER update_trades_updated_at
  BEFORE UPDATE ON public.trades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
