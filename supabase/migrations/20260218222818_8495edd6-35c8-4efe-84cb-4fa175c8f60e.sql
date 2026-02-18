
-- Table: triggered_alerts
CREATE TABLE public.triggered_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  coin_symbol TEXT NOT NULL,
  triggered_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.triggered_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own triggered alerts"
  ON public.triggered_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert triggered alerts"
  ON public.triggered_alerts FOR INSERT
  WITH CHECK (true);

-- Table: public_templates
CREATE TABLE public.public_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  layout_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  widgets_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.public_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view templates"
  ON public.public_templates FOR SELECT
  USING (true);

CREATE POLICY "Users can create own templates"
  ON public.public_templates FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own templates"
  ON public.public_templates FOR DELETE
  USING (auth.uid() = created_by);

-- Add foreign key from alerts.user_id to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'alerts_user_id_fkey'
  ) THEN
    ALTER TABLE public.alerts
      ADD CONSTRAINT alerts_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from dashboards.user_id to profiles if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'dashboards_user_id_fkey'
  ) THEN
    ALTER TABLE public.dashboards
      ADD CONSTRAINT dashboards_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
