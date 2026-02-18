
-- Performance indexes (idempotent with IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_dashboards_user_id ON public.dashboards (user_id);

CREATE INDEX IF NOT EXISTS idx_widgets_dashboard_id ON public.widgets (dashboard_id);
CREATE INDEX IF NOT EXISTS idx_widgets_type ON public.widgets (type);

CREATE INDEX IF NOT EXISTS idx_alerts_user_active ON public.alerts (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alerts_coin_symbol ON public.alerts (coin_symbol);

CREATE INDEX IF NOT EXISTS idx_triggered_alerts_user_id ON public.triggered_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_triggered_alerts_alert_id ON public.triggered_alerts (alert_id);
CREATE INDEX IF NOT EXISTS idx_triggered_alerts_created_at ON public.triggered_alerts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_news_published_at ON public.cache_news (published_at DESC);

-- System logs table for monitoring
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cleanup queries and recent log lookups
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON public.system_logs (type);

-- RLS: no frontend access, only service_role writes
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
-- No policies = no frontend access. Edge functions use service_role which bypasses RLS.
