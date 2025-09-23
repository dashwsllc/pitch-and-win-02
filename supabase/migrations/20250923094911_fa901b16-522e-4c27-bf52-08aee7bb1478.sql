-- Recriar triggers essenciais para funcionamento do sistema

-- Trigger para automaticamente criar perfil quando usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_vendas_updated_at
  BEFORE UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_abordagens_updated_at
  BEFORE UPDATE ON abordagens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_saques_updated_at
  BEFORE UPDATE ON saques
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_saldos_updated_at
  BEFORE UPDATE ON saldos_disponiveis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para atualizar comissões quando vendas são modificadas
CREATE OR REPLACE TRIGGER trigger_update_commission_on_sale_insert
  AFTER INSERT ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();

CREATE OR REPLACE TRIGGER trigger_update_commission_on_sale_update
  AFTER UPDATE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();

CREATE OR REPLACE TRIGGER trigger_update_commission_on_sale_delete
  AFTER DELETE ON vendas
  FOR EACH ROW EXECUTE FUNCTION update_commission_on_sale();

-- Trigger para gerenciar saldos quando saques são inseridos
CREATE OR REPLACE TRIGGER trigger_balance_on_withdrawal_insert
  AFTER INSERT ON saques
  FOR EACH ROW EXECUTE FUNCTION update_balance_on_withdrawal();

-- Trigger para restaurar saldo quando saque é rejeitado
CREATE OR REPLACE TRIGGER trigger_restore_balance_on_rejection
  AFTER UPDATE ON saques
  FOR EACH ROW EXECUTE FUNCTION restore_balance_on_rejection();

-- Trigger para atribuir role padrão quando usuário é criado
CREATE OR REPLACE TRIGGER trigger_assign_default_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION assign_default_role();