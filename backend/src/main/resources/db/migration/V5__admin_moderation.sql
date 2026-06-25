-- =============================================================================
-- The Isle Companion - La moderacion pasa de SERVER a ADMIN
-- Migracion Flyway V5.
--
-- Decision: lo que se modera es el ADMIN (identidad Discord), no cada server.
-- Un admin entra 'pending'; el admin de plataforma lo aprueba/rechaza/banea.
-- Los servers vuelven a ser solo config; su visibilidad publica depende del
-- estado de SU admin (solo se ven los de admins 'accepted').
-- =============================================================================

-- 1) Quitar la moderacion de servers (vuelven a ser solo config).
DROP INDEX IF EXISTS idx_servers_status;
ALTER TABLE servers
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS reviewed_at,
    DROP COLUMN IF EXISTS reviewed_by;
DROP TYPE IF EXISTS server_status;

-- 2) Moderacion a nivel de admin.
CREATE TYPE admin_status AS ENUM ('pending', 'accepted', 'rejected', 'banned');

ALTER TABLE admins
    ADD COLUMN status      admin_status NOT NULL DEFAULT 'pending',
    ADD COLUMN reviewed_at timestamptz,
    ADD COLUMN reviewed_by uuid REFERENCES admins(id) ON DELETE SET NULL;

CREATE INDEX idx_admins_status ON admins(status);
