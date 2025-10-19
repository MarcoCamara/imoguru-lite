-- Verificar se user_passwords e user_roles já existem e criar se necessário
-- A tabela profiles já existe e está vinculada ao auth.users

-- Criar função para criar perfil automaticamente ao registrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Criar role padrão de 'user'
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Criar trigger para novos usuários (se não existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar políticas RLS do profiles para permitir inserção no signup
DROP POLICY IF EXISTS "Users can insert their own profile on signup" ON public.profiles;
CREATE POLICY "Users can insert their own profile on signup"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);