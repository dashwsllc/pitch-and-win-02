-- Adicionar campo consideracoes_gerais na tabela vendas
ALTER TABLE public.vendas 
ADD COLUMN consideracoes_gerais text;

-- Criar função para atualizar saldo quando saque é solicitado
CREATE OR REPLACE FUNCTION public.update_balance_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um saque é inserido, reduzir o valor_liberado_para_saque
  UPDATE public.saldos_disponiveis
  SET valor_liberado_para_saque = valor_liberado_para_saque - NEW.valor_solicitado,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Se não existe registro de saldo, criar um
  IF NOT FOUND THEN
    INSERT INTO public.saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
    VALUES (NEW.user_id, 0, -NEW.valor_solicitado, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para atualizar saldo quando saque é solicitado
CREATE TRIGGER trigger_update_balance_on_withdrawal
  AFTER INSERT ON public.saques
  FOR EACH ROW
  EXECUTE FUNCTION public.update_balance_on_withdrawal();

-- Criar função para restaurar saldo quando saque é rejeitado
CREATE OR REPLACE FUNCTION public.restore_balance_on_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para 'rejeitado', restaurar o valor
  IF OLD.status != 'rejeitado' AND NEW.status = 'rejeitado' THEN
    UPDATE public.saldos_disponiveis
    SET valor_liberado_para_saque = valor_liberado_para_saque + NEW.valor_solicitado,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Criar trigger para restaurar saldo quando saque é rejeitado
CREATE TRIGGER trigger_restore_balance_on_rejection
  AFTER UPDATE ON public.saques
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_balance_on_rejection();