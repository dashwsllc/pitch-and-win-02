-- Criar tabela para controlar saques e valores disponíveis
CREATE TABLE public.saques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  valor_solicitado NUMERIC NOT NULL,
  chave_pix TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  data_solicitacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  data_processamento TIMESTAMP WITH TIME ZONE,
  processado_por UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para controlar valores disponíveis para saque
CREATE TABLE public.saldos_disponiveis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  valor_total_comissoes NUMERIC NOT NULL DEFAULT 0,
  valor_liberado_para_saque NUMERIC NOT NULL DEFAULT 0,
  valor_sacado NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saldos_disponiveis ENABLE ROW LEVEL SECURITY;

-- Políticas para saques
CREATE POLICY "Users can view their own saques" 
ON public.saques 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saques" 
ON public.saques 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives can view all saques" 
ON public.saques 
FOR SELECT 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can update all saques" 
ON public.saques 
FOR UPDATE 
USING (is_executive(auth.uid()));

-- Políticas para saldos disponíveis
CREATE POLICY "Users can view their own saldo" 
ON public.saldos_disponiveis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own saldo" 
ON public.saldos_disponiveis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saldo" 
ON public.saldos_disponiveis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Executives can view all saldos" 
ON public.saldos_disponiveis 
FOR SELECT 
USING (is_executive(auth.uid()));

CREATE POLICY "Executives can update all saldos" 
ON public.saldos_disponiveis 
FOR UPDATE 
USING (is_executive(auth.uid()));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_saques_updated_at
BEFORE UPDATE ON public.saques
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saldos_disponiveis_updated_at
BEFORE UPDATE ON public.saldos_disponiveis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();