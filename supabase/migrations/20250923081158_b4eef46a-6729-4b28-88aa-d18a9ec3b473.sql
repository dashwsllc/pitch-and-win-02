-- Atribuir role de executive para o usuário Sinclair
INSERT INTO user_roles (user_id, role) 
VALUES ('c84e101d-e966-477a-8ef6-c3766cd781cf', 'executive') 
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se a função is_executive está funcionando corretamente
CREATE OR REPLACE FUNCTION public.is_executive(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(_user_id, 'executive')
$$;

-- Atualizar função has_role para garantir que funciona corretamente
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Garantir que a política RLS para profiles permite executivos verem todos os perfis
DROP POLICY IF EXISTS "Executives can view all profiles" ON profiles;
CREATE POLICY "Executives can view all profiles" 
ON profiles 
FOR SELECT 
USING (is_executive(auth.uid()));

-- Garantir que a política RLS para saques permite executivos verem todos os saques
DROP POLICY IF EXISTS "Executives can view all saques" ON saques;
CREATE POLICY "Executives can view all saques" 
ON saques 
FOR SELECT 
USING (is_executive(auth.uid()));

-- Garantir que a política RLS para vendas permite executivos verem todas as vendas
DROP POLICY IF EXISTS "Executives can view all vendas" ON vendas;
CREATE POLICY "Executives can view all vendas" 
ON vendas 
FOR SELECT 
USING (is_executive(auth.uid()));