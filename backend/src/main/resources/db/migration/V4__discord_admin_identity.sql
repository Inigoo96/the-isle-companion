-- =============================================================================
-- The Isle Companion - Identidad de admin por Discord (panel 100% Discord)
-- Migracion Flyway V4. Destino: PostgreSQL 13+
--
-- El panel de administracion pasa a autenticar y verificar propiedad via Discord.
-- accounts (Steam) sigue siendo SOLO jugadores del overlay; NO se toca su login.
-- Se separan las dos identidades: accounts = jugadores, admins = panel.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Identidad del panel: admins por Discord (independiente de accounts).
-- -----------------------------------------------------------------------------
CREATE TABLE admins (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    discord_user_id varchar(32) NOT NULL UNIQUE,
    username        varchar(128),
    avatar_url      text,
    created_at      timestamptz NOT NULL DEFAULT now(),
    last_login_at   timestamptz
);

-- -----------------------------------------------------------------------------
-- 2) servers.owner_id pasa a referenciar admins (antes apuntaba a accounts).
--    No hay datos reales: vaciamos servers y su tabla hija para poder cambiar
--    la FK sin conflictos de integridad.
-- -----------------------------------------------------------------------------
DELETE FROM server_allowed_dinos;
DELETE FROM servers;

ALTER TABLE servers DROP CONSTRAINT servers_owner_id_fkey;
ALTER TABLE servers
    ADD CONSTRAINT servers_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES admins(id) ON DELETE RESTRICT;

-- -----------------------------------------------------------------------------
-- 3) Estado de moderacion del server + metadatos de revision y del guild Discord.
--    status='pending' por defecto: el server no es publico hasta ser aceptado.
-- -----------------------------------------------------------------------------
CREATE TYPE server_status AS ENUM ('pending', 'accepted', 'rejected', 'banned');

ALTER TABLE servers
    ADD COLUMN status             server_status NOT NULL DEFAULT 'pending',
    ADD COLUMN reviewed_at        timestamptz,
    ADD COLUMN reviewed_by        uuid REFERENCES admins(id) ON DELETE SET NULL,
    ADD COLUMN discord_guild_id   varchar(32),
    ADD COLUMN discord_guild_name varchar(128),
    ADD COLUMN discord_invite_url text;

CREATE INDEX idx_servers_status ON servers(status);

-- -----------------------------------------------------------------------------
-- 4) Equipo / co-admins del server. El owner va en servers.owner_id, NO aqui;
--    server_members es solo para los admins adicionales (siguiente fase).
-- -----------------------------------------------------------------------------
CREATE TABLE server_members (
    server_id uuid        NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    admin_id  uuid        NOT NULL REFERENCES admins(id)  ON DELETE CASCADE,
    role      varchar(24) NOT NULL DEFAULT 'admin',
    PRIMARY KEY (server_id, admin_id)
);

-- FK no cubierta por la primera columna de la PK (Postgres no la indexa sola).
CREATE INDEX idx_server_members_admin ON server_members(admin_id);
