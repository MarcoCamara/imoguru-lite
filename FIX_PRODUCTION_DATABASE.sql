-- ============================================================
-- FIX PRODUÇÃO - CRIAR TABELAS FALTANTES
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Criar tabela public_contact_requests
CREATE TABLE IF NOT EXISTS public.public_contact_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    responded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 2. Criar indexes
CREATE INDEX IF NOT EXISTS idx_public_contact_requests_company_id ON public.public_contact_requests (company_id);
CREATE INDEX IF NOT EXISTS idx_public_contact_requests_property_id ON public.public_contact_requests (property_id);
CREATE INDEX IF NOT EXISTS idx_public_contact_requests_responded_by ON public.public_contact_requests (responded_by);

-- 3. Habilitar RLS
ALTER TABLE public.public_contact_requests ENABLE ROW LEVEL SECURITY;

-- 4. Remover policies antigas se existirem
DROP POLICY IF EXISTS "Company users can view their company contact requests." ON public.public_contact_requests;
DROP POLICY IF EXISTS "Anyone can insert a contact request." ON public.public_contact_requests;
DROP POLICY IF EXISTS "Company users can update their company contact requests." ON public.public_contact_requests;
DROP POLICY IF EXISTS "Company users can delete their company contact requests." ON public.public_contact_requests;

-- 5. Criar policies
CREATE POLICY "Company users can view their company contact requests." ON public.public_contact_requests
  FOR SELECT USING (
    auth.uid() IN ( 
      SELECT id FROM public.profiles 
      WHERE company_id = public_contact_requests.company_id 
    )
  );

CREATE POLICY "Anyone can insert a contact request." ON public.public_contact_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Company users can update their company contact requests." ON public.public_contact_requests
  FOR UPDATE USING (
    auth.uid() IN ( 
      SELECT id FROM public.profiles 
      WHERE company_id = public_contact_requests.company_id 
    )
  );

CREATE POLICY "Company users can delete their company contact requests." ON public.public_contact_requests
  FOR DELETE USING (
    auth.uid() IN ( 
      SELECT id FROM public.profiles 
      WHERE company_id = public_contact_requests.company_id 
    )
  );

-- ============================================================
-- VERIFICAR SE property_share_history EXISTE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.property_share_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT
);

CREATE INDEX IF NOT EXISTS idx_property_share_history_property_id ON public.property_share_history (property_id);
CREATE INDEX IF NOT EXISTS idx_property_share_history_shared_by ON public.property_share_history (shared_by_user_id);

ALTER TABLE public.property_share_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own share history." ON public.property_share_history;
DROP POLICY IF EXISTS "Admins can view all share history." ON public.property_share_history;
DROP POLICY IF EXISTS "Users can insert their own share history." ON public.property_share_history;

CREATE POLICY "Users can view their own share history." ON public.property_share_history
  FOR SELECT USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Admins can view all share history." ON public.property_share_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert their own share history." ON public.property_share_history
  FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

-- ============================================================
-- VERIFICAR property_features
-- ============================================================

-- A tabela property_features pode ter um problema de relacionamento
-- Vamos verificar se existe

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_features') THEN
        CREATE TABLE public.property_features (
            id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
            property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
            feature_name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
        
        CREATE INDEX idx_property_features_property_id ON public.property_features (property_id);
        
        ALTER TABLE public.property_features ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view features of properties in their company" ON public.property_features
          FOR SELECT USING (
            property_id IN (
              SELECT p.id FROM public.properties p
              INNER JOIN public.profiles pr ON pr.company_id = p.company_id
              WHERE pr.id = auth.uid()
            )
          );
    END IF;
END $$;

-- ============================================================
-- MENSAGEM DE CONCLUSÃO
-- ============================================================

SELECT 'Tabelas criadas/verificadas com sucesso!' AS status,
       'Teste o formulário de contato agora!' AS next_step;

