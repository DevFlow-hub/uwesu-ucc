-- Fix security warning by updating function with proper search_path
CREATE OR REPLACE FUNCTION public.update_active_members_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
BEGIN
  -- Count distinct users who have been active in the last 30 days
  SELECT COUNT(DISTINCT user_id)
  INTO active_count
  FROM public.user_activity
  WHERE created_at >= NOW() - INTERVAL '30 days'
    AND user_id IS NOT NULL;
  
  -- Update or insert the active_members value in union_info
  INSERT INTO public.union_info (key, value)
  VALUES ('active_members', active_count::text)
  ON CONFLICT (key)
  DO UPDATE SET 
    value = active_count::text,
    updated_at = NOW();
END;
$$;