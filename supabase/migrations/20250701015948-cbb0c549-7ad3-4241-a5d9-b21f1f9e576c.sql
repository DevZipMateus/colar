
-- Add foreign key constraint to link group_members.user_id to profiles.id
-- This will allow Supabase to understand the relationship for joins
ALTER TABLE public.group_members 
ADD CONSTRAINT group_members_user_id_profiles_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
