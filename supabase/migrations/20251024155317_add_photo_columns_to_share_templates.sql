ALTER TABLE public.share_templates
ADD COLUMN IF NOT EXISTS photo_columns INTEGER DEFAULT 2;

