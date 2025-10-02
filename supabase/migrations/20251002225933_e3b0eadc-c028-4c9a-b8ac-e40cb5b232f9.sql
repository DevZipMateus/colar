-- Improved function to generate bills even without transactions
CREATE OR REPLACE FUNCTION public.generate_upcoming_card_bills(
  p_group_id UUID,
  p_months_ahead INTEGER DEFAULT 3
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_card RECORD;
  v_month INTEGER;
  v_year INTEGER;
  v_due_date DATE;
  v_current_date DATE := CURRENT_DATE;
  v_amount NUMERIC;
BEGIN
  -- Loop through each card configuration in the group
  FOR v_card IN 
    SELECT card_name, card_type, due_day, closing_day, group_id, created_by
    FROM card_configurations
    WHERE group_id = p_group_id AND due_day IS NOT NULL
  LOOP
    -- Generate bills for current month and next N months
    FOR i IN 0..p_months_ahead LOOP
      v_month := EXTRACT(MONTH FROM (v_current_date + (i || ' months')::INTERVAL))::INTEGER;
      v_year := EXTRACT(YEAR FROM (v_current_date + (i || ' months')::INTERVAL))::INTEGER;
      
      -- Calculate due date (handle months with fewer days)
      v_due_date := MAKE_DATE(
        v_year, 
        v_month, 
        LEAST(v_card.due_day, EXTRACT(DAY FROM (DATE_TRUNC('month', MAKE_DATE(v_year, v_month, 1)) + INTERVAL '1 month - 1 day'))::INTEGER)
      );
      
      -- Check if bill already exists
      IF NOT EXISTS (
        SELECT 1 FROM card_bill_payments
        WHERE group_id = v_card.group_id
          AND card_name = v_card.card_name
          AND month = v_month
          AND year = v_year
      ) THEN
        -- Calculate actual amount from transactions
        SELECT COALESCE(SUM(
          CASE 
            WHEN ft.installments IS NULL OR ft.installments <= 1 
            THEN ft.amount
            ELSE ft.amount / ft.installments
          END
        ), 0)
        INTO v_amount
        FROM financial_transactions ft
        WHERE ft.group_id = v_card.group_id
          AND ft.card_name = v_card.card_name
          AND ft.card_type = v_card.card_type
          AND (
            (EXTRACT(MONTH FROM ft.date) = v_month AND EXTRACT(YEAR FROM ft.date) = v_year)
            OR EXISTS (
              SELECT 1 FROM installment_tracking it
              WHERE it.transaction_id = ft.id
                AND it.due_month = v_month
                AND it.due_year = v_year
            )
          );
        
        -- Add installments amount
        SELECT v_amount + COALESCE(SUM(it.amount), 0)
        INTO v_amount
        FROM installment_tracking it
        WHERE it.group_id = v_card.group_id
          AND it.due_month = v_month
          AND it.due_year = v_year
          AND EXISTS (
            SELECT 1 FROM financial_transactions ft2
            WHERE ft2.id = it.transaction_id
              AND ft2.card_name = v_card.card_name
              AND ft2.card_type = v_card.card_type
          );
        
        -- Insert bill record (even if amount is 0)
        INSERT INTO card_bill_payments (
          group_id,
          card_name,
          month,
          year,
          amount,
          is_paid,
          paid_by,
          due_date
        )
        VALUES (
          v_card.group_id,
          v_card.card_name,
          v_month,
          v_year,
          GREATEST(v_amount, 0), -- Ensure non-negative
          false,
          v_card.created_by,
          v_due_date
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$$;