
-- Deny direct client access to admin-only tables
-- Events: only service_role access via edge functions
CREATE POLICY "No direct client access to events"
  ON public.events FOR SELECT
  TO authenticated
  USING (false);

-- Promo codes: only service_role access via edge functions  
CREATE POLICY "No direct client access to promo_codes"
  ON public.promo_codes FOR SELECT
  TO authenticated
  USING (false);

-- Promo usage: only service_role access via edge functions
CREATE POLICY "No direct client access to promo_usage"
  ON public.promo_usage FOR SELECT
  TO authenticated
  USING (false);
