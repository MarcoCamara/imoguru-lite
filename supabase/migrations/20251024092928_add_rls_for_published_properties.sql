ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Revoke existing SELECT policies for properties to replace them with a unified policy
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;

-- New RLS policy: all published properties are viewable by anyone
CREATE POLICY "Published properties are viewable by everyone." ON public.properties
  FOR SELECT USING (published = true);

-- Users can view and manage their own properties (regardless of published status)
CREATE POLICY "Users can view and manage their own properties." ON public.properties
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view and manage all properties (regardless of published status)
CREATE POLICY "Admins can view and manage all properties." ON public.properties
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
