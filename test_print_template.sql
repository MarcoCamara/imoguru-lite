-- Query para verificar templates de impressão
SELECT id, name, is_default, photo_columns, photo_placement, max_photos, created_at
FROM public.print_templates;

-- Se não houver nenhum, inserir manualmente
INSERT INTO public.print_templates (name, content, is_default, photo_columns, photo_placement, max_photos)
VALUES (
  'Template Padrão de Impressão',
  '<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">{{title}}</h1>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
    <div>
      <p><strong>Código:</strong> {{code}}</p>
      <p><strong>Tipo:</strong> {{property_type}}</p>
      <p><strong>Finalidade:</strong> {{purpose}}</p>
      <p><strong>Status:</strong> {{status}}</p>
    </div>
    <div>
      <p><strong>Quartos:</strong> {{bedrooms}}</p>
      <p><strong>Banheiros:</strong> {{bathrooms}}</p>
      <p><strong>Vagas:</strong> {{parking_spaces}}</p>
      <p><strong>Área Total:</strong> {{area_total}}m²</p>
    </div>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #007bff;">Localização</h3>
    <p>{{public_address}}, {{neighborhood}}</p>
    <p>{{city}} - {{state}}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #007bff;">Valores</h3>
    <p><strong>Venda:</strong> {{sale_price}}</p>
    <p><strong>Locação:</strong> {{rental_price}}</p>
    <p><strong>Condomínio:</strong> {{condominium_fee}}</p>
    <p><strong>IPTU:</strong> {{iptu}}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #007bff;">Descrição</h3>
    <p style="text-align: justify;">{{description}}</p>
  </div>
</div>',
  true,
  2,
  'after_text',
  10
)
ON CONFLICT DO NOTHING;

