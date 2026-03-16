-- Fix office_agents: restrict management to building owners only
DROP POLICY IF EXISTS "Auth users manage office agents" ON public.office_agents;

CREATE POLICY "Office owners manage agents"
ON public.office_agents FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.city_buildings
    WHERE city_buildings.id::text = office_agents.office_id
    AND city_buildings.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.city_buildings
    WHERE city_buildings.id::text = office_agents.office_id
    AND city_buildings.owner_id = auth.uid()
  )
);