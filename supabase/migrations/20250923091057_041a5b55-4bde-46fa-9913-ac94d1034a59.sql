-- Adicionar colunas para tags, status e histórico na tabela team_members
ALTER TABLE team_members 
ADD COLUMN status TEXT NOT NULL DEFAULT 'Ativo',
ADD COLUMN custom_tags TEXT[] DEFAULT '{}',
ADD COLUMN status_reason TEXT;

-- Criar tabela para histórico de requerimentos
CREATE TABLE team_member_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES team_members(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'created', 'updated', 'status_changed'
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para cargos customizados
CREATE TABLE custom_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  max_members INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE team_member_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_positions ENABLE ROW LEVEL SECURITY;

-- Policies para team_member_history
CREATE POLICY "Executives can view all history" 
ON team_member_history FOR SELECT 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can insert history" 
ON team_member_history FOR INSERT 
WITH CHECK (is_executive(auth.uid()));

-- Policies para custom_positions
CREATE POLICY "Executives can view all positions" 
ON custom_positions FOR SELECT 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can manage positions" 
ON custom_positions FOR ALL 
USING (is_executive(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_team_member_history_updated_at
  BEFORE UPDATE ON team_member_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_positions_updated_at
  BEFORE UPDATE ON custom_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Atualizar dados existentes com tags padrão
UPDATE team_members 
SET custom_tags = CASE 
  WHEN name = 'Sinclair' THEN ARRAY['Co-Founder', 'Dev']
  WHEN name = 'Willer' THEN ARRAY['Co-Founder', 'Expert'] 
  ELSE ARRAY['Ativo']
END,
status = CASE 
  WHEN name IN ('Sinclair', 'Willer') THEN 'Ativo'
  ELSE 'Ativo'
END;