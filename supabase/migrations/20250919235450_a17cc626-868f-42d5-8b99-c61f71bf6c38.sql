-- Create installment tracking table
CREATE TABLE public.installment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_month INTEGER NOT NULL,
  due_year INTEGER NOT NULL,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense splits table
CREATE TABLE public.expense_splits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  transaction_id UUID NOT NULL,
  split_name TEXT NOT NULL,
  total_amount NUMERIC NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create split payments table
CREATE TABLE public.split_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  split_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount_owed NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.installment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.split_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for installment_tracking
CREATE POLICY "Users can view installments of their groups" ON public.installment_tracking
FOR SELECT USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create installments in their groups" ON public.installment_tracking
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update installments in their groups" ON public.installment_tracking
FOR UPDATE USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));

-- RLS policies for expense_splits
CREATE POLICY "Users can view splits of their groups" ON public.expense_splits
FOR SELECT USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create splits in their groups" ON public.expense_splits
FOR INSERT WITH CHECK (
  auth.uid() = created_by AND 
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update splits in their groups" ON public.expense_splits
FOR UPDATE USING (group_id IN (
  SELECT group_id FROM group_members WHERE user_id = auth.uid()
));

-- RLS policies for split_payments
CREATE POLICY "Users can view split payments of their groups" ON public.split_payments
FOR SELECT USING (split_id IN (
  SELECT id FROM expense_splits WHERE group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can create split payments" ON public.split_payments
FOR INSERT WITH CHECK (split_id IN (
  SELECT id FROM expense_splits WHERE group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can update their own split payments" ON public.split_payments
FOR UPDATE USING (
  user_id = auth.uid() OR 
  split_id IN (
    SELECT id FROM expense_splits WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_installment_tracking_updated_at
BEFORE UPDATE ON public.installment_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_splits_updated_at
BEFORE UPDATE ON public.expense_splits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_split_payments_updated_at
BEFORE UPDATE ON public.split_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_installment_tracking_group_id ON public.installment_tracking(group_id);
CREATE INDEX idx_installment_tracking_due_date ON public.installment_tracking(due_year, due_month);
CREATE INDEX idx_expense_splits_group_id ON public.expense_splits(group_id);
CREATE INDEX idx_split_payments_split_id ON public.split_payments(split_id);
CREATE INDEX idx_split_payments_user_id ON public.split_payments(user_id);