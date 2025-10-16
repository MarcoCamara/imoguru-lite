-- Create app_role enum (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table (if not exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Expand profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'fisica';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS creci TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_address TEXT;

-- Add archived column to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON public.properties;

-- Update properties RLS policies for admin access
CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete all properties"
  ON public.properties FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins can manage system settings" ON public.system_settings;

-- RLS policies for system_settings
CREATE POLICY "Users can view system settings"
  ON public.system_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage system settings"
  ON public.system_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
  ('app_name', '"ImoGuru"'),
  ('primary_color', '"#2563eb"'),
  ('secondary_color', '"#7c3aed"'),
  ('max_images_per_property', '20'),
  ('max_image_size_mb', '5'),
  ('video_upload_enabled', 'false'),
  ('video_links_enabled', 'true')
ON CONFLICT (setting_key) DO NOTHING;