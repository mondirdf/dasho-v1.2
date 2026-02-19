
-- =============================================
-- 1. USER ROLES (Admin Access Control)
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: only admins can view roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 2. EVENTS TABLE (Analytics Engine)
-- =============================================
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_type ON public.events(event_type);
CREATE INDEX idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_type_created ON public.events(event_type, created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Only admins can read events (via edge functions with service role)
-- No direct client access needed

-- =============================================
-- 3. PAYMENTS TABLE (Payments Engine)
-- =============================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  subscription_id text,
  subscription_status text DEFAULT 'none',
  refund_status text DEFAULT 'none',
  promo_code_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX idx_payments_subscription ON public.payments(subscription_status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view own payments
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 4. PROMO CODES TABLE (Promo Engine)
-- =============================================
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  max_uses integer,
  current_uses integer NOT NULL DEFAULT 0,
  first_time_only boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  revenue_generated numeric NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_code ON public.promo_codes(code);
CREATE INDEX idx_promo_active ON public.promo_codes(is_active);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Only admins manage promo codes (via edge functions)

-- =============================================
-- 5. PROMO USAGE TABLE
-- =============================================
CREATE TABLE public.promo_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES public.promo_codes(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_usage_code ON public.promo_usage(promo_code_id);
CREATE INDEX idx_promo_usage_user ON public.promo_usage(user_id);

ALTER TABLE public.promo_usage ENABLE ROW LEVEL SECURITY;

-- Add FK from payments to promo_codes
ALTER TABLE public.payments
  ADD CONSTRAINT fk_payments_promo
  FOREIGN KEY (promo_code_id) REFERENCES public.promo_codes(id) ON DELETE SET NULL;

-- Trigger for updated_at on payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on promo_codes
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
