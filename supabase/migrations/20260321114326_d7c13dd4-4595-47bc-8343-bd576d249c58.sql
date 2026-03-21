
-- =============================================
-- MÓDULO 1: USUÁRIOS (complementos)
-- =============================================

-- user_verifications
CREATE TABLE public.user_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kyc_status text NOT NULL DEFAULT 'pending',
  identity_verified boolean NOT NULL DEFAULT false,
  funds_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.user_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own verification" ON public.user_verifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own verification" ON public.user_verifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_wallets
CREATE TABLE public.user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address text,
  wallet_type text NOT NULL DEFAULT 'internal',
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, wallet_type)
);
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own wallets" ON public.user_wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own wallets" ON public.user_wallets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_permissions
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permission text NOT NULL UNIQUE
);
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view permissions" ON public.user_permissions FOR SELECT TO public USING (true);

-- user_role_permissions
CREATE TABLE public.user_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.user_permissions(id) ON DELETE CASCADE,
  UNIQUE(role, permission_id)
);
ALTER TABLE public.user_role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view role permissions" ON public.user_role_permissions FOR SELECT TO public USING (true);

-- =============================================
-- MÓDULO 2: ATIVOS DIGITAIS
-- =============================================

-- asset_categories
CREATE TABLE public.asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  icon text DEFAULT '📦',
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view categories" ON public.asset_categories FOR SELECT TO public USING (true);

-- asset_subcategories
CREATE TABLE public.asset_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.asset_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  UNIQUE(category_id, name)
);
ALTER TABLE public.asset_subcategories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view subcategories" ON public.asset_subcategories FOR SELECT TO public USING (true);

-- assets (the main listing table)
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  category_id uuid REFERENCES public.asset_categories(id),
  subcategory_id uuid REFERENCES public.asset_subcategories(id),
  country text,
  founded_at timestamptz,
  team_size integer DEFAULT 1,
  business_model text DEFAULT 'subscription',
  price numeric,
  status text NOT NULL DEFAULT 'draft',
  business_id uuid REFERENCES public.digital_businesses(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published assets" ON public.assets FOR SELECT TO public USING (status IN ('published', 'active'));
CREATE POLICY "Owners manage own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- asset_metrics (yearly)
CREATE TABLE public.asset_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  year integer NOT NULL,
  revenue numeric DEFAULT 0,
  expenses numeric DEFAULT 0,
  profit numeric DEFAULT 0,
  customers integer DEFAULT 0,
  growth_rate numeric DEFAULT 0,
  UNIQUE(asset_id, year)
);
ALTER TABLE public.asset_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view metrics of published" ON public.asset_metrics FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage metrics" ON public.asset_metrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_metrics.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_metrics.asset_id AND assets.owner_id = auth.uid()));

-- asset_last_metrics (snapshot)
CREATE TABLE public.asset_last_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE UNIQUE,
  last_month_revenue numeric DEFAULT 0,
  last_month_profit numeric DEFAULT 0,
  ttm_revenue numeric DEFAULT 0,
  ttm_profit numeric DEFAULT 0,
  growth_rate numeric DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_last_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view last metrics" ON public.asset_last_metrics FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage last metrics" ON public.asset_last_metrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_last_metrics.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_last_metrics.asset_id AND assets.owner_id = auth.uid()));

-- asset_custom_fields
CREATE TABLE public.asset_custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  field_value text,
  UNIQUE(asset_id, field_key)
);
ALTER TABLE public.asset_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view custom fields" ON public.asset_custom_fields FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage custom fields" ON public.asset_custom_fields FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_custom_fields.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_custom_fields.asset_id AND assets.owner_id = auth.uid()));

-- =============================================
-- MÓDULO 3: TECH STACK
-- =============================================

CREATE TABLE public.technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category text DEFAULT 'general',
  icon text DEFAULT '🔧'
);
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view technologies" ON public.technologies FOR SELECT TO public USING (true);

CREATE TABLE public.asset_technologies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  technology_id uuid NOT NULL REFERENCES public.technologies(id) ON DELETE CASCADE,
  UNIQUE(asset_id, technology_id)
);
ALTER TABLE public.asset_technologies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view asset tech" ON public.asset_technologies FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage asset tech" ON public.asset_technologies FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_technologies.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_technologies.asset_id AND assets.owner_id = auth.uid()));

-- =============================================
-- MÓDULO 4: DOCUMENTOS
-- =============================================

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text,
  type text NOT NULL DEFAULT 'general',
  visibility text NOT NULL DEFAULT 'private',
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Uploaders manage docs" ON public.documents FOR ALL TO authenticated USING (auth.uid() = uploaded_by) WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Public docs visible" ON public.documents FOR SELECT TO authenticated USING (visibility = 'public');

