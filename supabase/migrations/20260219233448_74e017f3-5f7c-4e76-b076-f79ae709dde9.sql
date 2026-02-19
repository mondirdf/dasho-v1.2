-- 1. Update handle_new_user to NOT set trial_ends_at
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$function$;

-- 2. Update get_user_plan to ignore trial_ends_at
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    CASE
      WHEN plan = 'pro' THEN 'pro'
      ELSE 'free'
    END
  FROM public.profiles WHERE id = _user_id;
$function$;

-- 3. Clear trial_ends_at for existing users who are not pro
UPDATE public.profiles SET trial_ends_at = NULL WHERE plan = 'free';