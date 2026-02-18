
-- Add plan limit enforcement functions

-- Function to count user dashboards
CREATE OR REPLACE FUNCTION public.count_user_dashboards(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.dashboards WHERE user_id = _user_id;
$$;

-- Function to count user alerts
CREATE OR REPLACE FUNCTION public.count_user_alerts(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.alerts WHERE user_id = _user_id;
$$;

-- Function to count widgets in a dashboard
CREATE OR REPLACE FUNCTION public.count_dashboard_widgets(_dashboard_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.widgets WHERE dashboard_id = _dashboard_id;
$$;

-- Function to get user plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(plan, 'free') FROM public.profiles WHERE id = _user_id;
$$;

-- Add check on dashboard creation for free plan (max 1 dashboard)
CREATE OR REPLACE FUNCTION public.enforce_dashboard_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  dashboard_count integer;
BEGIN
  user_plan := get_user_plan(NEW.user_id);
  IF user_plan = 'free' THEN
    dashboard_count := count_user_dashboards(NEW.user_id);
    IF dashboard_count >= 1 THEN
      RAISE EXCEPTION 'Free plan allows only 1 dashboard. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_dashboard_limit_trigger
BEFORE INSERT ON public.dashboards
FOR EACH ROW
EXECUTE FUNCTION public.enforce_dashboard_limit();

-- Add check on alert creation for free plan (max 10 alerts)
CREATE OR REPLACE FUNCTION public.enforce_alert_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  alert_count integer;
BEGIN
  user_plan := get_user_plan(NEW.user_id);
  IF user_plan = 'free' THEN
    alert_count := count_user_alerts(NEW.user_id);
    IF alert_count >= 10 THEN
      RAISE EXCEPTION 'Free plan allows only 10 alerts. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_alert_limit_trigger
BEFORE INSERT ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_alert_limit();

-- Add check on widget creation for free plan (max 5 widgets per dashboard)
CREATE OR REPLACE FUNCTION public.enforce_widget_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_plan text;
  widget_count integer;
  dashboard_owner uuid;
BEGIN
  SELECT user_id INTO dashboard_owner FROM public.dashboards WHERE id = NEW.dashboard_id;
  user_plan := get_user_plan(dashboard_owner);
  IF user_plan = 'free' THEN
    widget_count := count_dashboard_widgets(NEW.dashboard_id);
    IF widget_count >= 5 THEN
      RAISE EXCEPTION 'Free plan allows only 5 widgets per dashboard. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_widget_limit_trigger
BEFORE INSERT ON public.widgets
FOR EACH ROW
EXECUTE FUNCTION public.enforce_widget_limit();

-- Add use_count to public_templates
ALTER TABLE public.public_templates ADD COLUMN IF NOT EXISTS use_count integer NOT NULL DEFAULT 0;

-- Enable realtime on cache tables
ALTER PUBLICATION supabase_realtime ADD TABLE cache_crypto_data;
ALTER PUBLICATION supabase_realtime ADD TABLE triggered_alerts;
