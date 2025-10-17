-- Fix function search path for security (drop with CASCADE)
DROP FUNCTION IF EXISTS update_user_passwords_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_user_passwords_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER update_user_passwords_updated_at
  BEFORE UPDATE ON public.user_passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_user_passwords_updated_at();