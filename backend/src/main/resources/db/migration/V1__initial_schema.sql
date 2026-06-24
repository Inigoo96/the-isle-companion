-- =============================================================================
-- The Isle Companion - Esquema inicial (Nivel 1: config manual + cuentas Steam)
-- Migracion Flyway V1. Destino: PostgreSQL 13+
--
-- Estructura en 4 bloques:
--   1) Tipos enum (conjuntos cerrados)
--   2) Contenido global del juego (dinos, stats, crecimiento, mutaciones, tareas)
--   3) Identidad (accounts por Steam64) y tenancy (servers + config read-only)
--   4) Progreso personal del jugador (prime runs)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

-- =============================================================================
-- 1) ENUMS  (conjuntos cerrados -> enum, no texto libre)
-- =============================================================================

-- Dieta del juego. Incluye piscivore (p.ej. Deinosuchus) para cubrir el roster.
CREATE TYPE dino_diet AS ENUM ('carnivore', 'herbivore', 'omnivore', 'piscivore');

CREATE TYPE dino_tier AS ENUM ('apex', 'high', 'mid', 'low_mid', 'low');

CREATE TYPE mutation_category AS ENUM
    ('universal', 'carnivore', 'herbivore', 'female', 'slot2', 'unlockable');

-- OJO: dos enums de "etapa" DISTINTOS y no intercambiables.
--   stat_stage  = snapshots de stats (adult=100%, prime=87.5%)
CREATE TYPE stat_stage AS ENUM ('hatchling', 'juvenile', 'adult', 'prime');
--   growth_stage = fases del temporizador de crecimiento
CREATE TYPE growth_stage AS ENUM ('hatchling', 'juvenile', 'sub_adult', 'elder');

-- Tag de la recomendacion de mutacion por dino (s2 / desb / situ). 0 o 1 por fila.
CREATE TYPE recommendation_tag AS ENUM ('slot2', 'unlockable', 'situational');

CREATE TYPE prime_task_category AS ENUM
    ('default', 'diet_birth', 'exploration', 'breeding', 'special_species');

CREATE TYPE prime_task_status AS ENUM ('pending', 'done', 'missed', 'locked');

-- =============================================================================
-- 2) CONTENIDO GLOBAL DEL JUEGO
--    Se actualiza una vez por parche; lo sirve el backend a todos los overlays.
-- =============================================================================

CREATE TABLE dinos (
    id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name     varchar(64) NOT NULL UNIQUE,
    diet     dino_diet   NOT NULL,
    tier     dino_tier   NOT NULL,
    ability  varchar(64)
);

CREATE TABLE dino_stats (
    dino_id     integer    NOT NULL REFERENCES dinos(id) ON DELETE CASCADE,
    stage       stat_stage NOT NULL,
    weight      numeric(10,2) NOT NULL CHECK (weight     >= 0),  -- kg (= HP)
    speed       numeric(6,2)  NOT NULL CHECK (speed      >= 0),  -- km/h sprint
    bite_force  numeric(8,2)  NOT NULL CHECK (bite_force >= 0),
    PRIMARY KEY (dino_id, stage)        -- una fila por etapa que exista; sin nulls
);

CREATE TABLE dino_growth_stages (
    dino_id  integer      NOT NULL REFERENCES dinos(id) ON DELETE CASCADE,
    stage    growth_stage NOT NULL,
    ordinal  smallint     NOT NULL CHECK (ordinal >= 0),
    minutes  integer      NOT NULL CHECK (minutes >= 0),  -- duracion vanilla (x1)
    PRIMARY KEY (dino_id, stage),
    CONSTRAINT uq_growth_ordinal UNIQUE (dino_id, ordinal)
);

CREATE TABLE mutations (
    id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name      varchar(64) NOT NULL UNIQUE,
    effect    text,
    category  mutation_category NOT NULL
);

