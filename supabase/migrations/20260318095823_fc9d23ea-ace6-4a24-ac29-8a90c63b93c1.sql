
-- Agent Wallets: persistent credits/economy for each agent
CREATE TABLE public.agent_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'credits',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id)
);

ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view wallets" ON public.agent_wallets
  FOR SELECT TO public USING (true);

CREATE POLICY "Owners manage own wallets" ON public.agent_wallets
  FOR ALL TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Wallet transactions log
CREATE TABLE public.agent_wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.agent_wallets(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'payment',
  description TEXT,
  counterparty_agent_id UUID REFERENCES public.external_agents(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transactions" ON public.agent_wallet_transactions
  FOR SELECT TO public USING (true);

CREATE POLICY "System can insert transactions" ON public.agent_wallet_transactions
  FOR INSERT TO authenticated WITH CHECK (true);

-- Agent Contracts: collaboration agreements between agents
CREATE TABLE public.agent_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  target_agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'revenue_share',
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  revenue_split NUMERIC DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'proposed',
  duration_days INTEGER DEFAULT 30,
  total_value NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.agent_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contracts" ON public.agent_contracts
  FOR SELECT TO public USING (true);

CREATE POLICY "System can insert contracts" ON public.agent_contracts
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "System can update contracts" ON public.agent_contracts
  FOR UPDATE TO authenticated USING (true);

-- Agent Skills: trackable skill levels for the skills marketplace
CREATE TABLE public.agent_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'general',
  is_for_hire BOOLEAN DEFAULT false,
  hourly_rate NUMERIC DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, skill_name)
);

ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills" ON public.agent_skills
  FOR SELECT TO public USING (true);

CREATE POLICY "System can manage skills" ON public.agent_skills
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Agent reputation history
CREATE TABLE public.agent_reputation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 50,
  category TEXT NOT NULL DEFAULT 'overall',
  reason TEXT,
  delta NUMERIC NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reputation" ON public.agent_reputation
  FOR SELECT TO public USING (true);

CREATE POLICY "System can insert reputation" ON public.agent_reputation
  FOR INSERT TO authenticated WITH CHECK (true);

-- Add agent_owner_id to city_buildings to support agent-owned buildings
ALTER TABLE public.city_buildings ADD COLUMN IF NOT EXISTS agent_owner_id UUID REFERENCES public.external_agents(id);

-- Missions/quests system
CREATE TABLE public.agent_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  mission_type TEXT NOT NULL DEFAULT 'daily',
  reward_credits NUMERIC NOT NULL DEFAULT 10,
  reward_xp INTEGER NOT NULL DEFAULT 50,
  required_skill TEXT,
  min_skill_level INTEGER DEFAULT 0,
  max_participants INTEGER DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.agent_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view missions" ON public.agent_missions
  FOR SELECT TO public USING (true);

CREATE POLICY "System can manage missions" ON public.agent_missions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Mission completions
CREATE TABLE public.agent_mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES public.agent_missions(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.external_agents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  reward_earned NUMERIC DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_mission_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view completions" ON public.agent_mission_completions
  FOR SELECT TO public USING (true);

CREATE POLICY "System can insert completions" ON public.agent_mission_completions
  FOR INSERT TO authenticated WITH CHECK (true);
