-- Criar tabela para gerenciamento de membros da equipe
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  date_added TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Somente executives podem ver e gerenciar membros
CREATE POLICY "Executives can view all team members" 
ON public.team_members 
FOR SELECT 
TO authenticated
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can insert team members" 
ON public.team_members 
FOR INSERT 
TO authenticated
WITH CHECK (is_executive(auth.uid()));

CREATE POLICY "Executives can update team members" 
ON public.team_members 
FOR UPDATE 
TO authenticated
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can delete team members" 
ON public.team_members 
FOR DELETE 
TO authenticated
USING (is_executive(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.team_members (name, position, date_added) VALUES
('Sinclair', 'Co-Founders', '2024-01-01 00:00:00'),
('Willer', 'Co-Founders', '2024-01-01 00:00:00'),
('Pedro Iago', 'Seller', '2024-02-15 00:00:00'),
('Rafael Peixoto', 'Seller', '2024-02-20 00:00:00');