-- Adicionar RLS policy para suspender usuários de acessar o sistema quando suspensos
CREATE OR REPLACE FUNCTION check_user_not_suspended()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE user_id = auth.uid() 
    AND suspended = true
  )
$$;

-- Verificar se políticas para usuários suspensos já existem em auth
-- Nota: Isso é informativo apenas, não podemos modificar schema auth diretamente