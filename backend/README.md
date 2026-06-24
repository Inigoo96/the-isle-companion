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
| `DB_URL` | `jdbc:postgresql://localhost:5432/isle_companion` | URL de conexión |
| `DB_USER` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `admin` | Contraseña |

Los valores por defecto funcionan en local sin configurar nada extra.

### 3. Levantar

```bash
cd backend

# Con Maven instalado:
mvn spring-boot:run

# Sin Maven (usa el wrapper incluido):
./mvnw spring-boot:run        # Linux/Mac
mvnw.cmd spring-boot:run      # Windows
```

El servidor arranca en `http://localhost:8080`.

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

- Autenticación Steam OpenID (Nivel 1 — cuentas de jugador)
- Panel admin React + Vite
- RCON / datos en vivo (Nivel 2)
