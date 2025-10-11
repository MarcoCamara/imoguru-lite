-- Fix security issue: Add search_path to functions that don't have it
-- This prevents potential privilege escalation attacks

-- Update create_property_statistics function
CREATE OR REPLACE FUNCTION public.create_property_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.property_statistics (property_id)
  VALUES (NEW.id)
  ON CONFLICT (property_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;