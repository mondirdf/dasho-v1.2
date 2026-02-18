
-- Tighten triggered_alerts INSERT policy
-- Only allow insert when user_id matches auth.uid()
-- (service role bypasses RLS anyway)
DROP POLICY "Service can insert triggered alerts" ON public.triggered_alerts;
CREATE POLICY "Users can insert own triggered alerts"
  ON public.triggered_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);
