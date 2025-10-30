-- Adicionar campo youtube_url na tabela properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS youtube_url TEXT;

