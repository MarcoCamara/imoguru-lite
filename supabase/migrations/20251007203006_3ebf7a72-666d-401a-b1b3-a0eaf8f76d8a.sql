-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.property_purpose AS ENUM ('venda', 'locacao', 'venda_locacao');
CREATE TYPE public.property_condition AS ENUM ('novo', 'usado');
CREATE TYPE public.property_status AS ENUM ('disponivel', 'reservado', 'vendido', 'alugado');
CREATE TYPE public.property_type AS ENUM (
  'apartamento', 'casa', 'sobrado', 'cobertura', 'kitnet', 
  'loft', 'terreno', 'comercial', 'rural', 'galpao', 'outro'
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
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

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Identificação
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  purpose property_purpose NOT NULL,
  condition property_condition NOT NULL,
  status property_status NOT NULL DEFAULT 'disponivel',
  property_type property_type NOT NULL,
  
  -- Localização pública
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Brasil',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Localização exata (privada)
  exact_cep TEXT,
  exact_street TEXT,
  exact_number TEXT,
  exact_complement TEXT,
  exact_neighborhood TEXT,
  
  -- Características principais
  bedrooms INTEGER DEFAULT 0,
  suites INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  parking_spaces INTEGER DEFAULT 0,
  useful_area DECIMAL(10, 2),
  total_area DECIMAL(10, 2),
  construction_year INTEGER,
  
  -- Valores
  sale_price DECIMAL(15, 2),
  rental_price DECIMAL(15, 2),
  iptu_price DECIMAL(15, 2),
  condo_price DECIMAL(15, 2),
  
  -- Descrição e características
  description TEXT,
  accepts_exchange BOOLEAN DEFAULT FALSE,
  
  -- Condomínio
  condo_name TEXT,
  condo_units INTEGER,
  condo_floors INTEGER,
  condo_amenities TEXT[],
  
  -- Publicação
  published BOOLEAN DEFAULT FALSE,
  published_on_portal BOOLEAN DEFAULT FALSE,
  
  -- Dados do proprietário
  owner_name TEXT,
  owner_cpf_cnpj TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Property images table
CREATE TABLE public.property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;

-- Property videos table
CREATE TABLE public.property_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;

-- Property documents table
CREATE TABLE public.property_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Amenities table
CREATE TABLE public.amenities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- Property amenities junction table
CREATE TABLE public.property_amenities (
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;

-- Nearby points of interest
CREATE TABLE public.nearby_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  distance TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.nearby_points ENABLE ROW LEVEL SECURITY;

-- Share templates (configuração de compartilhamento pelo admin)
CREATE TABLE public.share_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fields JSONB NOT NULL, -- campos a incluir no compartilhamento
  include_images BOOLEAN DEFAULT TRUE,
  max_images INTEGER DEFAULT 5,
  message_format TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.share_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
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

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for properties
CREATE POLICY "Users can view their own properties"
  ON public.properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all properties"
  ON public.properties FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own properties"
  ON public.properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties"
  ON public.properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all properties"
  ON public.properties FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own properties"
  ON public.properties FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete all properties"
  ON public.properties FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for property_images
CREATE POLICY "Users can view images of their properties"
  ON public.property_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all property images"
  ON public.property_images FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert images to their properties"
  ON public.property_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images of their properties"
  ON public.property_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images of their properties"
  ON public.property_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

-- Similar RLS policies for videos, documents, nearby_points
CREATE POLICY "Users can manage their property videos"
  ON public.property_videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all property videos"
  ON public.property_videos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage their property documents"
  ON public.property_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all property documents"
  ON public.property_documents FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can manage nearby points of their properties"
  ON public.nearby_points FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all nearby points"
  ON public.nearby_points FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for amenities (read-only for users, manage for admins)
CREATE POLICY "Anyone can view amenities"
  ON public.amenities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage amenities"
  ON public.amenities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for property_amenities
CREATE POLICY "Users can manage amenities of their properties"
  ON public.property_amenities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties 
      WHERE id = property_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all property amenities"
  ON public.property_amenities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS for share_templates (only admins)
CREATE POLICY "Anyone can view share templates"
  ON public.share_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage share templates"
  ON public.share_templates FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_share_templates_updated_at
  BEFORE UPDATE ON public.share_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default amenities
INSERT INTO public.amenities (name) VALUES
  ('Piscina'),
  ('Academia'),
  ('Churrasqueira'),
  ('Salão de festas'),
  ('Playground'),
  ('Quadra esportiva'),
  ('Sauna'),
  ('Jardim'),
  ('Portaria 24h'),
  ('Elevador'),
  ('Garagem coberta'),
  ('Área de lazer'),
  ('Pet place'),
  ('Bicicletário'),
  ('Coworking'),
  ('Ar condicionado'),
  ('Aquecimento'),
  ('Varanda'),
  ('Sacada'),
  ('Armários embutidos');

-- Insert default share template
INSERT INTO public.share_templates (name, fields, include_images, max_images, message_format, is_default)
VALUES (
  'Template Padrão',
  '["title", "property_type", "purpose", "bedrooms", "bathrooms", "parking_spaces", "total_area", "sale_price", "rental_price", "city", "neighborhood", "description"]'::jsonb,
  true,
  5,
  '🏠 *{title}*

📍 {city} - {neighborhood}

🛏️ {bedrooms} dormitórios | 🚿 {bathrooms} banheiros | 🚗 {parking_spaces} vagas
📐 Área: {total_area}m²

💰 Valor: R$ {price}

{description}

Para mais informações, entre em contato!',
  true
);