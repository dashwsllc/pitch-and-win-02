-- Expand is_executive to include super admin email bypass
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT public.has_role(_user_id, 'executive')
  OR EXISTS (
    SELECT 1 FROM auth.users u
    WHERE u.id = _user_id AND u.email = 'fecass1507@icloud.com'
  );
$$;