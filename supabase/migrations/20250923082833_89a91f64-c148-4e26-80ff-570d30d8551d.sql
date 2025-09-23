-- Verificar e corrigir o sistema de comissionamento
-- Atualizar função de cálculo de comissão para garantir precisão

CREATE OR REPLACE FUNCTION public.update_commission_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_sales NUMERIC;
    commission_amount NUMERIC;
    current_withdrawn NUMERIC := 0;
    pending_withdrawals NUMERIC := 0;
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
    
    -- Pegar valor já sacado e pendente
    SELECT COALESCE(valor_sacado, 0) INTO current_withdrawn
    FROM saldos_disponiveis 
    WHERE user_id = target_user_id;
    
    -- Calcular saques pendentes
    SELECT COALESCE(SUM(valor_solicitado), 0) INTO pending_withdrawals
    FROM saques 
    WHERE user_id = target_user_id AND status = 'pendente';
    
    -- Inserir ou atualizar saldo
    INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
    VALUES (target_user_id, commission_amount, commission_amount - current_withdrawn - pending_withdrawals, current_withdrawn)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        valor_total_comissoes = commission_amount,
        valor_liberado_para_saque = commission_amount - saldos_disponiveis.valor_sacado - pending_withdrawals,
        updated_at = now();
        
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- Atualizar função de processamento de saque para garantir consistência
CREATE OR REPLACE FUNCTION public.update_balance_on_withdrawal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Quando um saque é inserido com status pendente, reduzir o valor_liberado_para_saque
  IF NEW.status = 'pendente' THEN
    UPDATE public.saldos_disponiveis
    SET valor_liberado_para_saque = GREATEST(0, valor_liberado_para_saque - NEW.valor_solicitado),
        updated_at = now()
    WHERE user_id = NEW.user_id;
    
    -- Se não existe registro de saldo, criar um
    IF NOT FOUND THEN
      INSERT INTO public.saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
      VALUES (NEW.user_id, 0, GREATEST(0, -NEW.valor_solicitado), 0);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Função para recalcular todos os saldos e garantir consistência
CREATE OR REPLACE FUNCTION public.recalculate_all_balances()
RETURNS void
LANGUAGE plpgsql
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

-- Executar recálculo para corrigir inconsistências existentes
SELECT public.recalculate_all_balances();