-- Lista ordenada de mutaciones recomendadas por dino (el Mutation Builder).
CREATE TABLE dino_mutations (
    dino_id      integer  NOT NULL REFERENCES dinos(id)     ON DELETE CASCADE,
    mutation_id  integer  NOT NULL REFERENCES mutations(id) ON DELETE RESTRICT,
    priority     smallint NOT NULL CHECK (priority >= 1),
    tag          recommendation_tag,           -- NULL = sin tag
    PRIMARY KEY (dino_id, mutation_id),
    CONSTRAINT uq_dino_mutation_priority UNIQUE (dino_id, priority)
);

-- Catalogo de las tareas Prime (la UI las pinta; versionable cuando el juego cambie).
CREATE TABLE prime_tasks (
    id                 integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    key                varchar(48) NOT NULL UNIQUE,   -- id estable, p.ej. never_infertile
    name               varchar(96) NOT NULL,
    category           prime_task_category NOT NULL,
    description        text,
    is_default_active  boolean  NOT NULL DEFAULT false,
    sort_order         smallint NOT NULL
);

-- =============================================================================
-- 3) IDENTIDAD Y TENANCY
-- =============================================================================

-- Cuenta = identidad por Steam64. Sin email ni password (login via Steam OpenID).
-- steam_id como TEXTO: 17 digitos no caben en un entero JS sin perder precision.
CREATE TABLE accounts (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    steam_id      varchar(20) NOT NULL UNIQUE CHECK (steam_id ~ '^[0-9]{17}$'),
    display_name  varchar(96),
    avatar_url    text,
    prefs         jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- libre por usuario
    created_at    timestamptz NOT NULL DEFAULT now(),
    last_login_at timestamptz
);

-- Servidor = inquilino. Solo config de lectura para el overlay (no toca el juego).
CREATE TABLE servers (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id          uuid        NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
    slug              varchar(48) NOT NULL UNIQUE,   -- id publico en la URL
    name              varchar(96) NOT NULL,
    growth_multiplier numeric(4,2) NOT NULL DEFAULT 1 CHECK (growth_multiplier > 0),
    rules             text,
    branding          jsonb       NOT NULL DEFAULT '{}'::jsonb,  -- colores/logo
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE server_allowed_dinos (
    server_id  uuid    NOT NULL REFERENCES servers(id) ON DELETE CASCADE,
    dino_id    integer NOT NULL REFERENCES dinos(id)   ON DELETE CASCADE,
    PRIMARY KEY (server_id, dino_id)    -- PK compuesta: sin duplicados
);

-- =============================================================================
-- 4) PROGRESO PERSONAL DEL JUGADOR  (su Prime List entre sesiones; NO es el garage)
-- =============================================================================

CREATE TABLE prime_runs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id  uuid    NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    dino_id     integer NOT NULL REFERENCES dinos(id)    ON DELETE RESTRICT,
    is_prime    boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prime_run_tasks (
    run_id   uuid    NOT NULL REFERENCES prime_runs(id)  ON DELETE CASCADE,
    task_id  integer NOT NULL REFERENCES prime_tasks(id) ON DELETE RESTRICT,
    status   prime_task_status NOT NULL DEFAULT 'pending',
    PRIMARY KEY (run_id, task_id)
);

-- =============================================================================
-- INDICES sobre FKs no cubiertas por la columna inicial de una PK/UNIQUE.
-- (PostgreSQL NO indexa las FKs automaticamente.)
-- =============================================================================

CREATE INDEX idx_dino_mutations_mutation    ON dino_mutations(mutation_id);
CREATE INDEX idx_servers_owner              ON servers(owner_id);
CREATE INDEX idx_server_allowed_dinos_dino  ON server_allowed_dinos(dino_id);
CREATE INDEX idx_prime_runs_account         ON prime_runs(account_id);
CREATE INDEX idx_prime_runs_dino            ON prime_runs(dino_id);
CREATE INDEX idx_prime_run_tasks_task       ON prime_run_tasks(task_id);

-- =============================================================================
-- TRIGGER updated_at: que lo mantenga la BD, no solo la app.
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_servers_updated_at
    BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prime_runs_updated_at
    BEFORE UPDATE ON prime_runs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
