-- Permitir acesso público aos templates de impressão padrão
-- Isso é necessário para que as páginas públicas possam imprimir imóveis

-- Criar política para permitir que qualquer pessoa (mesmo sem login) possa visualizar templates padrão
CREATE POLICY "Anyone can view default print templates" 
ON public.print_templates
FOR SELECT 
USING (is_default = true);

-- Manter as políticas existentes para admins gerenciarem todos os templates
-- e usuários autenticados verem todos os templates

