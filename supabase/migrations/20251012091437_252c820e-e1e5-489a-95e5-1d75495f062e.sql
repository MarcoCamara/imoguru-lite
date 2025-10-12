-- Add platform column to share_templates table
ALTER TABLE public.share_templates 
ADD COLUMN IF NOT EXISTS platform TEXT NOT NULL DEFAULT 'whatsapp';

-- Add comment to explain platforms
COMMENT ON COLUMN public.share_templates.platform IS 'Platform: whatsapp, email, messenger, facebook, instagram';

-- Insert default templates for each platform
INSERT INTO public.share_templates (name, platform, is_default, fields, message_format, include_images, max_images)
VALUES 
  (
    'WhatsApp Padrão',
    'whatsapp',
    true,
    '["title", "purpose", "property_type", "city", "state", "bedrooms", "bathrooms", "parking_spaces", "total_area", "sale_price", "rental_price", "description"]'::jsonb,
    E'🏠 *{{title}}*\n\n📍 {{city}}/{{state}}\n🔑 {{purpose}} | {{property_type}}\n\n🛏️ {{bedrooms}} dorm | 🚿 {{bathrooms}} ban | 🚗 {{parking_spaces}} vagas\n📐 {{total_area}}m²\n\n💰 {{sale_price}}{{rental_price}}\n\n{{description}}\n\n✨ Entre em contato para mais informações!',
    true,
    5
  ),
  (
    'Email Padrão',
    'email',
    true,
    '["title", "purpose", "property_type", "city", "state", "bedrooms", "suites", "bathrooms", "parking_spaces", "useful_area", "total_area", "sale_price", "rental_price", "iptu_price", "condo_price", "description", "code"]'::jsonb,
    E'<h2>{{title}}</h2>\n<p><strong>Código:</strong> {{code}}</p>\n<p><strong>Localização:</strong> {{city}}/{{state}}</p>\n<p><strong>Tipo:</strong> {{purpose}} - {{property_type}}</p>\n\n<h3>Características:</h3>\n<ul>\n<li>Dormitórios: {{bedrooms}}</li>\n<li>Suítes: {{suites}}</li>\n<li>Banheiros: {{bathrooms}}</li>\n<li>Vagas: {{parking_spaces}}</li>\n<li>Área Útil: {{useful_area}}m²</li>\n<li>Área Total: {{total_area}}m²</li>\n</ul>\n\n<h3>Valores:</h3>\n<ul>\n<li>{{sale_price}}{{rental_price}}</li>\n<li>IPTU: {{iptu_price}}</li>\n<li>Condomínio: {{condo_price}}</li>\n</ul>\n\n<p>{{description}}</p>',
    true,
    10
  ),
  (
    'Facebook Padrão',
    'facebook',
    true,
    '["title", "city", "state", "purpose", "property_type", "bedrooms", "bathrooms", "parking_spaces", "total_area", "sale_price", "rental_price"]'::jsonb,
    E'🏠 {{title}}\n\n📍 {{city}}/{{state}}\n🔑 {{purpose}} | {{property_type}}\n\n✨ Características:\n🛏️ {{bedrooms}} dormitórios\n🚿 {{bathrooms}} banheiros\n🚗 {{parking_spaces}} vagas\n📐 {{total_area}}m²\n\n💰 {{sale_price}}{{rental_price}}\n\n#imoveis #{{city}} #{{property_type}}',
    true,
    8
  ),
  (
    'Instagram Padrão',
    'instagram',
    true,
    '["title", "city", "bedrooms", "bathrooms", "total_area", "sale_price", "rental_price"]'::jsonb,
    E'🏠 {{title}}\n📍 {{city}}\n\n🛏️ {{bedrooms}} | 🚿 {{bathrooms}} | 📐 {{total_area}}m²\n💰 {{sale_price}}{{rental_price}}\n\n✨ Imóvel dos sonhos te esperando!\n\n#imoveis #{{city}} #casanova #apartamento #imovel #arquitetura #decoracao #investimento',
    true,
    6
  ),
  (
    'Messenger Padrão',
    'messenger',
    true,
    '["title", "city", "state", "purpose", "property_type", "bedrooms", "bathrooms", "parking_spaces", "total_area", "sale_price", "rental_price", "description"]'::jsonb,
    E'🏠 {{title}}\n\n📍 {{city}}/{{state}}\n🔑 {{purpose}} | {{property_type}}\n\n🛏️ {{bedrooms}} dorm | 🚿 {{bathrooms}} ban | 🚗 {{parking_spaces}} vagas\n📐 {{total_area}}m²\n\n💰 {{sale_price}}{{rental_price}}\n\n{{description}}',
    true,
    5
  )
ON CONFLICT DO NOTHING;