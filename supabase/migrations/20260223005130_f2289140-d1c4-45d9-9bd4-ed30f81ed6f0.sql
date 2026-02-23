
-- Smart Alert Rules table for event-based alerts (Pro feature)
CREATE TABLE public.smart_alert_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'bos', 'choch', 'regime_change', 'mtf_confluence'
  symbol TEXT NOT NULL DEFAULT 'BTC',
  condition_json JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.smart_alert_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own smart alert rules" ON public.smart_alert_rules
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own smart alert rules" ON public.smart_alert_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own smart alert rules" ON public.smart_alert_rules
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own smart alert rules" ON public.smart_alert_rules
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_smart_alert_rules_updated_at
  BEFORE UPDATE ON public.smart_alert_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Saved Layouts table for widget layout profiles (Pro feature)
CREATE TABLE public.saved_layouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  layout_json JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved layouts" ON public.saved_layouts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own saved layouts" ON public.saved_layouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own saved layouts" ON public.saved_layouts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved layouts" ON public.saved_layouts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_saved_layouts_updated_at
  BEFORE UPDATE ON public.saved_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
