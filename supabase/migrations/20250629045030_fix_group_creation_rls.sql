
-- Fix RLS policies to allow group creation
-- The issue is that when creating a group, the user isn't a member yet
-- so the policy that checks membership fails

-- Drop and recreate the groups SELECT policy to allow creators to see their own groups
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    -- User can see groups they are members of OR groups they created
    public.is_user_group_member(auth.uid(), id) OR created_by = auth.uid()
  );

-- The existing INSERT policy should work, but let's make it explicit
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Also ensure the group_members policies are correct
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    public.is_user_group_member(auth.uid(), group_id)
  );

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);
