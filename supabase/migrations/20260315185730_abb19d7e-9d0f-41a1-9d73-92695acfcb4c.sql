
-- Marketplace: Services offered by building owners
CREATE TABLE public.marketplace_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  building_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  price_range TEXT DEFAULT 'negotiable',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketplace: Collaboration proposals
CREATE TABLE public.marketplace_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID REFERENCES auth.users NOT NULL,
  to_user_id UUID REFERENCES auth.users NOT NULL,
  service_id UUID REFERENCES public.marketplace_services(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marketplace: Freelancer profiles
CREATE TABLE public.marketplace_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  portfolio_url TEXT,
  hourly_rate TEXT,
  availability TEXT DEFAULT 'available',
  rating NUMERIC(3,2) DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketplace_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_profiles ENABLE ROW LEVEL SECURITY;

-- RLS: Services - anyone can view, owners can manage
CREATE POLICY "Anyone can view active services" ON public.marketplace_services FOR SELECT USING (status = 'active');
CREATE POLICY "Users can manage own services" ON public.marketplace_services FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS: Proposals - participants can view, sender can create
CREATE POLICY "Users can view own proposals" ON public.marketplace_proposals FOR SELECT TO authenticated USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can create proposals" ON public.marketplace_proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Recipient can update proposal status" ON public.marketplace_proposals FOR UPDATE TO authenticated USING (auth.uid() = to_user_id);

-- RLS: Profiles - anyone can view, owner can manage
CREATE POLICY "Anyone can view profiles" ON public.marketplace_profiles FOR SELECT USING (true);
CREATE POLICY "Users can manage own profile" ON public.marketplace_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
