
-- First, create a security definer function to check if a user is a member of a group
-- This function bypasses RLS policies to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_user_group_member(user_id uuid, group_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_members.user_id = $1 
    AND group_members.group_id = $2
  );
$$;

-- Drop existing RLS policies on group_members table
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view group members of their groups" ON public.group_members
  FOR SELECT USING (
    public.is_user_group_member(auth.uid(), group_id)
  );

-- Policy for inserting - users can join groups (this is used when creating groups and joining)
CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also update the groups table policies to use the security definer function
DROP POLICY IF EXISTS "Users can view groups they belong to" ON public.groups;

CREATE POLICY "Users can view groups they belong to" ON public.groups
  FOR SELECT USING (
    public.is_user_group_member(auth.uid(), id)
  );
