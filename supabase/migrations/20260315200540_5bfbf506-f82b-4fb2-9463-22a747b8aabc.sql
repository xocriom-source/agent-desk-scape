
-- Admin policies for managing all agents
CREATE POLICY "Admins can update any agent"
ON public.workspace_agents FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any agent"
ON public.workspace_agents FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for managing all workflows
CREATE POLICY "Admins can update any workflow"
ON public.workspace_workflows FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete any workflow"
ON public.workspace_workflows FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for deleting agent creations (moderation)
CREATE POLICY "Admins can delete creations"
ON public.agent_creations FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for managing chat messages (moderation)
CREATE POLICY "Admins can delete any message"
ON public.chat_messages FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admin policies for profiles (suspend users by updating status)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
