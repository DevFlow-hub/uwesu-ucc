-- Fix RLS policy for profiles table to prevent public access to sensitive PII
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all profiles (already exists but let's ensure it's there)
-- The "Admins can manage all profiles" policy already covers this

-- Fix comments table - restrict to authenticated users only
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;

CREATE POLICY "Comments are viewable by authenticated users"
ON public.comments
FOR SELECT
TO authenticated
USING (true);