CREATE TABLE public.document_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(document_id, user_id)
);
ALTER TABLE public.document_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own access" ON public.document_access FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Doc owners grant access" ON public.document_access FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.documents WHERE documents.id = document_access.document_id AND documents.uploaded_by = auth.uid()));

-- =============================================
-- MÓDULO 5: NDA
-- =============================================

CREATE TABLE public.ndas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  template text NOT NULL DEFAULT 'standard',
  content text,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ndas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view NDAs" ON public.ndas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owners create NDAs" ON public.ndas FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE TABLE public.nda_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nda_id uuid NOT NULL REFERENCES public.ndas(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  signed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  UNIQUE(nda_id, buyer_id)
);
ALTER TABLE public.nda_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signers see own sigs" ON public.nda_signatures FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "Users can sign NDAs" ON public.nda_signatures FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

-- =============================================
-- MÓDULO 6: FAVORITOS (watchlists)
-- =============================================

CREATE TABLE public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My Watchlist',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watchlists" ON public.watchlists FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid NOT NULL REFERENCES public.watchlists(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, asset_id)
);
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own items" ON public.watchlist_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.watchlists WHERE watchlists.id = watchlist_items.watchlist_id AND watchlists.user_id = auth.uid()));

-- =============================================
-- MÓDULO 7: OFERTAS
-- =============================================

CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  offer_price numeric NOT NULL,
  offer_type text NOT NULL DEFAULT 'full_acquisition',
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers see own offers" ON public.offers FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM public.assets WHERE assets.id = offers.asset_id AND assets.owner_id = auth.uid()));
CREATE POLICY "Buyers create offers" ON public.offers FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update offers" ON public.offers FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR EXISTS (SELECT 1 FROM public.assets WHERE assets.id = offers.asset_id AND assets.owner_id = auth.uid()));

CREATE TABLE public.offer_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text,
  counter_price numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.offer_negotiations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see negotiations" ON public.offer_negotiations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.offers WHERE offers.id = offer_negotiations.offer_id AND (offers.buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.assets WHERE assets.id = offers.asset_id AND assets.owner_id = auth.uid()))));
CREATE POLICY "Participants add negotiations" ON public.offer_negotiations FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);

-- =============================================
-- MÓDULO 8: DEALS
-- =============================================

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  offer_id uuid REFERENCES public.offers(id),
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'initiated',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see deals" ON public.deals FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "System create deals" ON public.deals FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Participants update deals" ON public.deals FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE TABLE public.deal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  completed_at timestamptz,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deal participants see milestones" ON public.deal_milestones FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.deals WHERE deals.id = deal_milestones.deal_id AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())));
CREATE POLICY "System manage milestones" ON public.deal_milestones FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================
-- MÓDULO 9: MENSAGENS (conversations)
-- =============================================

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES public.assets(id),
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see conversations" ON public.conversations FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);

CREATE TABLE public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  attachment_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants see messages" ON public.conversation_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = conversation_messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())));
CREATE POLICY "Participants send messages" ON public.conversation_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Participants update read status" ON public.conversation_messages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.conversations WHERE conversations.id = conversation_messages.conversation_id AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())));

-- =============================================
-- MÓDULO 11: AVALIAÇÃO DE ATIVOS
-- =============================================

CREATE TABLE public.valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  estimated_value numeric NOT NULL,
  method text NOT NULL DEFAULT 'multiple',
  multiple numeric,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.valuations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view valuations" ON public.valuations FOR SELECT TO public USING (true);
CREATE POLICY "Owners create valuations" ON public.valuations FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.valuation_factors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  valuation_id uuid NOT NULL REFERENCES public.valuations(id) ON DELETE CASCADE,
  factor text NOT NULL,
  weight numeric NOT NULL DEFAULT 1,
  score numeric DEFAULT 0
);
ALTER TABLE public.valuation_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view factors" ON public.valuation_factors FOR SELECT TO public USING (true);
CREATE POLICY "System insert factors" ON public.valuation_factors FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- MÓDULO 12: CONCORRENTES
-- =============================================

CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view competitors" ON public.competitors FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create competitors" ON public.competitors FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.asset_competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  UNIQUE(asset_id, competitor_id)
);
ALTER TABLE public.asset_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view asset competitors" ON public.asset_competitors FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage competitors" ON public.asset_competitors FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_competitors.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_competitors.asset_id AND assets.owner_id = auth.uid()));

-- =============================================
-- MÓDULO 13: CRESCIMENTO
-- =============================================

