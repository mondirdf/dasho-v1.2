
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trading_style text,
  ADD COLUMN IF NOT EXISTS preferred_assets text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS priority_focus text,
  ADD COLUMN IF NOT EXISTS experience_level text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
