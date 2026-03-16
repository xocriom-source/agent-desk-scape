
-- Add geographic fields to city_buildings (incremental, no breaking changes)
ALTER TABLE public.city_buildings
  ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS region text DEFAULT '';

-- Add geographic fields to digital_businesses too (for businesses without a building yet)
ALTER TABLE public.digital_businesses
  ADD COLUMN IF NOT EXISTS latitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS longitude numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS region text DEFAULT '';

-- Indexes for geo queries
CREATE INDEX IF NOT EXISTS idx_city_buildings_lat_lng ON public.city_buildings(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_city_buildings_country ON public.city_buildings(country);
CREATE INDEX IF NOT EXISTS idx_city_buildings_city ON public.city_buildings(city);
CREATE INDEX IF NOT EXISTS idx_digital_businesses_lat_lng ON public.digital_businesses(latitude, longitude) WHERE latitude IS NOT NULL;
