-- Allow authenticated users to select groups (needed to resolve invite code lookups)
-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create a permissive SELECT policy for authenticated users to read groups.
-- This enables finding a group by invite_code while keeping inserts/updates restricted.
CREATE POLICY "Authenticated users can view groups to join by invite"
ON public.groups
FOR SELECT
TO authenticated
USING (true);
