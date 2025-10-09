-- Corrigir avisos de segurança

-- 1. Habilitar RLS na tabela property_code_sequence
ALTER TABLE public.property_code_sequence ENABLE ROW LEVEL SECURITY;

-- Policies: Somente admins podem gerenciar, mas todos podem ler (necessário para gerar códigos)
CREATE POLICY "Anyone authenticated can read property code sequence"
ON public.property_code_sequence FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage property code sequence"
ON public.property_code_sequence FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));