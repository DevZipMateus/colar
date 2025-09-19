-- Create financial_transactions table
CREATE TABLE public.financial_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit')),
  installments INTEGER,
  installment_number INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view transactions of their groups" 
ON public.financial_transactions 
FOR SELECT 
USING (group_id IN ( 
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create transactions in their groups" 
ON public.financial_transactions 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (group_id IN ( 
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
)));

CREATE POLICY "Users can update transactions in their groups" 
ON public.financial_transactions 
FOR UPDATE 
USING (group_id IN ( 
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can delete transactions in their groups" 
ON public.financial_transactions 
FOR DELETE 
USING (group_id IN ( 
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_financial_transactions_updated_at
BEFORE UPDATE ON public.financial_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();