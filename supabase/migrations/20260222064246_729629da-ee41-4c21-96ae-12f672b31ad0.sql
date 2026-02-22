
-- OHLC candle cache for Binance kline data
CREATE TABLE public.cache_ohlc_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol text NOT NULL,
  timeframe text NOT NULL, -- '1m','5m','15m','1h','4h','1d'
  open_time bigint NOT NULL,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume numeric NOT NULL DEFAULT 0,
  close_time bigint NOT NULL,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(symbol, timeframe, open_time)
);

-- Index for fast queries by symbol+timeframe
CREATE INDEX idx_ohlc_symbol_tf_time ON public.cache_ohlc_data (symbol, timeframe, open_time DESC);

-- Enable RLS
ALTER TABLE public.cache_ohlc_data ENABLE ROW LEVEL SECURITY;

-- Public read for authenticated users
CREATE POLICY "Authenticated users can read OHLC cache"
  ON public.cache_ohlc_data
  FOR SELECT
  USING (true);
