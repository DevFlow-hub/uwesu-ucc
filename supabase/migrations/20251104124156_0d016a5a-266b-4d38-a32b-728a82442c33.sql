-- Add WhatsApp number and country code to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS country_code text DEFAULT '+1';

-- Update RLS policies to allow WhatsApp-based authentication
-- (keeping existing policies intact)