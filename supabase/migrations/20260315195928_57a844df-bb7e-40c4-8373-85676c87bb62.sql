
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'member', 'guest');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: admins can view all roles, users can view own
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Only admins can manage roles
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System logs table
CREATE TABLE public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL DEFAULT 'info',
  category TEXT NOT NULL DEFAULT 'system',
  message TEXT NOT NULL,
  user_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON public.system_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert logs"
  ON public.system_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admin function to list all profiles (bypasses profile RLS for admin)
CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.profiles ORDER BY created_at DESC
$$;

-- Admin function to get user count
CREATE OR REPLACE FUNCTION public.admin_get_counts()
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'users', (SELECT COUNT(*) FROM public.profiles),
    'agents', (SELECT COUNT(*) FROM public.workspace_agents),
    'workflows', (SELECT COUNT(*) FROM public.workspace_workflows),
    'meetings', (SELECT COUNT(*) FROM public.meetings WHERE status = 'live'),
    'presence', (SELECT COUNT(*) FROM public.user_presence WHERE last_seen > now() - interval '15 minutes'),
    'channels', (SELECT COUNT(*) FROM public.chat_channels),
    'messages', (SELECT COUNT(*) FROM public.chat_messages),
    'events', (SELECT COUNT(*) FROM public.city_events)
  )
$$;
