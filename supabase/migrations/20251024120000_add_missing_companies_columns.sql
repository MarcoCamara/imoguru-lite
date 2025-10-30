-- Adicionar todas as colunas faltantes na tabela companies

-- Informações de contato
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Endereço
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state TEXT;

-- Configurações e status
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website_domain TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#000000';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#FFFFFF';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS ai_agent_enabled BOOLEAN DEFAULT false;

