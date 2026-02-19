
-- 1. Add source_type to alerts for category-agnostic alerts
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'crypto';
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS source_label text;

-- 2. Add public sharing fields to public_templates
ALTER TABLE public.public_templates ADD COLUMN IF NOT EXISTS public_share_id uuid UNIQUE DEFAULT gen_random_uuid();
ALTER TABLE public.public_templates ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;
ALTER TABLE public.public_templates ADD COLUMN IF NOT EXISTS clone_count integer NOT NULL DEFAULT 0;

-- 3. Allow anyone (even unauthenticated) to read public templates by share_id
CREATE POLICY "Anyone can view public templates by share_id"
  ON public.public_templates FOR SELECT
  USING (is_public = true);

-- 4. Allow template owner to update their templates (for clone_count, etc.)
CREATE POLICY "Users can update own templates"
  ON public.public_templates FOR UPDATE
  USING (auth.uid() = created_by);

-- 5. Create index for share_id lookups
CREATE INDEX IF NOT EXISTS idx_templates_public_share_id ON public.public_templates (public_share_id);

-- 6. Create index for alerts source_type
CREATE INDEX IF NOT EXISTS idx_alerts_source_type ON public.alerts (source_type);
