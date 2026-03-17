
-- Plans table
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  stripe_product_id text,
  stripe_price_id text,
  max_buildings integer DEFAULT 1,
  max_agents integer DEFAULT 3,
  max_cities integer DEFAULT 1,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT TO public USING (true);

-- Insert plans
INSERT INTO public.plans (id, name, description, price_cents, currency, stripe_product_id, stripe_price_id, max_buildings, max_agents, max_cities, features) VALUES
('explorer', 'Explorer', 'Plano gratuito para explorar a plataforma', 0, 'usd', 'prod_UAAnOz8omzjTgB', 'price_1TBqSC2OPq4ZTShLDF7B0nIF', 1, 3, 1, '["basic_receptionist","public_chat","daily_missions"]'::jsonb),
('business', 'Business', 'Para empreendedores ativos', 4900, 'usd', 'prod_UAAoLCk0ESELPg', 'price_1TBqSr2OPq4ZTShLjWu98mCC', 5, 10, 2, '["advanced_receptionist","analytics","marketplace","5_floors"]'::jsonb),
('mogul', 'Mogul', 'Para líderes e investidores', 19900, 'usd', 'prod_UAAqS62X5nnqac', 'price_1TBqUP2OPq4ZTShLDxcdsGgH', -1, -1, -1, '["all_cities","dedicated_api","custom_ai","vip_support","unlimited_buildings","unlimited_agents"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  price_cents = EXCLUDED.price_cents,
  max_buildings = EXCLUDED.max_buildings,
  max_agents = EXCLUDED.max_agents,
  max_cities = EXCLUDED.max_cities,
  features = EXCLUDED.features;

-- User plans table (tracks which plan each user is on)
CREATE TABLE IF NOT EXISTS public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan_id text NOT NULL DEFAULT 'explorer' REFERENCES public.plans(id),
  status text NOT NULL DEFAULT 'active',
  activated_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own plan" ON public.user_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System insert user plans" ON public.user_plans FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "System update user plans" ON public.user_plans FOR UPDATE TO authenticated USING (true);

-- Onboarding progress
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_step integer DEFAULT 0,
  completed boolean DEFAULT false,
  steps_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own onboarding" ON public.user_onboarding FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user to assign default plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _display_name TEXT;
  _company_name TEXT;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email);
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');

  -- Create profile
  INSERT INTO public.profiles (id, display_name, company_name)
  VALUES (NEW.id, _display_name, _company_name);

  -- Auto-create a building in the city for this user
  INSERT INTO public.city_buildings (
    name, owner_id, district, style, floors, height,
    position_x, position_z, primary_color, secondary_color, metadata
  ) VALUES (
    COALESCE(NULLIF(_company_name, ''), _display_name || '''s HQ'),
    NEW.id, 'central', 'corporate', 3, 6,
    (random() * 180 - 90)::numeric, (random() * 180 - 90)::numeric,
    '#3b82f6', '#1e3a5f',
    jsonb_build_object('auto_created', true, 'created_at_signup', true)
  );

  -- Assign default Explorer plan
  INSERT INTO public.user_plans (user_id, plan_id, status)
  VALUES (NEW.id, 'explorer', 'active');

  -- Create onboarding progress
  INSERT INTO public.user_onboarding (user_id, current_step, completed)
  VALUES (NEW.id, 0, false);

  RETURN NEW;
END;
$function$;
