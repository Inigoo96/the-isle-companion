-- Zonas del mapa de Evrima (patrol, migration, sanctuaries).
-- La geometría se guarda como jsonb: coordenadas del juego, no geo real.
--   circle:  {"center": [x, y], "radius": n}
--   polygon: {"points": [[x, y], ...]}

CREATE TYPE zone_category AS ENUM ('patrol', 'migration', 'sanctuary');
CREATE TYPE zone_shape    AS ENUM ('circle', 'polygon');

CREATE TABLE zones (
    id        integer       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name      varchar(64)   NOT NULL,
    category  zone_category NOT NULL,
    shape     zone_shape    NOT NULL,
    geometry  jsonb         NOT NULL,
    UNIQUE (name, category)
);
