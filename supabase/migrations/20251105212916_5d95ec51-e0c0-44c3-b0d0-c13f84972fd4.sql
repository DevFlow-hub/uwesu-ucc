-- Fix RLS policy to allow authenticated users to view executive profiles
DROP POLICY IF EXISTS "Public can view executive profiles (limited data)" ON public.profiles;

CREATE POLICY "Authenticated users can view executive profiles"
ON public.profiles
FOR SELECT
USING (is_executive = true AND auth.uid() IS NOT NULL);

CREATE POLICY "Anonymous users can view executive profiles"
ON public.profiles
FOR SELECT
USING (is_executive = true AND auth.uid() IS NULL);