-- Update process_withdrawal function to use valor_total_comissoes instead of valor_liberado_para_saque
CREATE OR REPLACE FUNCTION public.process_withdrawal(p_user_id uuid, p_withdrawal_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the saldos_disponiveis table by adding the withdrawal amount to valor_sacado
  UPDATE saldos_disponiveis
  SET valor_sacado = valor_sacado + p_withdrawal_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no row was updated, it means the user doesn't have a balance record
  IF NOT FOUND THEN
    -- Create a new balance record for the user
    INSERT INTO saldos_disponiveis (user_id, valor_total_comissoes, valor_liberado_para_saque, valor_sacado)
    VALUES (p_user_id, 0, 0, p_withdrawal_amount);
  END IF;
END;
$function$;