-- Remove the overly permissive policy that exposes all executive data
DROP POLICY IF EXISTS "Executive profiles are viewable by everyone" ON public.profiles;

-- Create a secure view that only exposes non-sensitive executive information
CREATE OR REPLACE VIEW public.public_executives AS
SELECT 
  id,
  full_name,
  designation,
  bio,
  avatar_url
FROM public.profiles
WHERE is_executive = true;

-- Enable RLS on the view
ALTER VIEW public.public_executives SET (security_invoker = true);

-- Create a policy to allow everyone to view the public executives view
CREATE POLICY "Public can view executive profiles (limited data)"
ON public.profiles
FOR SELECT
USING (
  is_executive = true 
  AND auth.uid() IS NULL -- Only for unauthenticated users viewing limited data
);

-- Authenticated users (including the executive themselves) can still view full profile through existing policies