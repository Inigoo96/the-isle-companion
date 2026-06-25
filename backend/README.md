# Gondwa — Backend

Spring Boot backend para la plataforma multi-tenant de Gondwa (companion para The Isle).

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
| `SUPER_ADMIN_STEAM_ID` | *(vacío)* | Steam ID del super-administrador (overlay/`/me`; ya **no** gatea la gestión de servidores). Va por env, no hardcodeado |
| `ADMIN_URL` | `http://localhost:5173` | URL del admin panel (para CORS y redirect post-login) |
| `DISCORD_CLIENT_ID` | *(vacío)* | Client ID de la app de Discord (panel) |
| `DISCORD_CLIENT_SECRET` | *(vacío)* | Client Secret de la app de Discord |
| `DISCORD_REDIRECT_URI` | `http://localhost:8080/auth/discord/callback` | URL de callback registrada en la app de Discord |
| `PLATFORM_ADMINS` | *(vacío)* | Discord user ids con permisos de moderación de plataforma (separados por coma) |
| `APP_ALLOW_INSECURE_DEV_SECRET` | `false` | **Solo dev local:** permite arrancar con el `JWT_SECRET` de dev. En producción debe quedar `false` |

> **Seguridad:** `STEAM_API_KEY`, `DISCORD_CLIENT_SECRET` y `JWT_SECRET` nunca deben commitearse. Usar siempre variables de entorno.
>
> **`JWT_SECRET` es obligatorio en producción.** El backend **se niega a arrancar** si detecta que está usando el `JWT_SECRET` de dev (placeholder commiteado) y `APP_ALLOW_INSECURE_DEV_SECRET` no es `true`. Así producción nunca firma tokens con una clave conocida. Para correr en local: exporta `APP_ALLOW_INSECURE_DEV_SECRET=true` o, mejor, pon tu propio `JWT_SECRET`.

### Configurar la app de Discord (login del panel)

El panel de administración se autentica **100% por Discord** (el overlay sigue con Steam, intacto). Para activarlo:

