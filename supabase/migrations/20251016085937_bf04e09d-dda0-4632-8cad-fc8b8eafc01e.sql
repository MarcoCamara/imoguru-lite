-- Adicionar os novos tipos de imóvel ao enum property_type
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'casa_rua';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'casa_condominio';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'studio_kitnet';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'flat';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'terreno_rua';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'terreno_condominio';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'sala_comercial';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'ponto_loja';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'consultorio';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'sitio_fazenda';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'chacara_rancho';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'gleba';