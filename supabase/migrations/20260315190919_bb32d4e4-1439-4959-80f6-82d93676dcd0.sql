
-- Agent Activity Log: records all autonomous agent actions
CREATE TABLE public.agent_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  building_id text,
  action_type text NOT NULL DEFAULT 'task',
  description text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view activity" ON public.agent_activity_log FOR SELECT USING (true);
CREATE POLICY "System can insert activity" ON public.agent_activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- Emergent Terms: vocabulary detected across agent communications
CREATE TABLE public.emergent_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  term text NOT NULL,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  occurrences integer DEFAULT 1,
  agents_using text[] DEFAULT '{}',
  estimated_meaning text,
  category text DEFAULT 'general',
  status text DEFAULT 'emerging',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergent_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view terms" ON public.emergent_terms FOR SELECT USING (true);
CREATE POLICY "System can manage terms" ON public.emergent_terms FOR INSERT TO authenticated WITH CHECK (true);

-- City Events: historical timeline of significant events
CREATE TABLE public.city_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  importance integer DEFAULT 1,
  agents_involved text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.city_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON public.city_events FOR SELECT USING (true);
CREATE POLICY "System can insert events" ON public.city_events FOR INSERT TO authenticated WITH CHECK (true);

-- Agent Creations: outputs generated autonomously
CREATE TABLE public.agent_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  building_id text,
  creation_type text NOT NULL DEFAULT 'text',
  title text NOT NULL,
  content text,
  reactions integer DEFAULT 0,
  reuse_count integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_creations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view creations" ON public.agent_creations FOR SELECT USING (true);
CREATE POLICY "System can insert creations" ON public.agent_creations FOR INSERT TO authenticated WITH CHECK (true);

-- Emergent Workflows: detected repeated task sequences
CREATE TABLE public.emergent_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sequence jsonb NOT NULL DEFAULT '[]',
  detection_count integer DEFAULT 1,
  is_saved boolean DEFAULT false,
  saved_by uuid,
  first_detected_at timestamptz NOT NULL DEFAULT now(),
  last_detected_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.emergent_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view emergent workflows" ON public.emergent_workflows FOR SELECT USING (true);
CREATE POLICY "Auth users can save workflows" ON public.emergent_workflows FOR UPDATE TO authenticated USING (true);

-- Social Protocol: agent coordination signals
CREATE TABLE public.agent_protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent text NOT NULL,
  to_agent text NOT NULL,
  protocol_type text NOT NULL DEFAULT 'collaboration_request',
  status text DEFAULT 'pending',
  message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE public.agent_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view protocols" ON public.agent_protocols FOR SELECT USING (true);
CREATE POLICY "System can manage protocols" ON public.agent_protocols FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for activity log
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_activity_log;
ALTER PUBLICATION supabase_realtime ADD TABLE public.city_events;
