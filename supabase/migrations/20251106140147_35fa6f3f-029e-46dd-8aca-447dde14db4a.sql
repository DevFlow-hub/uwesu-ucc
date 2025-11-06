-- Update the handle_new_user function to include WhatsApp number and country code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, whatsapp_number, country_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Member'),
    NEW.email,
    NEW.raw_user_meta_data->>'whatsapp_number',
    COALESCE(NEW.raw_user_meta_data->>'country_code', '+1')
  );
  RETURN NEW;
END;
$$;