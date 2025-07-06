-- Allow group creators/admins to remove members from their groups
CREATE POLICY "Group creators can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_id 
    AND g.created_by = auth.uid()
  )
);

-- Allow users to leave groups themselves
CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
USING (auth.uid() = user_id);