
-- Digital businesses table
CREATE TABLE public.digital_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  building_id text,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'saas',
  description text,
  product_url text,
  mrr numeric NOT NULL DEFAULT 0,
  growth_percent numeric DEFAULT 0,
  sale_price numeric,
  revenue_multiple numeric DEFAULT 0,
  founder_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'listed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.digital_businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listed businesses" ON public.digital_businesses
  FOR SELECT TO public USING (status IN ('listed', 'sold'));

CREATE POLICY "Owners manage own businesses" ON public.digital_businesses
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Business offers table
CREATE TABLE public.business_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES public.digital_businesses(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid NOT NULL,
  offer_amount numeric NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business owner can view offers" ON public.business_offers
  FOR SELECT TO authenticated USING (
    from_user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.digital_businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can create offers" ON public.business_offers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Business owner can update offers" ON public.business_offers
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.digital_businesses WHERE id = business_id AND owner_id = auth.uid())
  );
