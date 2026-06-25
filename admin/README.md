# The Isle Companion — Admin Panel

Panel de administración React + Vite para que los admins de servidor configuren su instancia en la plataforma multi-tenant.

## URLs de producción

| Entorno | URL |
|---|---|
| Producción (GitHub Pages) | `https://inigoo96.github.io/the-isle-companion/` |
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
VITE_BASE_PATH=/the-isle-companion/ \
npm run build
```

Genera la carpeta `dist/` lista para subir a GitHub Pages.

## Variables de entorno (Vite)

| Variable | Desarrollo | Producción |
|---|---|---|
| `VITE_API_BASE` | *(no necesaria — usa proxy)* | URL pública del backend Railway |
| `VITE_BASE_PATH` | *(no necesaria — `/`)* | `/the-isle-companion/` |

En producción estas variables se inyectan automáticamente desde los **GitHub Actions secrets** (ver `.github/workflows/deploy-admin.yml`).

## CI/CD — GitHub Actions

Cada push a `master` que modifique archivos en `admin/` o el propio workflow lanza el pipeline automáticamente:

1. Checkout del código
2. `npm ci` + `npm run build` con las variables de entorno de producción
3. Deploy a GitHub Pages via `actions/deploy-pages`

El secret `VITE_API_BASE` debe estar configurado en **GitHub → Settings → Secrets → Actions** del repositorio.

## Autenticación

Login mediante Steam OpenID 2.0. Se abre un popup de Steam; al autenticar, el backend redirige el popup a `/auth/callback?token=JWT`, la app guarda el token y cierra el popup. La sesión queda activa en la pestaña principal.

- Token JWT guardado en `localStorage` con clave `isle_admin_token`
- Expiración: 30 días

### Flujo completo de login (producción)

```
1. Usuario abre popup → Railway /auth/steam?source=admin
2. Steam autentica al usuario
3. Callback → Railway /auth/steam/callback
4. Backend emite JWT → redirige popup a GitHub Pages /auth/callback?token=JWT
5. AuthCallback.jsx guarda token, llama /me, cierra popup
6. Login.jsx recibe postMessage → redirige a dashboard
```

## Rutas

| Ruta | Descripción | Protección |
|---|---|---|
| `/login` | Login con Steam | Pública |
| `/auth/callback` | Callback del popup de Steam | Pública |
| `/pending` | Pantalla de cuenta pendiente/baneada | Autenticado |
| `/` | Dashboard — lista de servidores | Activo |
| `/servers/new` | Crear nuevo servidor | Activo |
| `/servers/:slug` | Editar / eliminar servidor | Activo + propietario |
| `/super-admin` | Gestión de cuentas de admin | Solo super-admin |

### Estados de cuenta

| Estado | Descripción | Puede gestionar servidores |
|---|---|---|
| `PENDING` | Recién registrado, esperando aprobación | No → ve `/pending` |
| `ACTIVE` | Aprobado por el super-admin | Sí |
| `BANNED` | Baneado | No → ve `/pending` |

El super-admin (Steam ID hardcodeado en el backend) puede aprobar, banear y desbanear cuentas desde `/super-admin`.

## Formulario de servidor

- **Nombre** y **slug** (identificador único, solo minúsculas/números/guiones, inmutable tras crear)
- **Growth Multiplier** — multiplicador de crecimiento del servidor
- **Rules** — descripción o reglas en texto libre
- **Dinos permitidos** — selector de chips con los dinosaurios del catálogo

> **Optimización:** Si no se selecciona ningún dino (o se seleccionan todos), no se guardan filas en `server_allowed_dinos`. Cero filas = todos los dinos permitidos.

## UX — Confirmación de logout

Tanto el Layout (sidebar) como la página Pending muestran un flujo de confirmación en dos pasos al hacer logout: el botón inicial se reemplaza por "Log out? / Yes / Cancel" inline, sin modales ni alerts del navegador.

## Routing en GitHub Pages (SPA)

GitHub Pages no soporta rutas de cliente directamente. La solución implementada:

1. `public/404.html` — encoda la ruta solicitada como query string y redirige al index
2. `index.html` — script que restaura la ruta original antes de que React monte
3. `BrowserRouter` con `basename={import.meta.env.BASE_URL}` para el subpath `/the-isle-companion/`
