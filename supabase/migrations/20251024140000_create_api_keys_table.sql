-- Criar tabela de API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  api_type TEXT NOT NULL CHECK (api_type IN ('properties', 'contact_requests', 'ai_status')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  archived BOOLEAN DEFAULT FALSE NOT NULL
);

-- Índices para performance
CREATE INDEX idx_api_keys_company_id ON public.api_keys(company_id);
CREATE INDEX idx_api_keys_api_key ON public.api_keys(api_key) WHERE archived = FALSE;
CREATE INDEX idx_api_keys_api_type ON public.api_keys(api_type);
CREATE INDEX idx_api_keys_archived ON public.api_keys(archived);

-- RLS Policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as API keys
CREATE POLICY "Admins can view all API keys" ON public.api_keys
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Usuários podem ver API keys da sua empresa
CREATE POLICY "Users can view their company API keys" ON public.api_keys
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Admins podem inserir API keys
CREATE POLICY "Admins can insert API keys" ON public.api_keys
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins podem atualizar API keys
CREATE POLICY "Admins can update API keys" ON public.api_keys
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar API keys
CREATE POLICY "Admins can delete API keys" ON public.api_keys
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Função para gerar API key única
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  LOOP
    -- Gerar chave aleatória com prefixo (32 caracteres hex)
    new_key := 'sk_' || encode(gen_random_bytes(32), 'hex');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.api_keys WHERE api_key = new_key) INTO key_exists;
    
    -- Se não existe, retornar
    IF NOT key_exists THEN
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$;

-- Função para criar API key completa
CREATE OR REPLACE FUNCTION public.generate_api_key(
  p_name TEXT,
  p_company_id UUID,
  p_api_type TEXT,
  p_created_by UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  -- Validar tipo de API
  IF p_api_type NOT IN ('properties', 'contact_requests', 'ai_status') THEN
    RAISE EXCEPTION 'Tipo de API inválido: %', p_api_type;
  END IF;

  LOOP
    -- Gerar chave aleatória com prefixo (32 caracteres hex)
    new_key := 'sk_' || encode(gen_random_bytes(32), 'hex');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.api_keys WHERE api_key = new_key) INTO key_exists;
    
    -- Se não existe, inserir e retornar
    IF NOT key_exists THEN
      INSERT INTO public.api_keys (name, api_key, company_id, api_type, created_by)
      VALUES (p_name, new_key, p_company_id, p_api_type, p_created_by);
      
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON TABLE public.api_keys IS 'Armazena as chaves de API para acesso externo aos dados do sistema';
COMMENT ON COLUMN public.api_keys.api_type IS 'Tipo de API: properties (imóveis), contact_requests (solicitações de contato) ou ai_status (status da IA)';
COMMENT ON COLUMN public.api_keys.usage_count IS 'Contador de quantas vezes a API key foi usada';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Última vez que a API key foi utilizada';

