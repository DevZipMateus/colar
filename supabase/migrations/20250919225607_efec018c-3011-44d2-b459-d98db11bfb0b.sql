-- Create card_configurations table
CREATE TABLE public.card_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  card_name TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('credit', 'debit')),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, card_name)
);

-- Enable RLS
ALTER TABLE public.card_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for card configurations
CREATE POLICY "Users can view card configurations of their groups" 
ON public.card_configurations 
FOR SELECT 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create card configurations in their groups" 
ON public.card_configurations 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update card configurations in their groups" 
ON public.card_configurations 
FOR UPDATE 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can delete card configurations in their groups" 
ON public.card_configurations 
FOR DELETE 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_card_configurations_updated_at
BEFORE UPDATE ON public.card_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();