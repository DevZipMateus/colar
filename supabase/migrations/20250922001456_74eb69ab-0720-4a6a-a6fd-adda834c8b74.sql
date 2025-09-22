-- Add columns for expense splitting functionality
ALTER TABLE public.financial_transactions 
ADD COLUMN marked_for_split boolean DEFAULT false,
ADD COLUMN split_name text;

-- Add index for better performance when filtering marked transactions
CREATE INDEX idx_financial_transactions_marked_for_split ON public.financial_transactions(marked_for_split) WHERE marked_for_split = true;