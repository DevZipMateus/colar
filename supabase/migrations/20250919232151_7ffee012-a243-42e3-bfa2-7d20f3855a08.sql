-- Create table for monthly income entries
CREATE TABLE public.income_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.income_entries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view income entries of their groups" 
ON public.income_entries 
FOR SELECT 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create income entries in their groups" 
ON public.income_entries 
FOR INSERT 
WITH CHECK ((auth.uid() = created_by) AND (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
)));

CREATE POLICY "Users can update income entries in their groups" 
ON public.income_entries 
FOR UPDATE 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can delete income entries in their groups" 
ON public.income_entries 
FOR DELETE 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_income_entries_updated_at
BEFORE UPDATE ON public.income_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();