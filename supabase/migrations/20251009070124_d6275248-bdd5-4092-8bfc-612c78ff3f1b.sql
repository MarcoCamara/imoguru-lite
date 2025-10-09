-- FASE 1: Expansão do banco de dados ImoGuru

-- 1. Adicionar novos campos na tabela properties
ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS registration_number TEXT, -- Matrícula do imóvel
  ADD COLUMN IF NOT EXISTS covered_parking INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uncovered_parking INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_costs JSONB DEFAULT '[]'::jsonb, -- Array de {description, value}
  ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS property_features TEXT[] DEFAULT ARRAY[]::TEXT[], -- Características do imóvel
  ADD COLUMN IF NOT EXISTS nearby_amenities TEXT[] DEFAULT ARRAY[]::TEXT[]; -- Proximidades em checkbox

-- 2. Criar tabela para sequência de código IMO
CREATE TABLE IF NOT EXISTS public.property_code_sequence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_sequence INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inserir registro inicial
INSERT INTO public.property_code_sequence (last_sequence) 
VALUES (0) 
ON CONFLICT DO NOTHING;

-- Função para gerar próximo código IMO
CREATE OR REPLACE FUNCTION public.generate_property_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_seq INTEGER;
  new_code TEXT;
BEGIN
  -- Atualizar e pegar próximo número
  UPDATE property_code_sequence 
  SET last_sequence = last_sequence + 1, updated_at = now()
  WHERE id = (SELECT id FROM property_code_sequence LIMIT 1)
  RETURNING last_sequence INTO next_seq;
  
  -- Formatar como IMO-XXXXXX (6 dígitos)
  new_code := 'IMO-' || LPAD(next_seq::TEXT, 6, '0');
  
  RETURN new_code;
END;
$$;

-- 3. Criar tabela para estatísticas de compartilhamento e visualizações
CREATE TABLE IF NOT EXISTS public.property_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  shares_whatsapp INTEGER DEFAULT 0,
  shares_email INTEGER DEFAULT 0,
  shares_facebook INTEGER DEFAULT 0,
  shares_instagram INTEGER DEFAULT 0,
  views_whatsapp INTEGER DEFAULT 0,
  views_email INTEGER DEFAULT 0,
  views_facebook INTEGER DEFAULT 0,
  views_instagram INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.property_statistics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view statistics of their properties"
ON public.property_statistics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_statistics.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all property statistics"
ON public.property_statistics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update statistics of their properties"
ON public.property_statistics FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_statistics.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all property statistics"
ON public.property_statistics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para criar estatísticas automaticamente
CREATE OR REPLACE FUNCTION public.create_property_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.property_statistics (property_id)
  VALUES (NEW.id)
  ON CONFLICT (property_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_property_statistics_trigger
AFTER INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.create_property_statistics();

-- 4. Expandir tabela de proprietários (spouse e partners)
CREATE TYPE public.owner_type AS ENUM ('fisica', 'juridica');
CREATE TYPE public.marital_status AS ENUM ('solteiro', 'casado', 'uniao_estavel', 'divorciado', 'viuvo');

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS owner_type owner_type DEFAULT 'fisica',
  ADD COLUMN IF NOT EXISTS owner_rg TEXT,
  ADD COLUMN IF NOT EXISTS owner_marital_status marital_status,
  ADD COLUMN IF NOT EXISTS owner_whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS owner_cep TEXT,
  ADD COLUMN IF NOT EXISTS owner_street TEXT,
  ADD COLUMN IF NOT EXISTS owner_number TEXT,
  ADD COLUMN IF NOT EXISTS owner_complement TEXT,
  ADD COLUMN IF NOT EXISTS owner_neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS owner_city TEXT,
  ADD COLUMN IF NOT EXISTS owner_state TEXT;

-- Tabela de cônjuges
CREATE TABLE IF NOT EXISTS public.property_spouse (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rg TEXT,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.property_spouse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage spouse of their properties"
ON public.property_spouse FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_spouse.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all spouses"
ON public.property_spouse FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela de sócios/outros proprietários
CREATE TABLE IF NOT EXISTS public.property_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rg TEXT,
  cpf_cnpj TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.property_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage partners of their properties"
ON public.property_partners FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_partners.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all partners"
ON public.property_partners FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Criar tabela de templates de autorização
CREATE TABLE IF NOT EXISTS public.authorization_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL, -- Template com placeholders
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.authorization_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage authorization templates"
ON public.authorization_templates FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view authorization templates"
ON public.authorization_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. Criar tabela de autorizações assinadas
CREATE TABLE IF NOT EXISTS public.property_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.authorization_templates(id),
  filled_content TEXT NOT NULL,
  signature_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_method TEXT, -- 'whatsapp', 'email', etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(property_id)
);

ALTER TABLE public.property_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage authorizations of their properties"
ON public.property_authorizations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE properties.id = property_authorizations.property_id 
    AND properties.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all authorizations"
ON public.property_authorizations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Criar tabela de configurações do sistema (ImoGuru)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings"
ON public.system_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view system settings"
ON public.system_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Inserir configurações padrão
INSERT INTO public.system_settings (setting_key, setting_value) VALUES
('branding', '{"systemName": "ImoGuru", "primaryColor": "#3b82f6", "secondaryColor": "#8b5cf6", "logoUrl": "", "faviconUrl": ""}'::jsonb),
('media_limits', '{"maxImages": 20, "maxImageSizeMB": 5, "maxVideoSizeMB": 100, "allowVideoUpload": true, "allowVideoLink": true}'::jsonb),
('print_template', '{"template": "default"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 8. Expandir tabela de profiles para usuários
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_address TEXT,
  ADD COLUMN IF NOT EXISTS creci TEXT,
  ADD COLUMN IF NOT EXISTS user_type TEXT, -- 'corretor_autonomo', 'imobiliaria', etc
  ADD COLUMN IF NOT EXISTS person_type TEXT DEFAULT 'fisica', -- 'fisica' ou 'juridica'
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS cep TEXT,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS number TEXT,
  ADD COLUMN IF NOT EXISTS complement TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Trigger para atualizar updated_at em property_statistics
CREATE TRIGGER update_property_statistics_updated_at
BEFORE UPDATE ON public.property_statistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em authorization_templates
CREATE TRIGGER update_authorization_templates_updated_at
BEFORE UPDATE ON public.authorization_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em system_settings
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();