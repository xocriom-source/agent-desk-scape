
-- =============================================
-- MONETIZATION INFRASTRUCTURE TABLES
-- =============================================

-- 1. Stripe Accounts (Connect)
CREATE TABLE IF NOT EXISTS public.stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_account_id text NOT NULL,
  onboarding_status text NOT NULL DEFAULT 'pending',
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.stripe_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stripe account" ON public.stripe_accounts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_id uuid,
  asset_type text DEFAULT 'business',
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'card',
  stripe_payment_intent text,
  stripe_checkout_session text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "System can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);

-- 3. Escrows
CREATE TABLE IF NOT EXISTS public.escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL,
  payment_id uuid REFERENCES public.payments(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  status text NOT NULL DEFAULT 'holding',
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see own escrows" ON public.escrows FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "System insert escrows" ON public.escrows FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "System update escrows" ON public.escrows FOR UPDATE TO authenticated USING (true);

-- 4. Platform Fees
CREATE TABLE IF NOT EXISTS public.platform_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid,
  payment_id uuid REFERENCES public.payments(id),
  category text NOT NULL DEFAULT 'saas',
  percentage numeric NOT NULL DEFAULT 5,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view fees" ON public.platform_fees FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert fees" ON public.platform_fees FOR INSERT TO authenticated WITH CHECK (true);

-- 5. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subscription" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. Agent Usage (AI monetization)
CREATE TABLE IF NOT EXISTS public.agent_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_id uuid,
  tokens_used integer NOT NULL DEFAULT 0,
  cost numeric NOT NULL DEFAULT 0,
  billing_period text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON public.agent_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert usage" ON public.agent_usage FOR INSERT TO authenticated WITH CHECK (true);

-- 7. Featured Assets (paid listings)
CREATE TABLE IF NOT EXISTS public.featured_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL,
  user_id uuid NOT NULL,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL,
  priority integer DEFAULT 1,
  payment_id uuid REFERENCES public.payments(id),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.featured_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view featured" ON public.featured_assets FOR SELECT USING (true);
CREATE POLICY "Users manage own featured" ON public.featured_assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Building Transactions
CREATE TABLE IF NOT EXISTS public.building_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid,
  price numeric NOT NULL,
  transaction_type text NOT NULL DEFAULT 'purchase',
  status text NOT NULL DEFAULT 'pending',
  payment_id uuid REFERENCES public.payments(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.building_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see building txs" ON public.building_transactions FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "System insert building txs" ON public.building_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- 9. API Usage
CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  requests integer NOT NULL DEFAULT 1,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own api usage" ON public.api_usage FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert api usage" ON public.api_usage FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Financial Logs (security audit)
CREATE TABLE IF NOT EXISTS public.financial_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  amount numeric,
  currency text DEFAULT 'brl',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view financial logs" ON public.financial_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert financial logs" ON public.financial_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Fee configuration table
CREATE TABLE IF NOT EXISTS public.fee_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  percentage numeric NOT NULL DEFAULT 5,
  min_fee numeric DEFAULT 0,
  max_fee numeric,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view fee config" ON public.fee_config FOR SELECT USING (true);
CREATE POLICY "Admins manage fee config" ON public.fee_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
