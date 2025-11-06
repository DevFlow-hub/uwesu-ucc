-- Add display_order column to profiles table for executive ordering
ALTER TABLE public.profiles 
ADD COLUMN display_order INTEGER;

-- Create an index for better performance when ordering executives
CREATE INDEX idx_profiles_display_order ON public.profiles(display_order) 
WHERE is_executive = true;