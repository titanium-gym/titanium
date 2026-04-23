-- =============================================================================
-- 001_complete_schema.sql
-- Schema completo para Titanium
-- Incluye: tabla members, triggers, RLS policies
-- =============================================================================

-- =============================================================================
-- 1. FUNCIÓN: update_updated_at_column()
-- Actualiza automáticamente el timestamp de updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW() AT TIME ZONE 'UTC';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. TABLA: members
-- Estructura principal de socios del club
-- =============================================================================
CREATE TABLE IF NOT EXISTS members (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  fee_amount INTEGER NOT NULL CHECK (fee_amount IN (30, 35)),
  paid_at DATE NOT NULL,
  expires_at DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 3. TRIGGER: update_members_updated_at
-- Mantiene updated_at sincronizado automáticamente
-- =============================================================================
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
CREATE TRIGGER update_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 4. ÍNDICES: Optimización de queries
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_members_expires_at ON members(expires_at);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON members(full_name);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- Control de acceso a nivel de fila
-- =============================================================================

-- Habilitar RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Política: SELECT para usuarios autenticados
CREATE POLICY public_read_members ON members
  FOR SELECT
  TO authenticated
  USING (TRUE);

-- Política: INSERT para usuarios autenticados
CREATE POLICY authenticated_insert_members ON members
  FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

-- Política: UPDATE para usuarios autenticados
CREATE POLICY authenticated_update_members ON members
  FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

-- Política: DELETE para usuarios autenticados
CREATE POLICY authenticated_delete_members ON members
  FOR DELETE
  TO authenticated
  USING (TRUE);

-- =============================================================================
-- Confirmación
-- =============================================================================
SELECT 
  'Schema completo creado ✅' as status,
  COUNT(*) as tablas
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'members';
