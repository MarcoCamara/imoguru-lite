-- Adicionar campo photo_placement aos templates de compartilhamento
ALTER TABLE public.share_templates 
ADD COLUMN IF NOT EXISTS photo_placement TEXT DEFAULT 'after_text';

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.share_templates.photo_placement IS 'Posicionamento das fotos: before_text, after_text, or inline';