1. Crear una aplicación en [discord.com/developers/applications](https://discord.com/developers/applications).
2. En **OAuth2 → Redirects**, añadir la URL de callback:
   - Local: `http://localhost:8080/auth/discord/callback`
   - Producción: `https://the-isle-companion-production.up.railway.app/auth/discord/callback`
3. Copiar **Client ID** y **Client Secret** a las variables `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`, y poner `DISCORD_REDIRECT_URI` con la URL de callback correspondiente.
4. Scopes usados: `identify guilds` (el `guilds` se usará en el alta de servidor para verificar propiedad del guild).

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
| `ADMIN_URL` | `https://inigoo96.github.io/gondwa` |
| `DISCORD_CLIENT_ID` | Client ID de tu app de Discord |
| `DISCORD_CLIENT_SECRET` | Client Secret de tu app de Discord |
| `DISCORD_REDIRECT_URI` | `https://the-isle-companion-production.up.railway.app/auth/discord/callback` |
| `PLATFORM_ADMINS` | Tu Discord user id (para moderar). Varios → separados por coma |

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

### Autenticación Steam OpenID (overlay/jugadores)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/steam?source=overlay\|admin` | Inicia el flujo OpenID — redirige a Steam |
| GET | `/auth/steam/callback` | Callback de Steam — verifica, crea/actualiza cuenta, emite JWT (`type=player`) |
| GET | `/auth/done` | Página de confirmación para el overlay Electron |

El parámetro `source` controla el destino tras el login:
- `overlay` → redirige a `/auth/done` (Electron intercepta la URL y extrae el token)
- `admin` → *(legacy)* redirige a `{ADMIN_URL}/auth/callback?token=JWT`. El panel ya **no** usa este flujo; usa Discord (abajo).

### Autenticación Discord OAuth2 (panel de administración)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/auth/discord` | Inicia OAuth2 — redirige a Discord con scopes `identify guilds` y `state` firmado (anti-CSRF) |
| GET | `/auth/discord/callback` | Callback — valida el `state`, canjea el `code`, lee `/users/@me`, crea/actualiza el `admin` y emite JWT del panel (`type=admin`, `sub=discord_user_id`). Redirige a `{ADMIN_URL}/auth/callback?token=JWT` |

El token de Discord se usa solo dentro del callback y **nunca se persiste**. Son dos identidades separadas: `accounts` (Steam, jugadores) y `admins` (Discord, panel).

### Endpoints protegidos (requieren `Authorization: Bearer <JWT>`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/me` | `player` | Perfil Steam del jugador (`steamId`, `displayName`, `avatarUrl`, `status`, `superAdmin`) |
| GET | `/admin/me` | `admin` | Perfil del admin Discord (`discordUserId`, `username`, `avatarUrl`, `status`, `platformAdmin`) |
| GET | `/admin/guilds` | `admin` | Guilds de Discord donde el admin es owner/ADMINISTRATOR (cache del login) |
| GET | `/servers/mine` | `admin` | Servidores cuyo `owner` es el admin Discord autenticado |
| POST | `/servers` | `admin` | Crear servidor — requiere `discordGuildId` **verificado** en backend |
| PUT | `/servers/{slug}` | `admin` | Actualizar servidor (debe ser el `owner`) |
| DELETE | `/servers/{slug}` | `admin` | Eliminar servidor (debe ser el `owner`) |

### Moderación de plataforma (solo `PLATFORM_ADMINS`)

Se modera el **ADMIN** (la identidad Discord), no cada servidor. Un admin entra `pending`; el admin de plataforma lo aprueba/rechaza/banea.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/admin/admins?status=pending` | Lista admins por estado (`pending`/`accepted`/`rejected`/`banned`) con su nº de servers |
| POST | `/admin/admins/{id}/approve` | `accepted` + `reviewed_at`/`reviewed_by` |
| POST | `/admin/admins/{id}/reject` | `rejected` |
| POST | `/admin/admins/{id}/ban` | `banned` |

Gateado por `ROLE_ADMIN` y, dentro, por la allowlist `PLATFORM_ADMINS` (403 si no estás). Los admins **nunca se borran**; solo cambian de estado. El listado público (`GET /servers`, `GET /servers/{slug}`) solo devuelve servidores de admins `accepted`.

**Máquina de estados del admin** (transiciones validadas en backend; ilegal → `409`):

```
pending  → accepted | rejected
rejected → accepted            (re-aprobar)
accepted → banned              (retirar acceso)
banned   → accepted            (des-banear)
```

- **Auto-accept:** un admin de `PLATFORM_ADMINS` entra/se mantiene `accepted` (no se modera a sí mismo).
- **Admin `pending`:** puede crear/configurar servidores, pero no son públicos hasta que se le apruebe.
- **Acceso revocado:** un admin `rejected` o `banned` no puede crear servidores (`403`); se restablece si la plataforma le re-aprueba.

> El rol se deriva del claim `type` del JWT: `ROLE_ADMIN` (panel Discord) o `ROLE_PLAYER` (overlay Steam). La verificación de propiedad (`owner`) y la del guild se hacen **siempre en el backend**, no basta con esconderlo en React.

> **Verificación de guild:** en el login se leen los guilds del admin (`/users/@me/guilds`), se filtran los que es owner/ADMINISTRATOR y se cachean en memoria (TTL 30 min). Al crear un servidor, el `discordGuildId` enviado debe estar en ese set (si no → 403). El token de Discord nunca se persiste.

> El antiguo super-admin por Steam (`/admin/accounts`) fue **eliminado**.

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

## Identidad: dos sistemas separados

| Tabla | Identidad | Login | Quién | Token |
|---|---|---|---|---|
| `accounts` | Steam64 | Steam OpenID | Jugadores del overlay | JWT `type=player`, `sub=steamId` |
| `admins` | Discord user id | Discord OAuth2 | Administradores del panel | JWT `type=admin`, `sub=discordUserId` |

Las dos identidades **nunca se mezclan**. El `owner` de un servidor es un `admin` (Discord). El antiguo gating por `AccountStatus` para gestionar servidores fue eliminado; la columna `accounts.status` se mantiene en BD pero ya no condiciona el panel.

### Estado de admin (`AdminStatus`)

La moderación es sobre el **admin** (la persona/identidad Discord), no sobre cada servidor. Los servidores son solo config; su visibilidad pública depende del estado de **su** admin.

| Estado | Descripción | Sus servers visibles en público |
|---|---|---|
| `pending` | Recién registrado, a la espera de revisión | No |
| `accepted` | Aprobado por el admin de plataforma | Sí |
| `rejected` | Rechazado (no puede crear servers) | No |
| `banned` | Baneado (no puede crear servers) | No |

> Un admin `pending` puede crear/configurar sus servidores, pero no son públicos hasta que se le aprueba. El admin de plataforma (`PLATFORM_ADMINS`) es siempre `accepted`.

### CORS

El backend permite solicitudes de origen `http://localhost:5173` (desarrollo) y el origen derivado de `ADMIN_URL` (producción). El origen se extrae automáticamente como `scheme://host` del valor de `ADMIN_URL`.

---

## Autenticación JWT

- Algoritmo: HS256
- Expiración: 30 días (configurable con `JWT_EXPIRATION_DAYS`)
- Claim `type` distingue las dos identidades:
  - `player` (overlay): `sub` = Steam ID, `displayName` = nombre de Steam
  - `admin` (panel): `sub` = Discord user id, `username` = nombre de Discord
- Tokens antiguos sin `type` se tratan como `player`.
- El `state` de OAuth2 es un JWT firmado aparte, de vida corta (10 min), anti-CSRF.
- Header: `Authorization: Bearer <token>`

---

## Migraciones (Flyway)

Las migraciones están en `src/main/resources/db/migration/`. Se aplican automáticamente al arrancar.

| Archivo | Descripción |
|---|---|
| `V1__initial_schema.sql` | Esquema base: accounts, servers, dinos, mutations, zones, prime_tasks, server_allowed_dinos |
| `V2__add_zones.sql` | Tabla de zonas del mapa |
| `V3__account_status.sql` | Columna `status` en accounts (`PENDING`/`ACTIVE`/`BANNED`) |
| `V4__discord_admin_identity.sql` | Tabla `admins` (Discord); `servers.owner_id` → `admins`; `discord_guild_*` en `servers`; tabla `server_members` |
| `V5__admin_moderation.sql` | La moderación pasa de server a **admin**: `admins` gana `status`/`reviewed_*`; `servers` pierde su `status`/`reviewed_*` (vuelven a ser solo config) |

---

## Migración a panel Discord — estado

| Checkpoint | Contenido | Estado |
|---|---|---|
| A | Esquema V4 + entidades/repos/DTOs + baja del super-admin Steam | ✅ hecho |
| B | Login Discord OAuth2 del panel (token `type=admin`, roles, `/auth/discord`) | ✅ hecho |
| C | Verificación de guild en el alta + cache de guilds elegibles + enforcement de propiedad | ✅ hecho |
| D+E | Moderación **de admins** (`/admin/admins`, approve/reject/ban; máquina de estados; público = servers de admins accepted) + frontend Discord completo | ✅ hecho |

## Próximos pasos

- [ ] Sistema de anuncios de servidor (el admin publica mensajes, el overlay los muestra)
- [ ] Estado del servidor + IP de conexión directa
- [ ] Eventos programados
- [ ] Notificaciones Discord webhook (aprobaciones, baneos)
