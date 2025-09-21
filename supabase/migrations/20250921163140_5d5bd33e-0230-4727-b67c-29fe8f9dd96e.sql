-- Security Enhancement: Profile Enumeration Protection (Fixed)
-- Add privacy controls and display name functionality

-- Add privacy settings to profiles table
ALTER TABLE public.profiles 
ADD COLUMN display_name text,
ADD COLUMN is_profile_public boolean DEFAULT false,
ADD COLUMN show_email_in_groups boolean DEFAULT false;

-- Create a function to get safe user display info for group contexts
CREATE OR REPLACE FUNCTION public.get_user_display_info(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  show_email boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    COALESCE(p.display_name, SPLIT_PART(p.name, ' ', 1), 'User') as display_name,
    CASE 
      WHEN p.show_email_in_groups = true THEN true
      ELSE false
    END as show_email
  FROM public.profiles p
  WHERE p.id = target_user_id;
$$;

-- Update profiles table policies to be more restrictive
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- More restrictive profile viewing policy - only own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow viewing limited public profile info in shared groups only
CREATE POLICY "Users can view limited public profiles in shared groups"
ON public.profiles  
FOR SELECT
USING (
  is_profile_public = true 
  AND EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() 
    AND gm2.user_id = profiles.id
  )
);

-- Add trigger to set default display_name on profile creation/update
CREATE OR REPLACE FUNCTION public.set_default_display_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set display_name to first name if not provided
  IF NEW.display_name IS NULL AND NEW.name IS NOT NULL THEN
    NEW.display_name := SPLIT_PART(NEW.name, ' ', 1);
  END IF;
  
  -- Ensure display_name is not empty
  IF NEW.display_name IS NULL OR LENGTH(TRIM(NEW.display_name)) = 0 THEN
    NEW.display_name := 'User';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to existing and new profiles
CREATE TRIGGER set_profile_display_name
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_default_display_name();

-- Update existing profiles to have display names
UPDATE public.profiles 
SET display_name = COALESCE(
  display_name,
  SPLIT_PART(name, ' ', 1),
  'User'
)
WHERE display_name IS NULL;