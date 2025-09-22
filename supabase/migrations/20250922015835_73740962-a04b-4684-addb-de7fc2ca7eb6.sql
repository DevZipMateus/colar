-- Add DELETE policy for expense_splits table
-- Users can delete splits they created
CREATE POLICY "Users can delete splits they created" 
ON public.expense_splits 
FOR DELETE 
USING (created_by = auth.uid());