
-- ═══════════════════════════════════════════════════════
-- 1. INDEXES on existing tables (performance boost)
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_digital_businesses_status ON public.digital_businesses(status);
CREATE INDEX IF NOT EXISTS idx_digital_businesses_category ON public.digital_businesses(category);
CREATE INDEX IF NOT EXISTS idx_digital_businesses_owner_id ON public.digital_businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_digital_businesses_mrr ON public.digital_businesses(mrr DESC);
CREATE INDEX IF NOT EXISTS idx_digital_businesses_sale_price ON public.digital_businesses(sale_price DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_business_offers_business_id ON public.business_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_from_user ON public.business_offers(from_user_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_status ON public.business_offers(status);

CREATE INDEX IF NOT EXISTS idx_profiles_building_id ON public.profiles(building_id);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_presence_user_id ON public.user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_agents_building ON public.workspace_agents(building_id);
CREATE INDEX IF NOT EXISTS idx_workspace_tasks_status ON public.workspace_tasks(status);

CREATE INDEX IF NOT EXISTS idx_agent_activity_log_created ON public.agent_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_events_created ON public.city_events(created_at DESC);

-- ═══════════════════════════════════════════════════════
-- 2. NOTIFICATIONS table
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- 3. ACTIVITY FEED table
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_name text NOT NULL DEFAULT '',
  action text NOT NULL,
  target_type text NOT NULL DEFAULT 'system',
  target_id text,
  target_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON public.activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON public.activity_feed(actor_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_target ON public.activity_feed(target_type, target_id);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity feed" ON public.activity_feed
  FOR SELECT TO public USING (true);

CREATE POLICY "Auth users can insert activity" ON public.activity_feed
  FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- 4. USER FAVORITES table
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  business_id uuid NOT NULL REFERENCES public.digital_businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_business ON public.user_favorites(business_id);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own favorites" ON public.user_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users manage own favorites" ON public.user_favorites
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- 5. ASSET VIEWS table (discovery engine)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.asset_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.digital_businesses(id) ON DELETE CASCADE,
  viewer_id uuid,
  source text DEFAULT 'map',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asset_views_business ON public.asset_views(business_id);
CREATE INDEX IF NOT EXISTS idx_asset_views_created ON public.asset_views(created_at DESC);

ALTER TABLE public.asset_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view asset views" ON public.asset_views
  FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert views" ON public.asset_views
  FOR INSERT TO authenticated WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- 6. CITY BUILDINGS table (persistent)
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.city_buildings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  district text NOT NULL DEFAULT 'central',
  style text NOT NULL DEFAULT 'corporate',
  position_x numeric NOT NULL DEFAULT 0,
  position_z numeric NOT NULL DEFAULT 0,
  height numeric NOT NULL DEFAULT 3,
  floors integer NOT NULL DEFAULT 1,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#1e3a5f',
  customizations jsonb DEFAULT '{}'::jsonb,
  business_id uuid REFERENCES public.digital_businesses(id) ON DELETE SET NULL,
  is_for_sale boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_city_buildings_owner ON public.city_buildings(owner_id);
CREATE INDEX IF NOT EXISTS idx_city_buildings_district ON public.city_buildings(district);
CREATE INDEX IF NOT EXISTS idx_city_buildings_business ON public.city_buildings(business_id);
CREATE INDEX IF NOT EXISTS idx_city_buildings_for_sale ON public.city_buildings(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_city_buildings_position ON public.city_buildings(position_x, position_z);

ALTER TABLE public.city_buildings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view buildings" ON public.city_buildings
  FOR SELECT TO public USING (true);

CREATE POLICY "Owners manage own buildings" ON public.city_buildings
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ═══════════════════════════════════════════════════════
-- 7. CITY DISTRICTS table
-- ═══════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.city_districts (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3b82f6',
  emoji text DEFAULT '🏢',
  bounds_x_min numeric DEFAULT 0,
  bounds_x_max numeric DEFAULT 100,
  bounds_z_min numeric DEFAULT 0,
  bounds_z_max numeric DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.city_districts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view districts" ON public.city_districts
  FOR SELECT TO public USING (true);

-- Seed default districts
INSERT INTO public.city_districts (id, name, description, color, emoji, bounds_x_min, bounds_x_max, bounds_z_min, bounds_z_max) VALUES
  ('tech', 'Tech District', 'Para devs, engenheiros e empresas de tecnologia', '#3b82f6', '💻', 0, 50, 0, 50),
  ('creator', 'Creator District', 'Para artistas, designers e criadores de conteúdo', '#ec4899', '🎨', 50, 100, 0, 50),
  ('startup', 'Startup District', 'Para startups, empreendedores e inovadores', '#22c55e', '🚀', 0, 50, 50, 100),
  ('agency', 'Agency District', 'Para agências, consultorias e empresas de serviço', '#f59e0b', '🏢', 50, 100, 50, 100),
  ('central', 'Central Plaza', 'Área central com maior visibilidade', '#8b5cf6', '⭐', 30, 70, 30, 70)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
