-- Create a notifications table for admin
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  event_type text NOT NULL CHECK (event_type IN ('signup', 'login')),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.admin_notifications
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Policy: Allow inserts for logging
CREATE POLICY "Allow system inserts for notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications(created_at DESC);

-- Create a function to log new user signups
CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.admin_notifications (user_id, user_email, user_name, event_type)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'signup'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to log signups
DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_signup();