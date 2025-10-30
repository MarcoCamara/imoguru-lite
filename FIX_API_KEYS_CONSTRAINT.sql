-- Script para corrigir o CHECK constraint da tabela api_keys
-- Execute este script no Editor SQL do Supabase (https://supabase.com/dashboard/project/jjeyaupzjkyuidrxdvso/editor)

-- 1. Remove a constraint antiga (se existir)
ALTER TABLE public.api_keys 
  DROP CONSTRAINT IF EXISTS api_keys_api_type_check;

-- 2. Adiciona a constraint corrigida incluindo 'ai_status'
ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_api_type_check
  CHECK (api_type IN ('properties', 'contact_requests', 'ai_status'));

-- 3. Verifica se a constraint foi aplicada corretamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.api_keys'::regclass
  AND conname = 'api_keys_api_type_check';

-- Resultado esperado: deve mostrar que api_type IN ('properties', 'contact_requests', 'ai_status')

