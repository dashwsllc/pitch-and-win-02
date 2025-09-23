-- Corrigir avisos de segurança das funções
CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
    total_sales NUMERIC;
    commission_amount NUMERIC;
    withdrawn_amount NUMERIC;
    pending_amount NUMERIC;
    available_amount NUMERIC;
BEGIN
    -- Para cada usuário que tem vendas ou saldos
    FOR user_record IN 
        SELECT DISTINCT user_id FROM (
            SELECT user_id FROM vendas
            UNION
            SELECT user_id FROM saldos_disponiveis
        ) users
    LOOP
        -- Calcular total de vendas
        SELECT COALESCE(SUM(valor_venda), 0) INTO total_sales 
        FROM vendas 
        WHERE user_id = user_record.user_id;
        
        -- Calcular 10% de comissão
        commission_amount := total_sales * 0.10;
        
        -- Calcular valor já sacado (aprovado)
        SELECT COALESCE(SUM(valor_solicitado), 0) INTO withdrawn_amount
        FROM saques 
        WHERE user_id = user_record.user_id AND status = 'aprovado';
        
        -- Calcular valor pendente
        SELECT COALESCE(SUM(valor_solicitado), 0) INTO pending_amount
        FROM saques 
        WHERE user_id = user_record.user_id AND status = 'pendente';
        
        -- Calcular valor disponível para saque
        available_amount := GREATEST(0, commission_amount - withdrawn_amount - pending_amount);
        
        -- Inserir ou atualizar saldo
        INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
        VALUES (user_record.user_id, commission_amount, available_amount, withdrawn_amount)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            valor_total_comissoes = commission_amount,
            valor_liberado_para_saque = available_amount,
            valor_sacado = withdrawn_amount,
            updated_at = now();
    END LOOP;
    
    RAISE NOTICE 'Recálculo de saldos concluído com sucesso';
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_and_update_commissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;