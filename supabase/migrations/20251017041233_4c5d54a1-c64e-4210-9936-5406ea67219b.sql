-- Create user_passwords table for backend authentication
CREATE TABLE IF NOT EXISTS public.user_passwords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Service/backend can manage all passwords (backend operates with service role)
CREATE POLICY "Service can manage passwords"
  ON public.user_passwords
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Users can read their own password hash (for backend verification)
CREATE POLICY "Users can read their own password hash"
  ON public.user_passwords
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_passwords_user_id ON public.user_passwords(user_id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_user_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_passwords_updated_at
  BEFORE UPDATE ON public.user_passwords
  FOR EACH ROW
  EXECUTE FUNCTION update_user_passwords_updated_at();