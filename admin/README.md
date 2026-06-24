# The Isle Companion — Admin Panel

Panel de administración React + Vite para que los admins de servidor configuren su instancia en la plataforma multi-tenant.

## Requisitos

- Node.js 18+
- Backend corriendo en `http://localhost:8080`

## Levantar en desarrollo

```bash
cd admin
npm install
npm run dev
```

Abre `http://localhost:5173`. Las peticiones a `/api/*` se proxian automáticamente al backend.

## Autenticación

Login mediante Steam OpenID 2.0. Se abre un popup de Steam; al autenticar el popup se cierra y la sesión queda activa en la pestaña principal. El token JWT se guarda en `localStorage` con la clave `isle_admin_token`.

## Funcionalidades

| Ruta | Descripción |
|---|---|
| `/login` | Login con Steam |
| `/` | Dashboard — lista de servidores del admin |
| `/servers/new` | Crear nuevo servidor |
| `/servers/:slug` | Editar / eliminar servidor |

### Formulario de servidor

- **Nombre** y **slug** (identificador único, solo minúsculas/números/guiones)
- **Growth Multiplier** — multiplicador de crecimiento del servidor
- **Rules** — descripción o reglas en texto libre
- **Dinos permitidos** — selector de chips con los 20 dinosaurios del catálogo (vacío = todos permitidos)

## Variables de entorno (Vite)

No se necesitan variables de entorno para desarrollo. El proxy de Vite apunta al backend local.

## Build de producción

```bash
npm run build
```

Genera la carpeta `dist/` lista para desplegar en cualquier servidor estático.
