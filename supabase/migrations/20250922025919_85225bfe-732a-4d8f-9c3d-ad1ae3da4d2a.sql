-- Create table for tracking credit card bill payments
CREATE TABLE public.card_bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  card_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  amount NUMERIC NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, card_name, month, year)
);

-- Enable Row Level Security
ALTER TABLE public.card_bill_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for card bill payments
CREATE POLICY "Users can create bill payments in their groups" 
ON public.card_bill_payments 
FOR INSERT 
WITH CHECK (
  (auth.uid() = paid_by) AND 
  (group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can view bill payments of their groups" 
ON public.card_bill_payments 
FOR SELECT 
USING (
  group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update bill payments in their groups" 
ON public.card_bill_payments 
FOR UPDATE 
USING (
  group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_card_bill_payments_updated_at
BEFORE UPDATE ON public.card_bill_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();