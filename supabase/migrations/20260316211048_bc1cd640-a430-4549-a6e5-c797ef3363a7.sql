
-- =============================================
-- INTEGRATION INFRASTRUCTURE TABLES
-- =============================================

-- 1. Platform integrations catalog
CREATE TABLE public.platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  icon TEXT DEFAULT '🔗',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'available',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view integrations" ON public.platform_integrations FOR SELECT TO public USING (true);

-- 2. User-connected integrations
CREATE TABLE public.user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  integration_id UUID REFERENCES public.platform_integrations(id) ON DELETE CASCADE NOT NULL,
  access_token_configured BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'connected',
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own integrations" ON public.user_integrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Integration event logs
CREATE TABLE public.integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.platform_integrations(id) ON DELETE CASCADE,
  user_id UUID,
  event TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own integration logs" ON public.integration_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert logs" ON public.integration_logs FOR INSERT TO authenticated WITH CHECK (true);

-- 4. Integration webhooks
CREATE TABLE public.integration_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.platform_integrations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT '*',
  secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.integration_webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own webhooks" ON public.integration_webhooks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- EXTERNAL AGENT NETWORK TABLES
-- =============================================

-- 5. External agents registry (OpenClaw etc)
CREATE TABLE public.external_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openclaw',
  agent_type TEXT NOT NULL DEFAULT 'assistant',
  capabilities JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'inactive',
  owner_user_id UUID NOT NULL,
  building_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_heartbeat TIMESTAMPTZ,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.external_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view agents" ON public.external_agents FOR SELECT TO public USING (true);
CREATE POLICY "Users manage own agents" ON public.external_agents FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);

-- 6. Agent credentials (tokens stored securely)
CREATE TABLE public.agent_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.external_agents(id) ON DELETE CASCADE NOT NULL,
  api_key_hash TEXT,
  provider_token_configured BOOLEAN DEFAULT false,
  scopes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agent owners manage credentials" ON public.agent_credentials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.external_agents WHERE external_agents.id = agent_credentials.agent_id AND external_agents.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.external_agents WHERE external_agents.id = agent_credentials.agent_id AND external_agents.owner_user_id = auth.uid()));

-- 7. External agent tasks
CREATE TABLE public.external_agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.external_agents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'general',
  payload JSONB DEFAULT '{}'::jsonb,
  result JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  execution_time_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.external_agent_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tasks" ON public.external_agent_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view tasks" ON public.external_agent_tasks FOR SELECT TO public USING (true);

-- 8. Office-agent assignments
CREATE TABLE public.office_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id TEXT NOT NULL,
  agent_id UUID REFERENCES public.external_agents(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(office_id, agent_id)
);

ALTER TABLE public.office_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view office agents" ON public.office_agents FOR SELECT TO public USING (true);
CREATE POLICY "Auth users manage office agents" ON public.office_agents FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Agent activity analytics
CREATE TABLE public.agent_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.external_agents(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES public.external_agent_tasks(id) ON DELETE SET NULL,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view analytics" ON public.agent_analytics FOR SELECT TO public USING (true);
CREATE POLICY "System can insert analytics" ON public.agent_analytics FOR INSERT TO authenticated WITH CHECK (true);

-- 10. Platform event bus
CREATE TABLE public.platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system',
  actor_id UUID,
  target_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.platform_events FOR SELECT TO public USING (true);
CREATE POLICY "Auth can insert events" ON public.platform_events FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for events and agent tasks
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_agent_tasks;

-- Seed platform integrations catalog
INSERT INTO public.platform_integrations (name, provider, category, auth_type, icon, description) VALUES
  ('OpenAI', 'openai', 'ai_agents', 'api_key', '🤖', 'GPT models for analysis and generation'),
  ('Anthropic', 'anthropic', 'ai_agents', 'api_key', '🧠', 'Claude models for reasoning and research'),
  ('Google AI', 'google', 'ai_agents', 'api_key', '🔍', 'Gemini models for multimodal AI'),
  ('Hugging Face', 'huggingface', 'ai_agents', 'api_key', '🤗', 'Open source ML models'),
  ('OpenClaw', 'openclaw', 'agent_network', 'api_key', '🦾', 'External agent network for autonomous tasks'),
  ('Stripe', 'stripe', 'payments', 'oauth2', '💳', 'Payment processing and revenue verification'),
  ('PayPal', 'paypal', 'payments', 'oauth2', '💰', 'Payment processing and invoicing'),
  ('Wise', 'wise', 'payments', 'api_key', '🌍', 'International transfers'),
  ('Zapier', 'zapier', 'automation', 'api_key', '⚡', 'Workflow automation platform'),
  ('Make', 'make', 'automation', 'api_key', '🔧', 'Visual automation builder'),
  ('n8n', 'n8n', 'automation', 'webhook', '🔗', 'Open source workflow automation'),
  ('HubSpot', 'hubspot', 'business_tools', 'oauth2', '🟠', 'CRM and marketing platform'),
  ('Salesforce', 'salesforce', 'business_tools', 'oauth2', '☁️', 'Enterprise CRM'),
  ('Twilio', 'twilio', 'communication', 'api_key', '📱', 'SMS, voice and messaging'),
  ('SendGrid', 'sendgrid', 'communication', 'api_key', '📧', 'Email delivery service'),
  ('Discord', 'discord', 'communication', 'oauth2', '🎮', 'Community and team chat'),
  ('Crunchbase', 'crunchbase', 'market_data', 'api_key', '📊', 'Startup and company data'),
  ('Clearbit', 'clearbit', 'market_data', 'api_key', '🔎', 'Company enrichment data'),
  ('Ethereum', 'ethereum', 'blockchain', 'wallet', '⛓️', 'Smart contracts and tokenization'),
  ('Chainlink', 'chainlink', 'blockchain', 'api_key', '🔗', 'Oracle network for smart contracts'),
  ('Google Analytics', 'google_analytics', 'analytics', 'oauth2', '📈', 'Traffic and conversion analytics'),
  ('Mixpanel', 'mixpanel', 'analytics', 'api_key', '📉', 'Product analytics platform');
