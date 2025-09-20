-- Create activity_feed table to track all group activities
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('transaction_added', 'transaction_updated', 'transaction_deleted', 'task_created', 'task_completed', 'task_deleted', 'inventory_updated', 'member_joined')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Create policies for activity_feed
CREATE POLICY "Users can view activities of their groups" 
ON public.activity_feed 
FOR SELECT 
USING (group_id IN (
  SELECT group_members.group_id
  FROM group_members
  WHERE group_members.user_id = auth.uid()
));

CREATE POLICY "Users can create activities in their groups" 
ON public.activity_feed 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND 
  group_id IN (
    SELECT group_members.group_id
    FROM group_members
    WHERE group_members.user_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX idx_activity_feed_group_id ON public.activity_feed(group_id);
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed(created_at DESC);