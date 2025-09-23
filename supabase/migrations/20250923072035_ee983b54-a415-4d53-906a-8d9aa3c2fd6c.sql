-- Atualizar nomes de usuários que estão como "Usuário ID" para usar o email ou um nome mais descritivo
UPDATE profiles 
SET display_name = CASE 
  WHEN display_name IS NULL OR display_name LIKE 'Usuário %' THEN 
    COALESCE(
      (SELECT email FROM auth.users WHERE id = profiles.user_id),
      'Vendedor ' || substring(user_id::text, 1, 8)
    )
  ELSE display_name
END
WHERE display_name IS NULL OR display_name LIKE 'Usuário %';

-- Garantir que triggeres para atualizar saldos estão funcionando corretamente
CREATE OR REPLACE FUNCTION update_balance_on_withdrawal()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um saque é inserido com status pendente, reduzir o valor_liberado_para_saque
  IF NEW.status = 'pendente' THEN
    UPDATE public.saldos_disponiveis
    SET valor_liberado_para_saque = valor_liberado_para_saque - NEW.valor_solicitado,
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Se não existe registro de saldo, criar um
    IF NOT FOUND THEN
      INSERT INTO public.saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
      VALUES (NEW.user_id, 0, -NEW.valor_solicitado, 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar o trigger para saques
DROP TRIGGER IF EXISTS trigger_update_balance_on_withdrawal ON saques;
CREATE TRIGGER trigger_update_balance_on_withdrawal
  AFTER INSERT ON saques
  FOR EACH ROW
  EXECUTE FUNCTION update_balance_on_withdrawal();

-- Atualizar função de restaurar saldo em rejeições
CREATE OR REPLACE FUNCTION restore_balance_on_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para 'rejeitado', restaurar o valor
  IF OLD.status = 'pendente' AND NEW.status = 'rejeitado' THEN
    UPDATE public.saldos_disponiveis
    SET valor_liberado_para_saque = valor_liberado_para_saque + NEW.valor_solicitado,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recriar o trigger para rejeições
DROP TRIGGER IF EXISTS trigger_restore_balance_on_rejection ON saques;
CREATE TRIGGER trigger_restore_balance_on_rejection
  AFTER UPDATE ON saques
  FOR EACH ROW
  EXECUTE FUNCTION restore_balance_on_rejection();