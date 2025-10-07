-- Make user_id nullable for executive profiles that don't need auth accounts
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;

-- Drop the unique constraint first
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key;

-- Recreate as partial unique index to allow multiple NULL user_ids
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles (user_id) WHERE user_id IS NOT NULL;