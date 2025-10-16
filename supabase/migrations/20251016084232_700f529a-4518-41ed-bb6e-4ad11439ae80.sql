-- Adicionar campos de parceria na tabela properties
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS capture_type text DEFAULT 'propria',
ADD COLUMN IF NOT EXISTS captured_by text,
ADD COLUMN IF NOT EXISTS available_for_partnership boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS partnerships_notes text;