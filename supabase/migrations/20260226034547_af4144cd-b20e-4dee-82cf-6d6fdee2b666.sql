CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE((
    SELECT CASE
      WHEN plan = 'pro' AND (trial_ends_at IS NULL OR trial_ends_at > now()) THEN 'pro'
      ELSE 'free'
    END
    FROM public.profiles
    WHERE id = _user_id
  ), 'free');
$function$;