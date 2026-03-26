
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _display_name TEXT;
  _company_name TEXT;
  _building_count INT;
  _grid_x NUMERIC;
  _grid_z NUMERIC;
  _grid_col INT;
  _grid_row INT;
  _spacing NUMERIC := 8;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email);
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');

  -- Create profile
  INSERT INTO public.profiles (id, display_name, company_name)
  VALUES (NEW.id, _display_name, _company_name);

  -- Deterministic grid position based on building count
  SELECT COUNT(*) INTO _building_count FROM public.city_buildings WHERE owner_id IS NOT NULL;
  _grid_col := _building_count % 10;
  _grid_row := _building_count / 10;
  _grid_x := (_grid_col - 5) * _spacing + 4;
  _grid_z := (_grid_row - 5) * _spacing + 4;

  -- Auto-create a building in the city for this user
  INSERT INTO public.city_buildings (
    name, owner_id, district, style, floors, height,
    position_x, position_z, primary_color, secondary_color, metadata
  ) VALUES (
    COALESCE(NULLIF(_company_name, ''), _display_name || '''s HQ'),
    NEW.id, 'central', 'corporate', 3, 6,
    _grid_x, _grid_z,
    '#3b82f6', '#1e3a5f',
    jsonb_build_object('auto_created', true, 'created_at_signup', true, 'needs_onboarding', true)
  );

  -- Assign default Explorer plan
  INSERT INTO public.user_plans (user_id, plan_id, status)
  VALUES (NEW.id, 'explorer', 'active');

  -- Create onboarding progress
  INSERT INTO public.user_onboarding (user_id, current_step, completed)
  VALUES (NEW.id, 0, false);

  RETURN NEW;
END;
$function$;
