-- Fix critical security vulnerability in groups table
-- Remove the "OR true" condition that exposes all groups to everyone

DROP POLICY IF EXISTS "Allow users to view their groups and search by invite" ON public.groups;

-- Create a secure policy that only allows:
-- 1. Group creators to see their own groups
-- 2. Group members to see groups they belong to
CREATE POLICY "Allow users to view their groups and search by invite"
ON public.groups
FOR SELECT
USING (
  (created_by = auth.uid()) OR 
  is_user_group_member(auth.uid(), id)
);