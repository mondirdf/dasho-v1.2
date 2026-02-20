
-- Cache tables for multi-asset support

-- ── Stocks ──
CREATE TABLE public.cache_stock_data (
  symbol text NOT NULL PRIMARY KEY,
  price numeric,
  change_24h numeric,
  volume numeric,
  market_cap numeric,
  last_updated timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_stock_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read stock cache" ON public.cache_stock_data FOR SELECT USING (true);

-- ── Forex ──
CREATE TABLE public.cache_forex_data (
  symbol text NOT NULL PRIMARY KEY,
  price numeric,
  change_24h numeric,
  last_updated timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_forex_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read forex cache" ON public.cache_forex_data FOR SELECT USING (true);

-- ── Commodities ──
CREATE TABLE public.cache_commodity_data (
  symbol text NOT NULL PRIMARY KEY,
  price numeric,
  change_24h numeric,
  last_updated timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_commodity_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read commodity cache" ON public.cache_commodity_data FOR SELECT USING (true);

-- ── Global Indices ──
CREATE TABLE public.cache_index_data (
  symbol text NOT NULL PRIMARY KEY,
  price numeric,
  change_24h numeric,
  volume numeric,
  last_updated timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_index_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read index cache" ON public.cache_index_data FOR SELECT USING (true);

-- ── Macro News ──
CREATE TABLE public.cache_macro_news (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  source text,
  url text NOT NULL,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cache_macro_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read macro news cache" ON public.cache_macro_news FOR SELECT USING (true);
