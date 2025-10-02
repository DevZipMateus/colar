-- Create recurring_income table
CREATE TABLE public.recurring_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  day_of_month INTEGER NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 31),
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recurring_income ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create recurring income in their groups"
ON public.recurring_income
FOR INSERT
WITH CHECK (
  auth.uid() = created_by 
  AND group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can view recurring income of their groups"
ON public.recurring_income
FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update recurring income in their groups"
ON public.recurring_income
FOR UPDATE
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete recurring income in their groups"
ON public.recurring_income
FOR DELETE
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_recurring_income_updated_at
BEFORE UPDATE ON public.recurring_income
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate recurring income entries
CREATE OR REPLACE FUNCTION public.generate_recurring_income()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  last_day_of_month INTEGER;
BEGIN
  -- Get the last day of current month
  last_day_of_month := EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::INTEGER;
  
  -- Insert income entries for active recurring incomes
  INSERT INTO public.income_entries (group_id, description, amount, date, created_by)
  SELECT 
    ri.group_id,
    ri.description,
    ri.amount,
    MAKE_DATE(
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 
      EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, 
      LEAST(ri.day_of_month, last_day_of_month)
    ),
    ri.created_by
  FROM public.recurring_income ri
  WHERE ri.is_active = true
    AND (ri.end_date IS NULL OR ri.end_date >= CURRENT_DATE)
    AND ri.start_date <= CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.income_entries ie
      WHERE ie.group_id = ri.group_id
        AND ie.description = ri.description
        AND EXTRACT(YEAR FROM ie.date) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND EXTRACT(MONTH FROM ie.date) = EXTRACT(MONTH FROM CURRENT_DATE)
    );
END;
$$;