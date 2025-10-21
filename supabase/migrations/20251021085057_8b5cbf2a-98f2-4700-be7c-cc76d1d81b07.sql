-- FASE 1: Correção de Bugs Críticos - Migration

-- 1.1 Adicionar campo CNPJ em companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- 1.2 Adicionar flag archived em profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- 1.3 Criar tabela de histórico de compartilhamentos
CREATE TABLE IF NOT EXISTS property_share_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  shared_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  platforms TEXT[] NOT NULL,
  contact_data JSONB,
  recipient_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_share_history_property ON property_share_history(property_id);
CREATE INDEX IF NOT EXISTS idx_share_history_date ON property_share_history(shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_history_shared_by ON property_share_history(shared_by);

-- RLS policies para property_share_history
ALTER TABLE property_share_history ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver histórico dos imóveis da sua empresa
CREATE POLICY "Users can view share history from their company"
ON property_share_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM properties p
    INNER JOIN profiles prof ON p.company_id = prof.company_id
    WHERE p.id = property_share_history.property_id
    AND prof.id = auth.uid()
  )
);

-- Usuários podem criar histórico de compartilhamento
CREATE POLICY "Users can create share history"
ON property_share_history FOR INSERT
WITH CHECK (
  shared_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM properties p
    INNER JOIN profiles prof ON p.company_id = prof.company_id
    WHERE p.id = property_share_history.property_id
    AND prof.id = auth.uid()
  )
);

-- Admins podem ver e gerenciar tudo
CREATE POLICY "Admins can manage all share history"
ON property_share_history FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);