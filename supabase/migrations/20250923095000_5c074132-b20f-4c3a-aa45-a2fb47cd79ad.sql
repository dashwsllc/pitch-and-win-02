-- Verificar se as funções existem e recriar triggers
SELECT proname FROM pg_proc WHERE proname IN ('handle_new_user', 'update_updated_at_column', 'update_commission_on_sale', 'update_balance_on_withdrawal', 'restore_balance_on_rejection', 'assign_default_role');

-- Tentar recriar os triggers essenciais para o sistema de comissões
DROP TRIGGER IF EXISTS trigger_update_commission_on_sale_insert ON vendas;
DROP TRIGGER IF EXISTS trigger_update_commission_on_sale_update ON vendas;
DROP TRIGGER IF EXISTS trigger_update_commission_on_sale_delete ON vendas;

CREATE TRIGGER trigger_update_commission_on_sale_insert
  AFTER INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();

CREATE TRIGGER trigger_update_commission_on_sale_update
  AFTER UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();

CREATE TRIGGER trigger_update_commission_on_sale_delete
  AFTER DELETE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();