CREATE TABLE public.growth_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  description text NOT NULL,
  impact_score integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.growth_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view opportunities" ON public.growth_opportunities FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage opportunities" ON public.growth_opportunities FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = growth_opportunities.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = growth_opportunities.asset_id AND assets.owner_id = auth.uid()));

-- =============================================
-- MÓDULO 14: ANALYTICS (asset_interest)
-- =============================================

CREATE TABLE public.asset_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.asset_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view interest" ON public.asset_interest FOR SELECT TO public USING (true);
CREATE POLICY "Auth users log interest" ON public.asset_interest FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- MÓDULO 15: BUSCA
-- =============================================

CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Search',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own searches" ON public.saved_searches FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- MÓDULO 16: TAGS
-- =============================================

CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view tags" ON public.tags FOR SELECT TO public USING (true);
CREATE POLICY "Auth users create tags" ON public.tags FOR INSERT TO authenticated WITH CHECK (true);

CREATE TABLE public.asset_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(asset_id, tag_id)
);
ALTER TABLE public.asset_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view asset tags" ON public.asset_tags FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage asset tags" ON public.asset_tags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_tags.asset_id AND assets.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.assets WHERE assets.id = asset_tags.asset_id AND assets.owner_id = auth.uid()));

-- =============================================
-- MÓDULO 17: MODERAÇÃO
-- =============================================

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  reported_by uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins view reports" ON public.reports FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Reporters see own" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reported_by);

CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  action text NOT NULL,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage moderation" ON public.moderation_actions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- =============================================
-- MÓDULO 18: ADMINISTRAÇÃO
-- =============================================

CREATE TABLE public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view logs" ON public.admin_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert logs" ON public.admin_logs FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- CIDADE VIRTUAL: building_assets
-- =============================================

CREATE TABLE public.building_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id uuid NOT NULL REFERENCES public.city_buildings(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(building_id, asset_id)
);
ALTER TABLE public.building_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view building assets" ON public.building_assets FOR SELECT TO public USING (true);
CREATE POLICY "Owners manage building assets" ON public.building_assets FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.city_buildings WHERE city_buildings.id = building_assets.building_id AND city_buildings.owner_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.city_buildings WHERE city_buildings.id = building_assets.building_id AND city_buildings.owner_id = auth.uid()));

-- =============================================
-- ÍNDICES DE PERFORMANCE
-- =============================================

CREATE INDEX idx_assets_owner ON public.assets(owner_id);
CREATE INDEX idx_assets_category ON public.assets(category_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_asset_metrics_asset ON public.asset_metrics(asset_id);
CREATE INDEX idx_offers_asset ON public.offers(asset_id);
CREATE INDEX idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX idx_deals_buyer ON public.deals(buyer_id);
CREATE INDEX idx_deals_seller ON public.deals(seller_id);
CREATE INDEX idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX idx_conv_messages_conv ON public.conversation_messages(conversation_id);
CREATE INDEX idx_asset_interest_asset ON public.asset_interest(asset_id);
CREATE INDEX idx_documents_asset ON public.documents(asset_id);
CREATE INDEX idx_watchlist_items_asset ON public.watchlist_items(asset_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_building_assets_building ON public.building_assets(building_id);

-- =============================================
-- SEED: CATEGORIAS PADRÃO
-- =============================================

INSERT INTO public.asset_categories (name, slug, icon) VALUES
  ('SaaS', 'saas', '☁️'),
  ('Marketplace', 'marketplace', '🏪'),
  ('Agency', 'agency', '🏢'),
  ('Ecommerce', 'ecommerce', '🛒'),
  ('Newsletter', 'newsletter', '📧'),
  ('AI', 'ai', '🤖'),
  ('Mobile App', 'mobile-app', '📱'),
  ('Content', 'content', '📝'),
  ('Community', 'community', '👥'),
  ('DeFi', 'defi', '💰');

-- SEED: TECHNOLOGIES
INSERT INTO public.technologies (name, category, icon) VALUES
  ('React', 'frontend', '⚛️'),
  ('Node.js', 'backend', '🟢'),
  ('Python', 'backend', '🐍'),
  ('MongoDB', 'database', '🍃'),
  ('PostgreSQL', 'database', '🐘'),
  ('Stripe', 'payments', '💳'),
  ('AWS', 'infrastructure', '☁️'),
  ('Vercel', 'infrastructure', '▲'),
  ('OpenAI', 'ai', '🧠'),
  ('Supabase', 'backend', '⚡');

-- SEED: TAGS
INSERT INTO public.tags (name) VALUES
  ('profitable'), ('growing'), ('bootstrapped'), ('funded'),
  ('recurring-revenue'), ('low-churn'), ('high-margin'),
  ('automated'), ('niche'), ('global');
