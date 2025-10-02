-- Add new columns to card_bill_payments for better bill tracking
ALTER TABLE public.card_bill_payments 
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_card_bill_payments_status 
  ON public.card_bill_payments(group_id, is_paid, year, month);

CREATE INDEX IF NOT EXISTS idx_card_bill_payments_due_date 
  ON public.card_bill_payments(due_date) WHERE is_paid = false;

-- Function to generate bill records for upcoming months based on card configurations
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
BEGIN
  -- Loop through each card configuration in the group
  FOR v_card IN 
    SELECT card_name, card_type, due_day, group_id, created_by
    FROM card_configurations
    WHERE group_id = p_group_id AND due_day IS NOT NULL
  LOOP
    -- Generate bills for the next N months
    FOR i IN 0..p_months_ahead LOOP
      v_month := EXTRACT(MONTH FROM (v_current_date + (i || ' months')::INTERVAL))::INTEGER;
      v_year := EXTRACT(YEAR FROM (v_current_date + (i || ' months')::INTERVAL))::INTEGER;
      
      -- Calculate due date
      v_due_date := MAKE_DATE(v_year, v_month, LEAST(v_card.due_day, 28));
      
      -- Check if bill already exists
      IF NOT EXISTS (
        SELECT 1 FROM card_bill_payments
        WHERE group_id = v_card.group_id
          AND card_name = v_card.card_name
          AND month = v_month
          AND year = v_year
      ) THEN
        -- Calculate actual amount from transactions, or set to 0 if none
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
        SELECT
          v_card.group_id,
          v_card.card_name,
          v_month,
          v_year,
          COALESCE(SUM(
            CASE 
              WHEN ft.installments IS NULL OR ft.installments <= 1 
              THEN ft.amount
              ELSE ft.amount / ft.installments
            END
          ), 0),
          false,
          v_card.created_by,
          v_due_date
        FROM financial_transactions ft
        WHERE ft.group_id = v_card.group_id
          AND ft.card_name = v_card.card_name
          AND EXTRACT(MONTH FROM ft.date) = v_month
          AND EXTRACT(YEAR FROM ft.date) = v_year
        HAVING COALESCE(SUM(
          CASE 
            WHEN ft.installments IS NULL OR ft.installments <= 1 
            THEN ft.amount
            ELSE ft.amount / ft.installments
          END
        ), 0) > 0;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Function to get bill status (pending, overdue, paid)
CREATE OR REPLACE FUNCTION public.get_bill_status(
  p_is_paid BOOLEAN,
  p_due_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_is_paid THEN
    RETURN 'paid';
  ELSIF p_due_date < CURRENT_DATE THEN
    RETURN 'overdue';
  ELSE
    RETURN 'pending';
  END IF;
END;
$$;