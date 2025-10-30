-- Adicionar colunas de configuração de fotos para print_templates
ALTER TABLE public.print_templates
ADD COLUMN IF NOT EXISTS photo_columns INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS photo_placement TEXT DEFAULT 'after_text';

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.print_templates.photo_columns IS 'Número de colunas para exibição de fotos (1-4)';
COMMENT ON COLUMN public.print_templates.photo_placement IS 'Posição das fotos: before_text, after_text, intercalated';

