-- Fix critical security issues

-- 1. Fix comments table - ensure ONLY authenticated users can view
DROP POLICY IF EXISTS "Comments are viewable by authenticated users" ON public.comments;

CREATE POLICY "Only authenticated users can view comments"
ON public.comments
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 2. Add explicit denial for anonymous access to profiles
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 3. Ensure push_subscriptions blocks anonymous access
CREATE POLICY "Block anonymous access to push subscriptions"
ON public.push_subscriptions
FOR ALL
TO anon
USING (false);

-- 4. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_user_signup()
RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.log_user_login()
RETURNS trigger
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