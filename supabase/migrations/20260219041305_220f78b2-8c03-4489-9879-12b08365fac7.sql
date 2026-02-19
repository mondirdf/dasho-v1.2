
-- Add trial_ends_at column to profiles
ALTER TABLE public.profiles
ADD COLUMN trial_ends_at timestamp with time zone DEFAULT (now() + interval '14 days');

-- Set trial_ends_at for existing users (already past trial)
UPDATE public.profiles
SET trial_ends_at = created_at + interval '14 days'
WHERE trial_ends_at IS NULL OR trial_ends_at = (now() + interval '14 days');

-- Update handle_new_user to set trial_ends_at on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, trial_ends_at)
  VALUES (NEW.id, NEW.email, now() + interval '14 days');
  RETURN NEW;
END;
$$;

-- Update enforce functions to allow Pro-level access during active trial
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN plan = 'pro' THEN 'pro'
      WHEN trial_ends_at IS NOT NULL AND trial_ends_at > now() THEN 'pro'
      ELSE 'free'
    END
  FROM public.profiles WHERE id = _user_id;
$$;
