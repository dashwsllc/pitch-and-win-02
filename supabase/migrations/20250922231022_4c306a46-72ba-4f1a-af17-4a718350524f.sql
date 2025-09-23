-- Create function to process withdrawal and update balance
CREATE OR REPLACE FUNCTION process_withdrawal(p_user_id UUID, p_withdrawal_amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the saldos_disponiveis table by adding the withdrawal amount to valor_sacado
  UPDATE saldos_disponiveis
  SET valor_sacado = valor_sacado + p_withdrawal_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- If no row was updated, it means the user doesn't have a balance record
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User balance record not found';
  END IF;
END;
$$;