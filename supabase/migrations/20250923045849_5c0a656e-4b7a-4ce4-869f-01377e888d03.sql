-- Track last activity for accurate session control
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Helpful index for sorting/filtering by last activity
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at
ON public.profiles (last_seen_at DESC);
