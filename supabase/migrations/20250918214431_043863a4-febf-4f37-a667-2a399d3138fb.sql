-- Insert role for the executive user
-- First get the user ID from the auth.users table
WITH executive_user AS (
  SELECT id FROM auth.users WHERE email = 'executive@wsltda.site' LIMIT 1
)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'executive'::public.app_role
FROM executive_user
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = (SELECT id FROM executive_user) 
  AND ur.role = 'executive'
);