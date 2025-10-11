-- Limpar imóveis existentes que estão com códigos inválidos
DELETE FROM properties WHERE code IS NULL OR code = '' OR code NOT LIKE 'IMO-%';

-- Resetar a sequência para começar do 1
UPDATE property_code_sequence SET last_sequence = 0;