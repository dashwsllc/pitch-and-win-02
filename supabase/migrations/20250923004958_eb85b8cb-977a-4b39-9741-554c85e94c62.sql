-- Add suspended flag to profiles and allow executives to update profiles
-- 1) Add column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS suspended boolean NOT NULL DEFAULT false;

-- 2) RLS policy to allow executives to update all profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Executives can update all profiles'
  ) THEN
    CREATE POLICY "Executives can update all profiles"
    ON public.profiles
    FOR UPDATE
    USING (is_executive(auth.uid()))
    WITH CHECK (is_executive(auth.uid()));
  END IF;
END $$;