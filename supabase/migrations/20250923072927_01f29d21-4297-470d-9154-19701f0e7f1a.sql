-- Corrigir políticas RLS para que executivos vejam todos os saques
DROP POLICY IF EXISTS "Executives can view all saques" ON saques;
CREATE POLICY "Executives can view all saques" 
ON saques 
FOR SELECT 
USING (is_executive(auth.uid()));

-- Garantir que função para deletar vendas também atualiza comissões
CREATE OR REPLACE FUNCTION update_commission_on_sale()
RETURNS TRIGGER AS $$
DECLARE
    total_sales NUMERIC;
    commission_amount NUMERIC;
    current_withdrawn NUMERIC := 0;
    target_user_id UUID;
BEGIN
    -- Determinar qual user_id usar baseado na operação
    IF TG_OP = 'DELETE' THEN
        target_user_id := OLD.user_id;
    ELSE
        target_user_id := NEW.user_id;
    END IF;
    
    -- Calcular total de vendas do usuário
    SELECT COALESCE(SUM(valor_venda), 0) INTO total_sales 
    FROM vendas 
    WHERE user_id = target_user_id;
    
    -- Calcular 10% de comissão
    commission_amount := total_sales * 0.10;
    
    -- Pegar valor já sacado
    SELECT COALESCE(valor_sacado, 0) INTO current_withdrawn
    FROM saldos_disponiveis 
    WHERE user_id = target_user_id;
    
    -- Inserir ou atualizar saldo
    INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
    VALUES (target_user_id, commission_amount, commission_amount - current_withdrawn, current_withdrawn)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        valor_total_comissoes = commission_amount,
        valor_liberado_para_saque = commission_amount - saldos_disponiveis.valor_sacado,
        updated_at = now();
        
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;