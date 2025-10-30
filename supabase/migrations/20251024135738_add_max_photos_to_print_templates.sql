-- Adicionar coluna max_photos para limitar número de fotos em templates de impressão
ALTER TABLE public.print_templates
ADD COLUMN IF NOT EXISTS max_photos INTEGER DEFAULT 10;

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.print_templates.max_photos IS 'Número máximo de fotos a exibir no template (1-50)';

