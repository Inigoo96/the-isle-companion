# Gondwa — Admin Panel

Panel de administración React + Vite para que los admins de comunidad (identidad **Discord**) configuren su servidor en la plataforma multi-tenant.

## URLs de producción

| Entorno | URL |
|---|---|
| Producción (GitHub Pages) | `https://inigoo96.github.io/gondwa/` |
| Desarrollo local | `http://localhost:5173` |

## Requisitos locales

- Node.js 18+
- Backend corriendo en `http://localhost:8080`

## Levantar en desarrollo

```bash
cd admin
npm install
npm run dev
```

Abre `http://localhost:5173`. Las peticiones a `/api/*` se proxian automáticamente al backend local.

## Build de producción manual

```bash
VITE_API_BASE=https://the-isle-companion-production.up.railway.app \
VITE_BASE_PATH=/gondwa/ \
npm run build
```

Genera la carpeta `dist/` lista para subir a GitHub Pages.

## Variables de entorno (Vite)

| Variable | Desarrollo | Producción |
|---|---|---|
| `VITE_API_BASE` | *(no necesaria — usa proxy)* | URL pública del backend Railway |
| `VITE_BASE_PATH` | *(no necesaria — `/`)* | `/gondwa/` |

En producción se inyectan desde los **GitHub Actions secrets** (ver `.github/workflows/deploy-admin.yml`). El secret `VITE_API_BASE` debe estar en **GitHub → Settings → Secrets → Actions**.

## CI/CD — GitHub Actions

Cada push a `master` que modifique `admin/` o el workflow lanza el pipeline: `npm ci` + `npm run build` (con las env de producción) + deploy a GitHub Pages.

## Autenticación — Discord OAuth2

El panel se autentica **100% por Discord** (el overlay sigue con Steam, es un flujo aparte). Login mediante **redirección completa** (sin popup):

```
1. "Login with Discord" → backend /auth/discord
2. Discord muestra la pantalla de autorización (scopes: identify guilds)
3. Callback en el backend → crea/actualiza el admin, emite JWT (type=admin)
   → redirige a Pages /auth/callback?token=JWT
4. AuthCallback.jsx guarda el token y carga el perfil con /admin/me → dashboard
```

- Token JWT en `localStorage` con clave `isle_admin_token`, expiración 30 días.
- El token de Discord se usa solo en el callback del backend y **no se persiste**.

## Rutas

| Ruta | Descripción | Protección |
|---|---|---|
| `/login` | Login con Discord | Pública |
| `/auth/callback` | Callback de Discord (guarda el token) | Pública |
| `/` | Dashboard — tus servidores | Admin |
| `/servers/new` | Crear servidor (selector de guild verificado) | Admin |
| `/servers/:slug` | Editar / eliminar servidor | Admin propietario |
| `/moderation` | Aprobar / rechazar / banear admins | Solo platform admin |

## Moderación (a nivel de admin)

Se modera el **admin** (la persona/identidad Discord), no cada servidor. Estados: `pending` → `accepted`/`rejected`, `rejected` → `accepted`, `accepted` → `banned`, `banned` → `accepted`.

- Un admin nuevo entra `pending`: puede crear/configurar servidores, pero **no son públicos** hasta que se le aprueba.
- El público (overlay) solo ve servidores de admins `accepted`.
- Un admin `rejected`/`banned` no puede crear servidores.
- Los **platform admins** (allowlist `PLATFORM_ADMINS` en el backend) ven `/moderation` y operan sobre los admins.

## Formulario de servidor

- **Discord Server** — selector del **guild verificado** (eres owner o tienes ADMINISTRATOR); la propiedad se comprueba en el backend.
- **Nombre** y **slug** (único, solo minúsculas/números/guiones, inmutable tras crear)
- **Growth Multiplier** — multiplicador de crecimiento
- **Discord invite** (opcional) y **Rules** — texto libre
- **Dinos permitidos** — selector de chips del catálogo

> **Optimización:** sin dinos seleccionados (o todos) → no se guardan filas en `server_allowed_dinos`. Cero filas = todos permitidos.

## UX — Confirmación de logout

El sidebar muestra un flujo de confirmación en dos pasos inline ("Log out? / Yes / Cancel"), sin modales ni alerts.

## Routing en GitHub Pages (SPA)

1. `public/404.html` — encoda la ruta solicitada como query string y redirige al index
2. `index.html` — script que restaura la ruta original antes de que React monte
3. `BrowserRouter` con `basename={import.meta.env.BASE_URL}` para el subpath `/gondwa/`
