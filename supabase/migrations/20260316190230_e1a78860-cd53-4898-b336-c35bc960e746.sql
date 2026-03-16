
ALTER TABLE public.digital_businesses
  ADD COLUMN IF NOT EXISTS country text DEFAULT '',
  ADD COLUMN IF NOT EXISTS profit numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS growth_rate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS founded_at text DEFAULT '',
  ADD COLUMN IF NOT EXISTS team_size integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS business_model text DEFAULT 'subscription',
  ADD COLUMN IF NOT EXISTS category_data jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
