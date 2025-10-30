-- Corrigir políticas RLS para permitir inserção de API keys por usuários autenticados
-- Esta migração resolve o problema específico com a API ai_status

-- Remover políticas restritivas existentes
DROP POLICY IF EXISTS "Admins can insert API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Admins can view all API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view their company API keys" ON public.api_keys;

-- Criar políticas mais permissivas para usuários autenticados
CREATE POLICY "Authenticated users can insert API keys" ON public.api_keys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view API keys" ON public.api_keys
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update API keys" ON public.api_keys
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete API keys" ON public.api_keys
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Garantir que a constraint inclui ai_status
ALTER TABLE public.api_keys DROP CONSTRAINT IF EXISTS api_keys_api_type_check;
ALTER TABLE public.api_keys ADD CONSTRAINT api_keys_api_type_check 
  CHECK (api_type IN ('properties', 'contact_requests', 'ai_status'));
