-- Adicionar foreign key relationship entre user_roles e profiles
-- Isso ajudará com as consultas JOIN e melhorará a performance

-- Verificar se a foreign key já existe e criar se não existir
DO $$
BEGIN
    -- Tentar adicionar foreign key para user_roles -> profiles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_roles_user_id_fkey' 
        AND table_name = 'user_roles'
    ) THEN
        ALTER TABLE user_roles 
        ADD CONSTRAINT user_roles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);