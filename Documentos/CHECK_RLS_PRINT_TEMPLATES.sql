-- Verificar políticas RLS da tabela print_templates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'print_templates';

-- Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'print_templates';

-- Testar acesso direto (este deve funcionar sempre)
SELECT id, name, is_default, photo_columns, photo_placement, max_photos
FROM public.print_templates
WHERE is_default = true;

