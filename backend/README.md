# The Isle Companion — Backend

Spring Boot backend para la plataforma multi-tenant de The Isle Companion.

## Requisitos

- Java 21
- PostgreSQL 18 (o 13+)
- Maven 3.9+ (o usa el wrapper `mvnw`)

## Configuración local

### 1. Base de datos

```sql
psql -U postgres
CREATE DATABASE isle_companion;
\q
```

### 2. Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/isle_companion?stringtype=unspecified` | URL de conexión |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `admin` | Contraseña |

Los valores por defecto funcionan en local sin configurar nada extra. El parámetro `stringtype=unspecified` es necesario para que el driver JDBC de PostgreSQL haga cast implícito de strings a tipos enum nativos.

### 3. Levantar

```bash
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

### 4. Seed automático

Al arrancar por primera vez, `CatalogSeeder` carga automáticamente los catálogos desde `src/main/resources/seed/`:

- `mutations.json` → tabla `mutations` (42 registros)
- `dinos.json` → tablas `dinos`, `dino_stats`, `dino_growth_stages`, `dino_mutations` (20 dinos)
- `zones.json` → tabla `zones` (72 zonas: patrol, migration, sanctuary)
- Hardcodeado → tabla `prime_tasks` (10 tareas)

El seeder comprueba si la tabla ya tiene datos antes de insertar, por lo que es seguro reiniciar el servidor.

## Endpoints disponibles (Nivel 1)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dinos` | Catálogo completo (stats, growth stages, mutaciones) |
| GET | `/mutations` | Catálogo de mutaciones |
| GET | `/zones` | Zonas del mapa por categoría |
| GET | `/prime-tasks` | Tareas prime ordenadas |
| GET | `/servers/{slug}` | Config de un servidor concreto |
| GET | `/health` | Estado del backend |

## Migraciones (Flyway)

Las migraciones están en `src/main/resources/db/migration/`. Flyway las aplica automáticamente al arrancar.

- `V1__initial_schema.sql` — esquema base
- `V2__add_zones.sql` — tabla de zonas del mapa

## Próximos pasos

- [x] Seed automático de catálogos (mutations, dinos, zones, prime_tasks)
- [ ] Autenticación Steam OpenID (cuentas de jugador)
- [ ] Panel admin React + Vite
- [ ] RCON / datos en vivo (Nivel 2)
