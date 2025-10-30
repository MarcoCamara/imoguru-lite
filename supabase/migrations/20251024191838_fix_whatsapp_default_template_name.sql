-- Corrigir nome do template default do WhatsApp de "Outros" para "WhatsApp Padrão"
UPDATE public.share_templates
SET name = 'WhatsApp Padrão'
WHERE platform = 'whatsapp' 
  AND is_default = TRUE 
  AND (name = 'Outros' OR name LIKE '%Outro%');

-- Se não existir template default para WhatsApp, criar um
INSERT INTO public.share_templates (name, platform, message_format, fields, include_images, max_images, photo_columns, is_default)
SELECT 
  'WhatsApp Padrão',
  'whatsapp',
  E'🏠 *{{title}}*\n\n📍 {{public_address}}\n💰 {{sale_price}}\n\n{{description}}\n\n🔗 Link: {{property_url}}',
  '["title", "public_address", "sale_price", "description", "property_url"]'::jsonb,
  true,
  4,
  2,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.share_templates 
  WHERE platform = 'whatsapp' AND is_default = TRUE
);

