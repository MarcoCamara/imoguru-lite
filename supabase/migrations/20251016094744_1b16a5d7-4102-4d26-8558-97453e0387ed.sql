-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Add company_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);

-- Add company_id to properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties(company_id);

-- RLS Policies for companies
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
USING (
  id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all companies"
ON public.companies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert companies"
ON public.companies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update companies"
ON public.companies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update properties RLS to allow company-wide access
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;

CREATE POLICY "Users can view their company properties"
ON public.properties
FOR SELECT
USING (
  auth.uid() = user_id OR
  (company_id IS NOT NULL AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update properties insert policy to set company_id
DROP POLICY IF EXISTS "Users can create their own properties" ON public.properties;

CREATE POLICY "Users can create properties for their company"
ON public.properties
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND (
    company_id IS NULL OR
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Update properties update policy
DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;

CREATE POLICY "Users can update their company properties"
ON public.properties
FOR UPDATE
USING (
  auth.uid() = user_id OR
  (company_id IS NOT NULL AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update properties delete policy
DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;

CREATE POLICY "Users can delete their company properties"
ON public.properties
FOR DELETE
USING (
  auth.uid() = user_id OR
  (company_id IS NOT NULL AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update profiles RLS to allow company members to view each other
CREATE POLICY "Users can view company members"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id OR
  (company_id IS NOT NULL AND company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger to automatically set company_id on properties
CREATE OR REPLACE FUNCTION public.set_property_company_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set company_id from user's profile if not explicitly set
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_property_company_id_trigger
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_property_company_id();

-- Create storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for company logos
CREATE POLICY "Company logos are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

CREATE POLICY "Admins can upload company logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'company-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update company logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'company-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete company logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'company-logos' AND
  has_role(auth.uid(), 'admin'::app_role)
);