-- Fix: Move login event logging to database trigger for security
-- Create trigger function to log login events server-side
CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log on last_sign_in_at update (indicates login)
  IF (TG_OP = 'UPDATE' AND 
      NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at) THEN
    INSERT INTO public.admin_notifications (user_id, user_email, user_name, event_type)
    VALUES (
      NEW.id,
      NEW.email,
      NEW.raw_user_meta_data->>'full_name',
      'login'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to automatically log logins
CREATE TRIGGER on_user_login
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_login();

-- Update RLS policy to prevent client-side manipulation
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow system inserts for notifications" ON public.admin_notifications;

-- Create stricter policy that only allows signup events from client
-- (login events now come from trigger, signup events from log_user_signup trigger)
CREATE POLICY "System only inserts for notifications"
ON public.admin_notifications
FOR INSERT
WITH CHECK (false);