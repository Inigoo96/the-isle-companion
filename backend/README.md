# The Isle Companion — Backend

Spring Boot backend para la plataforma multi-tenant de The Isle Companion.

## Requisitos

- Java 21
- PostgreSQL 18 (o 13+)
- Maven 3.9+

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
| `JWT_SECRET` | `dev-secret-change-in-production-must-be-256-bits` | Clave HMAC-SHA256 para firmar tokens |
| `JWT_EXPIRATION_DAYS` | `30` | Duración del token JWT |
| `STEAM_API_KEY` | *(vacío)* | API key de Steam — necesaria para resolver nombre y avatar. Obtener en https://steamcommunity.com/dev/apikey |
| `APP_BASE_URL` | `http://localhost:8080` | URL pública del backend (usada en el callback de Steam OpenID) |

El parámetro `stringtype=unspecified` en `DB_URL` es necesario para que el driver JDBC haga cast implícito de strings a tipos enum nativos de PostgreSQL.

### 3. Levantar

```bash
cd backend
mvn spring-boot:run
```

El servidor arranca en `http://localhost:8080`.

### 4. Seed automático

Al arrancar por primera vez, `CatalogSeeder` carga los catálogos desde `src/main/resources/seed/`:

- `mutations.json` → tabla `mutations` (42 registros)
- `dinos.json` → tablas `dinos`, `dino_stats`, `dino_growth_stages`, `dino_mutations` (20 dinos)
- `zones.json` → tabla `zones` (72 zonas: patrol, migration, sanctuary)
- Hardcodeado → tabla `prime_tasks` (10 tareas)

El seeder comprueba si la tabla ya tiene datos antes de insertar, por lo que es seguro reiniciar.

## Endpoints

### Catálogo público (sin autenticación)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/dinos` | Catálogo completo (stats, growth stages, mutaciones) |
| GET | `/mutations` | Catálogo de mutaciones |
| GET | `/zones` | Zonas del mapa por categoría |
| GET | `/prime-tasks` | Tareas prime ordenadas |
| GET | `/servers` | Lista de todos los servidores (slug, name, growthMultiplier) |
| GET | `/servers/{slug}` | Config completa de un servidor (incluye dinos permitidos) |
| GET | `/actuator/health` | Estado del backend |

### Autenticación Steam OpenID

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/steam?source=overlay\|admin` | Inicia el flujo OpenID — redirige a Steam |
| GET | `/auth/steam/callback` | Callback de Steam — verifica, crea/actualiza cuenta, emite JWT |
| GET | `/auth/done` | Página de confirmación para el overlay Electron |

El parámetro `source` controla el destino tras el login:
- `overlay` → redirige a `/auth/done` (Electron intercepta la URL y extrae el token)
- `admin` → redirige a `http://localhost:5173/auth/callback?token=JWT`

### Endpoints protegidos (requieren `Authorization: Bearer <JWT>`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/me` | Perfil del usuario autenticado |
| GET | `/servers/mine` | Servidores del admin autenticado |
| POST | `/servers` | Crear servidor |
| PUT | `/servers/{slug}` | Actualizar servidor (solo el propietario) |
| DELETE | `/servers/{slug}` | Eliminar servidor (solo el propietario) |

### Body de creación/actualización de servidor

```json
{
  "slug": "mi-servidor",
  "name": "Mi Servidor Isle",
  "growthMultiplier": 1.5,
  "rules": "Descripción opcional...",
  "allowedDinoIds": [1, 3, 7]
}
```

`allowedDinoIds` vacío o ausente significa que todos los dinos están permitidos.

## Autenticación JWT

- Algoritmo: HS256
- Expiración: 30 días (configurable con `JWT_EXPIRATION_DAYS`)
- Payload: `sub` = Steam ID, `displayName` = nombre de Steam
- El token se incluye como `Authorization: Bearer <token>` en las peticiones protegidas

## Migraciones (Flyway)

Las migraciones están en `src/main/resources/db/migration/`. Flyway las aplica automáticamente al arrancar.

- `V1__initial_schema.sql` — esquema base (accounts, servers, dinos, mutations, zones, prime_tasks)
- `V2__add_zones.sql` — tabla de zonas del mapa

## Próximos pasos

- [x] Seed automático de catálogos
- [x] Autenticación Steam OpenID 2.0 + JWT
- [x] Endpoints de servidor (CRUD multi-tenant)
- [x] Panel admin React + Vite
- [ ] RCON / datos en vivo (Nivel 2)
