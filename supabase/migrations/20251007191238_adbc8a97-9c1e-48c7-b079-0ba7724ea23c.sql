-- Create user activity tracking table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
ON public.user_activity
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_user_activity_user_id_created_at ON public.user_activity(user_id, created_at DESC);

-- Function to update active members count
CREATE OR REPLACE FUNCTION public.update_active_members_count()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Allow admins to update union_info
CREATE POLICY "Admins can update union info"
ON public.union_info
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert union info"
ON public.union_info
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));