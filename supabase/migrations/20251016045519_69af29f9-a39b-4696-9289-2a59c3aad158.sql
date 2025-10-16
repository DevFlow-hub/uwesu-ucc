-- Fix: Profiles table publicly exposing member PII
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create authenticated-only access policy
-- Members can view other members' profiles only when logged in
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);