-- Remover ai_status do constraint api_keys_api_type_check
-- Esta migração remove a opção 'ai_status' que não é mais utilizada

-- 1. Remover constraint antiga
ALTER TABLE public.api_keys 
  DROP CONSTRAINT IF EXISTS api_keys_api_type_check;

-- 2. Adicionar constraint sem 'ai_status'
ALTER TABLE public.api_keys
  ADD CONSTRAINT api_keys_api_type_check
  CHECK (api_type IN ('properties', 'contact_requests'));

-- 3. Atualizar função generate_api_key para remover ai_status
CREATE OR REPLACE FUNCTION public.generate_api_key(
  p_name TEXT,
  p_company_id UUID,
  p_api_type TEXT,
  p_created_by UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_key TEXT;
  key_exists BOOLEAN;
BEGIN
  -- Validar tipo de API (sem ai_status)
  IF p_api_type NOT IN ('properties', 'contact_requests') THEN
    RAISE EXCEPTION 'Tipo de API inválido: %. Valores permitidos: properties, contact_requests', p_api_type;
  END IF;

  LOOP
    -- Gerar chave aleatória com prefixo (32 caracteres hex)
    new_key := 'sk_' || encode(gen_random_bytes(32), 'hex');
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM public.api_keys WHERE api_key = new_key) INTO key_exists;
    
    -- Se não existe, inserir e retornar
    IF NOT key_exists THEN
      INSERT INTO public.api_keys (name, api_key, company_id, api_type, created_by)
      VALUES (p_name, new_key, p_company_id, p_api_type, p_created_by);
      
      RETURN new_key;
    END IF;
  END LOOP;
END;
$$;

-- 4. Atualizar comentário da tabela
COMMENT ON COLUMN public.api_keys.api_type IS 'Tipo de API: properties (imóveis) ou contact_requests (solicitações de contato)';

-- 5. Verificar se a constraint foi aplicada corretamente
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.api_keys'::regclass
  AND conname = 'api_keys_api_type_check';

-- Resultado esperado: 
-- api_keys_api_type_check | CHECK ((api_type = ANY (ARRAY['properties'::text, 'contact_requests'::text])))

