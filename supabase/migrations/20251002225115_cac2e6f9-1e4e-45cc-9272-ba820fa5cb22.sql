-- Fix search_path for get_bill_status function
CREATE OR REPLACE FUNCTION public.get_bill_status(
  p_is_paid BOOLEAN,
  p_due_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
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