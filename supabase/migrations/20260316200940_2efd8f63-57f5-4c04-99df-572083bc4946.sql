
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _display_name TEXT;
  _company_name TEXT;
BEGIN
  _display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email);
  _company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', '');

  -- Create profile
  INSERT INTO public.profiles (id, display_name, company_name)
  VALUES (NEW.id, _display_name, _company_name);

  -- Auto-create a building in the city for this user
  INSERT INTO public.city_buildings (
    name,
    owner_id,
    district,
    style,
    floors,
    height,
    position_x,
    position_z,
    primary_color,
    secondary_color,
    metadata
  ) VALUES (
    COALESCE(NULLIF(_company_name, ''), _display_name || '''s HQ'),
    NEW.id,
    'central',
    'corporate',
    3,
    6,
    (random() * 180 - 90)::numeric,
    (random() * 180 - 90)::numeric,
    '#3b82f6',
    '#1e3a5f',
    jsonb_build_object('auto_created', true, 'created_at_signup', true)
  );

  RETURN NEW;
END;
$function$;

-- Recreate trigger (drop if exists first, then re-add)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
