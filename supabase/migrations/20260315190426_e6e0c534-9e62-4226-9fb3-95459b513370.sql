
-- Workspace Agents: AI agents connected to buildings
CREATE TABLE public.workspace_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  agent_type text NOT NULL DEFAULT 'openai',
  model text DEFAULT 'gpt-4',
  status text NOT NULL DEFAULT 'inactive',
  config jsonb DEFAULT '{}',
  skills text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agents" ON public.workspace_agents FOR SELECT USING (true);
CREATE POLICY "Users manage own agents" ON public.workspace_agents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Workspace Workflows: automation workflows
CREATE TABLE public.workspace_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id text NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  provider text NOT NULL DEFAULT 'n8n',
  webhook_url text,
  status text NOT NULL DEFAULT 'inactive',
  agent_id uuid REFERENCES public.workspace_agents(id) ON DELETE SET NULL,
  last_run_at timestamptz,
  run_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workflows" ON public.workspace_workflows FOR SELECT USING (true);
CREATE POLICY "Users manage own workflows" ON public.workspace_workflows FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Prompt Library
CREATE TABLE public.workspace_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  building_id text,
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  tags text[] DEFAULT '{}',
  version integer DEFAULT 1,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public prompts visible to all" ON public.workspace_prompts FOR SELECT USING (is_public = true);
CREATE POLICY "Users see own prompts" ON public.workspace_prompts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users manage own prompts" ON public.workspace_prompts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Skills library
CREATE TABLE public.workspace_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text DEFAULT 'general',
  icon text DEFAULT '⚡',
  config jsonb DEFAULT '{}',
  is_system boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills" ON public.workspace_skills FOR SELECT USING (true);

-- Workspace tasks / activity log
CREATE TABLE public.workspace_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id text NOT NULL,
  user_id uuid NOT NULL,
  agent_id uuid REFERENCES public.workspace_agents(id) ON DELETE SET NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.workspace_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tasks" ON public.workspace_tasks FOR SELECT USING (true);
CREATE POLICY "Users manage own tasks" ON public.workspace_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Messenger connections
CREATE TABLE public.workspace_messengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id text NOT NULL,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  bot_token_configured boolean DEFAULT false,
  status text NOT NULL DEFAULT 'disconnected',
  agent_id uuid REFERENCES public.workspace_agents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_messengers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own messengers" ON public.workspace_messengers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Insert default skills
INSERT INTO public.workspace_skills (name, description, category, icon, is_system) VALUES
  ('Lead Analysis', 'Analyze and qualify leads from various sources', 'sales', '🎯', true),
  ('Content Generation', 'Generate marketing content, blog posts, social media', 'marketing', '✍️', true),
  ('Research', 'Deep research on topics, competitors, markets', 'research', '🔍', true),
  ('Email Drafting', 'Compose professional emails and responses', 'communication', '📧', true),
  ('Code Review', 'Review and suggest improvements to code', 'development', '💻', true),
  ('Data Analysis', 'Analyze datasets and generate insights', 'analytics', '📊', true),
  ('Translation', 'Translate content between languages', 'communication', '🌐', true),
  ('Summarization', 'Summarize long documents and meetings', 'productivity', '📋', true);
