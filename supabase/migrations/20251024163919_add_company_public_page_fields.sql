-- Adicionar campos necessários para página pública da empresa

-- 1. Adicionar coluna show_restricted_area_button em companies
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS show_restricted_area_button BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.companies.show_restricted_area_button IS 'Define se o botão "Área Restrita" aparece na página pública';

-- 2. Adicionar coluna is_featured em properties (imóvel destaque)
-- Esta coluna já deve existir da migração anterior, mas vamos garantir
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.properties.is_featured IS 'Define se o imóvel é destaque na página pública da empresa';

-- 3. Criar índice para busca rápida de imóvel destaque
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties (company_id, is_featured) WHERE is_featured = true;

-- 4. Criar função para garantir que apenas 1 imóvel seja destaque por empresa
CREATE OR REPLACE FUNCTION ensure_single_featured_property()
RETURNS TRIGGER AS $$
BEGIN
  -- Se estiver marcando como destaque
  IF NEW.is_featured = TRUE THEN
    -- Desmarcar todos os outros imóveis da mesma empresa
    UPDATE public.properties
    SET is_featured = FALSE
    WHERE company_id = NEW.company_id
      AND id != NEW.id
      AND is_featured = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Criar trigger para a função
DROP TRIGGER IF EXISTS trigger_ensure_single_featured_property ON public.properties;
CREATE TRIGGER trigger_ensure_single_featured_property
  BEFORE INSERT OR UPDATE OF is_featured
  ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_featured_property();

-- 6. Adicionar mais informações opcionais para rodapé da página pública
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS about_text TEXT;

COMMENT ON COLUMN public.companies.address IS 'Endereço completo da empresa para exibir no rodapé';
COMMENT ON COLUMN public.companies.email IS 'Email de contato da empresa';
COMMENT ON COLUMN public.companies.about_text IS 'Texto sobre a empresa para exibir na página pública';

