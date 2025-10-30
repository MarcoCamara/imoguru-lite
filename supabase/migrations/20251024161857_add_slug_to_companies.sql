-- Adicionar coluna slug na tabela companies para URLs públicas
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Gerar slugs únicos para empresas existentes (baseado no CNPJ ou ID)
DO $$
DECLARE
  company_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
BEGIN
  FOR company_record IN SELECT id, name, cnpj FROM public.companies WHERE slug IS NULL
  LOOP
    -- Criar slug base a partir do nome da empresa (remover acentos, espaços, caracteres especiais)
    base_slug := LOWER(REGEXP_REPLACE(
      TRANSLATE(
        company_record.name,
        'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭįıòóôõöōŏőùúûüũūŭůűųñçćĉċč',
        'aaaaaaaaaeeeeeeeeeeiiiiiiiiiooooooooouuuuuuuuunc ccccc'
      ),
      '[^a-z0-9]+', '-', 'g'
    ));
    
    -- Remover hífens no início e no final
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Se o slug estiver vazio, usar o ID
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'company-' || REPLACE(company_record.id::TEXT, '-', '');
    END IF;
    
    final_slug := base_slug;
    counter := 1;
    
    -- Garantir que o slug seja único
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = final_slug) LOOP
      final_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    UPDATE public.companies SET slug = final_slug WHERE id = company_record.id;
  END LOOP;
END $$;

-- Tornar slug obrigatório para novas empresas
ALTER TABLE public.companies
ALTER COLUMN slug SET NOT NULL;

-- Adicionar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies (slug);

-- Comentário
COMMENT ON COLUMN public.companies.slug IS 'Slug único para URL pública da empresa (ex: /public-property/imobiliaria-xyz)';

