-- Create split_transactions table for many-to-many relationship between splits and transactions
CREATE TABLE public.split_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  split_id uuid NOT NULL,
  transaction_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(split_id, transaction_id)
);

-- Enable RLS on split_transactions
ALTER TABLE public.split_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for split_transactions
CREATE POLICY "Users can create split transactions in their groups"
ON public.split_transactions
FOR INSERT
WITH CHECK (
  split_id IN (
    SELECT es.id FROM expense_splits es
    WHERE es.group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view split transactions of their groups"
ON public.split_transactions
FOR SELECT
USING (
  split_id IN (
    SELECT es.id FROM expense_splits es
    WHERE es.group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can delete split transactions in their groups"
ON public.split_transactions
FOR DELETE
USING (
  split_id IN (
    SELECT es.id FROM expense_splits es
    WHERE es.group_id IN (
      SELECT gm.group_id FROM group_members gm
      WHERE gm.user_id = auth.uid()
    )
  )
);

-- Add new columns to expense_splits table
ALTER TABLE public.expense_splits 
DROP COLUMN IF EXISTS transaction_id,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'finalized', 'cancelled')),
ADD COLUMN IF NOT EXISTS description text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_split_transactions_split_id ON public.split_transactions(split_id);
CREATE INDEX IF NOT EXISTS idx_split_transactions_transaction_id ON public.split_transactions(transaction_id);