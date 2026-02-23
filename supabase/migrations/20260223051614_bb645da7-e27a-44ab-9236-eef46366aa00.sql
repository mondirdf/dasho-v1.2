
CREATE OR REPLACE FUNCTION public.enforce_widget_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_plan text;
  widget_count integer;
  dashboard_owner uuid;
BEGIN
  SELECT user_id INTO dashboard_owner FROM public.dashboards WHERE id = NEW.dashboard_id;
  user_plan := get_user_plan(dashboard_owner);
  IF user_plan = 'free' THEN
    widget_count := count_dashboard_widgets(NEW.dashboard_id);
    IF widget_count >= 15 THEN
      RAISE EXCEPTION 'Free plan allows only 15 widgets per dashboard. Upgrade to Pro for unlimited.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
