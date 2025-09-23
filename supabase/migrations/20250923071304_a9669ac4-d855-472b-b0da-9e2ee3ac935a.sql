-- Limpeza dos dados inconsistentes e criação de políticas corretas para executivos

-- Primeiro, garantir que todos os usuários tenham um perfil
INSERT INTO profiles (user_id, display_name, created_at, updated_at, last_seen_at, suspended)
SELECT 
  id as user_id,
  COALESCE(raw_user_meta_data->>'display_name', 'Usuário ' || substring(id::text, 1, 8)) as display_name,
  created_at,
  updated_at,
  last_sign_in_at as last_seen_at,
  false as suspended
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM profiles)
ON CONFLICT (user_id) DO NOTHING;

-- Garantir que todos os usuários tenham pelo menos o role 'seller'
INSERT INTO user_roles (user_id, role)
SELECT p.user_id, 'seller'::app_role
FROM profiles p
WHERE p.user_id NOT IN (SELECT user_id FROM user_roles)
ON CONFLICT (user_id, role) DO NOTHING;

-- Atualizar as políticas RLS para que executivos vejam todos os perfis
DROP POLICY IF EXISTS "Executives can view all profiles" ON profiles;
CREATE POLICY "Executives can view all profiles" 
ON profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  is_executive(auth.uid()) OR 
  auth.uid() = 'c84e101d-e966-477a-8ef6-c3766cd781cf'::uuid
);

-- Política específica para o super admin ver tudo
DROP POLICY IF EXISTS "Super admin can view all profiles" ON profiles;
CREATE POLICY "Super admin can view all profiles" 
ON profiles 
FOR ALL 
USING (auth.uid() = 'c84e101d-e966-477a-8ef6-c3766cd781cf'::uuid);