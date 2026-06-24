# The Isle Companion — Backend

Spring Boot backend para la plataforma multi-tenant de The Isle Companion.

## URLs de producción

| Entorno | URL |
|---|---|
| Producción (Railway) | `https://the-isle-companion-production.up.railway.app` |
| Desarrollo local | `http://localhost:8080` |

## Requisitos locales

- Java 21
- PostgreSQL 13+
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
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/isle_companion?stringtype=unspecified` | URL JDBC de conexión |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | Usuario de PostgreSQL |
| `SPRING_DATASOURCE_PASSWORD` | `admin` | Contraseña |
| `JWT_SECRET` | `dev-secret-change-in-production-must-be-256-bits` | Clave HMAC-SHA256 (mínimo 32 chars) |
| `JWT_EXPIRATION_DAYS` | `30` | Duración del token JWT |
| `STEAM_API_KEY` | *(vacío)* | API key de Steam — necesaria para nombre y avatar. Obtener en https://steamcommunity.com/dev/apikey |
| `APP_BASE_URL` | `http://localhost:8080` | URL pública del backend (usada en el callback de Steam OpenID) |
| `SUPER_ADMIN_STEAM_ID` | `76561199415486620` | Steam ID del super-administrador de la plataforma |
| `ADMIN_URL` | `http://localhost:5173` | URL del admin panel (para CORS y redirect post-login) |

> **Seguridad:** `STEAM_API_KEY` y `JWT_SECRET` nunca deben commitearse. Usar siempre variables de entorno.

El parámetro `stringtype=unspecified` en la URL JDBC es necesario para que el driver haga cast implícito de strings a tipos enum nativos de PostgreSQL.

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

---

## Deploy en Railway

### Estructura en Railway

El proyecto usa un único proyecto Railway con dos servicios:
- **PostgreSQL** — base de datos gestionada
- **Backend** — servicio Spring Boot conectado al mismo proyecto

### Variables de entorno en Railway

Configurar en el servicio de backend (Railway → Backend → Variables):

| Variable | Valor |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<host>:<port>/<db>?stringtype=unspecified` |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la BD |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de la BD |
| `JWT_SECRET` | Cadena aleatoria de 32+ caracteres |
| `STEAM_API_KEY` | Tu API key de Steam |
| `APP_BASE_URL` | `https://the-isle-companion-production.up.railway.app` |
| `SUPER_ADMIN_STEAM_ID` | Tu Steam ID |
| `ADMIN_URL` | `https://inigoo96.github.io/the-isle-companion` |

> Los datos de conexión de PostgreSQL se obtienen desde Railway → Postgres → Connect → Public URL. Separar en URL, usuario y contraseña (Railway no soporta bien la URL completa con credenciales en la variable `${{Postgres.DATABASE_URL}}`).

### Builder

Railway usa **Railpack** (no Nixpack ni Dockerfile). Detecta automáticamente el proyecto Maven y ejecuta `mvn package`.

### Healthcheck

Railway usa `/actuator/health` para verificar que el servicio está levantado antes de dar el deployment por exitoso.

### Flyway en producción

Las migraciones se aplican automáticamente al arrancar. No es necesario ningún paso manual para crear las tablas — Spring Boot + Flyway las crea la primera vez.

---

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
- `admin` → redirige a `{ADMIN_URL}/auth/callback?token=JWT`

### Endpoints protegidos (requieren `Authorization: Bearer <JWT>`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/me` | Perfil del usuario autenticado (`steamId`, `displayName`, `avatarUrl`, `status`, `superAdmin`) |
| GET | `/servers/mine` | Servidores del admin autenticado (con dinos permitidos) |
| POST | `/servers` | Crear servidor (requiere status `ACTIVE`) |
| PUT | `/servers/{slug}` | Actualizar servidor (requiere status `ACTIVE` + ser propietario) |
| DELETE | `/servers/{slug}` | Eliminar servidor (requiere status `ACTIVE` + ser propietario) |

### Endpoints de super-admin (solo `SUPER_ADMIN_STEAM_ID`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/accounts` | Lista todos los admins registrados con sus servers y estadísticas |
| PUT | `/admin/accounts/{steamId}/status` | Cambia el estado de una cuenta |

Body del PUT:
```json
{ "status": "ACTIVE" }
```

Estados válidos: `PENDING` · `ACTIVE` · `BANNED`

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

> **Optimización:** Si `allowedDinoIds` está vacío, es `null`, o contiene todos los dinos del catálogo, no se guardan filas en `server_allowed_dinos`. Cero filas = todos los dinos permitidos. Al leer, si no hay filas, se devuelve el catálogo completo.

---

## Sistema de cuentas y autorización

### Estados de cuenta (`AccountStatus`)

| Estado | Descripción | Puede crear/editar servidores |
|---|---|---|
| `PENDING` | Recién registrado | No — bloqueado en el panel |
| `ACTIVE` | Aprobado por super-admin | Sí |
| `BANNED` | Baneado | No |

El super-admin (identificado por `SUPER_ADMIN_STEAM_ID`) está exento de la comprobación de estado y siempre puede operar.

### CORS

El backend permite solicitudes de origen `http://localhost:5173` (desarrollo) y el origen derivado de `ADMIN_URL` (producción). El origen se extrae automáticamente como `scheme://host` del valor de `ADMIN_URL`.

---

## Autenticación JWT

- Algoritmo: HS256
- Expiración: 30 días (configurable con `JWT_EXPIRATION_DAYS`)
- Payload: `sub` = Steam ID, `displayName` = nombre de Steam
- Header: `Authorization: Bearer <token>`

---

## Migraciones (Flyway)

Las migraciones están en `src/main/resources/db/migration/`. Se aplican automáticamente al arrancar.

| Archivo | Descripción |
|---|---|
| `V1__initial_schema.sql` | Esquema base: accounts, servers, dinos, mutations, zones, prime_tasks, server_allowed_dinos |
| `V2__add_zones.sql` | Tabla de zonas del mapa |
| `V3__account_status.sql` | Columna `status` en accounts (`PENDING`/`ACTIVE`/`BANNED`) |

---

## Próximos pasos

- [ ] Sistema de anuncios de servidor (el admin publica mensajes, el overlay los muestra)
- [ ] Estado del servidor + IP de conexión directa
- [ ] Eventos programados
- [ ] Notificaciones Discord webhook (aprobaciones, baneos)
