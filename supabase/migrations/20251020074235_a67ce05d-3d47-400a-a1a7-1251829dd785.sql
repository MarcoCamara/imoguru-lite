-- Adicionar campos de endereço e redes sociais à tabela companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS street text,
ADD COLUMN IF NOT EXISTS number text,
ADD COLUMN IF NOT EXISTS complement text,
ADD COLUMN IF NOT EXISTS neighborhood text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS whatsapp text,
ADD COLUMN IF NOT EXISTS facebook text,
ADD COLUMN IF NOT EXISTS instagram text;

-- Adicionar campo archived à tabela profiles para permitir arquivar usuários
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false;