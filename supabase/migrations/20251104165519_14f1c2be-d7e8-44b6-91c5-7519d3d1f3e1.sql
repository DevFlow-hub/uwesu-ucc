-- Add blocked column to profiles table
ALTER TABLE public.profiles ADD COLUMN blocked boolean DEFAULT false NOT NULL;

-- Create index for better performance on blocked status checks
CREATE INDEX idx_profiles_blocked ON public.profiles(blocked) WHERE blocked = true;

-- Add RLS policy to block access for blocked users
CREATE POLICY "Blocked users cannot access their profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND blocked = false
);

-- Function to check if user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(blocked, false)
  FROM public.profiles
  WHERE user_id = _user_id
$$;