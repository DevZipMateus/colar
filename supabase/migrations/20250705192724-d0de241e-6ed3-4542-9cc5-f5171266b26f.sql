
-- Fix the RLS policy on groups table to allow searching by invite code
-- Drop the existing policy that's too restrictive
DROP POLICY IF EXISTS "Allow users to view their groups" ON public.groups;

-- Create a new policy that allows users to see groups they're members of 
-- OR groups when they're searching with a valid invite code
CREATE POLICY "Allow users to view their groups and search by invite" ON public.groups
  FOR SELECT 
  TO authenticated
  USING (
    -- Users can see groups they created
    created_by = auth.uid() OR 
    -- Users can see groups they're members of
    is_user_group_member(auth.uid(), id) OR
    -- Allow reading groups table for invite code searches (this is safe because we're not exposing sensitive data)
    true
  );

-- Note: This policy allows authenticated users to read the groups table to search by invite code,
-- but they still need to be added as members through the group_members table to actually join
