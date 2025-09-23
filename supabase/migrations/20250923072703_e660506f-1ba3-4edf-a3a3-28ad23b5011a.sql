-- Atualizar sistema de comissionamento correto (10% das vendas)
-- Primeiro, vamos calcular e atualizar as comissões corretamente

-- Função para calcular e atualizar comissões
CREATE OR REPLACE FUNCTION calculate_and_update_commissions() 
RETURNS void AS $$
DECLARE
    user_record RECORD;
    total_sales NUMERIC;
    commission_amount NUMERIC;
BEGIN
    -- Para cada usuário que tem vendas
    FOR user_record IN 
        SELECT user_id, SUM(valor_venda) as total_sales_value 
        FROM vendas 
        GROUP BY user_id
    LOOP
        total_sales := user_record.total_sales_value;
        commission_amount := total_sales * 0.10; -- 10% de comissão
        
        -- Inserir ou atualizar o saldo
        INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
        VALUES (user_record.user_id, commission_amount, commission_amount, 0)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            valor_total_comissoes = commission_amount,
            valor_liberado_para_saque = commission_amount - saldos_disponiveis.valor_sacado,
            updated_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Executar a função para calcular comissões
SELECT calculate_and_update_commissions();

-- Criar trigger para atualizar comissões automaticamente quando há nova venda
CREATE OR REPLACE FUNCTION update_commission_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    total_sales NUMERIC;
    commission_amount NUMERIC;
    current_withdrawn NUMERIC := 0;
BEGIN
    -- Calcular total de vendas do usuário
    SELECT COALESCE(SUM(valor_venda), 0) INTO total_sales 
    FROM vendas 
    WHERE user_id = NEW.user_id;
    
    -- Calcular 10% de comissão
    commission_amount := total_sales * 0.10;
    
    -- Pegar valor já sacado
    SELECT COALESCE(valor_sacado, 0) INTO current_withdrawn
    FROM saldos_disponiveis 
    WHERE user_id = NEW.user_id;
    
    -- Inserir ou atualizar saldo
    INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
    VALUES (NEW.user_id, commission_amount, commission_amount - current_withdrawn, current_withdrawn)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        valor_total_comissoes = commission_amount,
        valor_liberado_para_saque = commission_amount - EXCLUDED.valor_sacado,
        updated_at = now();
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para vendas
DROP TRIGGER IF EXISTS trigger_update_commission_on_sale ON vendas;
CREATE TRIGGER trigger_update_commission_on_sale
    AFTER INSERT OR UPDATE OR DELETE ON vendas
    FOR EACH ROW
    EXECUTE FUNCTION update_commission_on_sale();