-- Garantir que existe um template padrão de impressão
-- Deletar templates antigos sem as novas colunas
DELETE FROM public.print_templates WHERE photo_columns IS NULL;

-- Inserir template padrão se não existir
INSERT INTO public.print_templates (name, content, is_default, photo_columns, photo_placement, max_photos)
SELECT 
  'Template Padrão de Impressão',
  E'<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">\n  <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">{{title}}</h1>\n  \n  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">\n    <div>\n      <p><strong>Código:</strong> {{code}}</p>\n      <p><strong>Tipo:</strong> {{property_type}}</p>\n      <p><strong>Finalidade:</strong> {{purpose}}</p>\n      <p><strong>Status:</strong> {{status}}</p>\n    </div>\n    <div>\n      <p><strong>Quartos:</strong> {{bedrooms}}</p>\n      <p><strong>Banheiros:</strong> {{bathrooms}}</p>\n      <p><strong>Vagas:</strong> {{parking_spaces}}</p>\n      <p><strong>Área Total:</strong> {{area_total}}m²</p>\n    </div>\n  </div>\n  \n  <div style="margin: 20px 0;">\n    <h3 style="color: #007bff;">Localização</h3>\n    <p>{{public_address}}, {{neighborhood}}</p>\n    <p>{{city}} - {{state}}</p>\n  </div>\n  \n  <div style="margin: 20px 0;">\n    <h3 style="color: #007bff;">Valores</h3>\n    <p><strong>Venda:</strong> {{sale_price}}</p>\n    <p><strong>Locação:</strong> {{rental_price}}</p>\n    <p><strong>Condomínio:</strong> {{condominium_fee}}</p>\n    <p><strong>IPTU:</strong> {{iptu}}</p>\n  </div>\n  \n  <div style="margin: 20px 0;">\n    <h3 style="color: #007bff;">Descrição</h3>\n    <p style="text-align: justify;">{{description}}</p>\n  </div>\n</div>',
  true,
  2,
  'after_text',
  10
WHERE NOT EXISTS (
  SELECT 1 FROM public.print_templates WHERE is_default = true
);

-- Se já existe um template padrão, atualizar para garantir que tem as colunas corretas
UPDATE public.print_templates 
SET 
  photo_columns = COALESCE(photo_columns, 2),
  photo_placement = COALESCE(photo_placement, 'after_text'),
  max_photos = COALESCE(max_photos, 10)
WHERE is_default = true;

