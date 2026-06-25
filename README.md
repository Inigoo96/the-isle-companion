# Gondwa

Overlay de escritorio + plataforma para **The Isle** que proporciona herramientas de información y seguimiento para mejorar tu experiencia de juego. *(Anteriormente "The Isle Companion"; el slug del repo se mantiene por ahora.)*

![Electron](https://img.shields.io/badge/Electron-35.7.5-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=nodedotjs&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.5-6DB33F?logo=springboot&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Arquitectura del proyecto

```
gondwa/                          ← monorepo (repo: github.com/Inigoo96/gondwa)
├── overlay/                      # App Electron (overlay de escritorio)
├── backend/                      # API Spring Boot + PostgreSQL (Railway)
├── admin/                        # Panel de administración React + Vite (GitHub Pages)
└── .github/workflows/            # CI/CD — deploy automático del admin panel
```

## Despliegue en producción

| Componente | Plataforma | URL |
|---|---|---|
| Admin Panel | GitHub Pages | `https://inigoo96.github.io/gondwa/` |
| Backend API | Railway | `https://the-isle-companion-production.up.railway.app` |
| Base de datos | Railway PostgreSQL | (interna al proyecto Railway) |

El flujo de CI/CD es totalmente automático: cada push a `master` que toque archivos de `admin/` lanza un GitHub Actions workflow que construye y despliega en GitHub Pages. El backend se redespliega en Railway automáticamente si el repo de GitHub está conectado.

## Funcionalidades del overlay

### Minimapa con posición del jugador
Copia tus coordenadas in-game al clipboard y la app detecta tu posición automáticamente, mostrándola sobre un mapa con grid y puntos cardinales.

### Mutation Builder
Guía de las 16 mutaciones recomendadas para cada dinosaurio, ordenadas de la 1ª a la 16ª. Selector por nombre y tier.

### Patrol Zone Tracker
Checklist para llevar el seguimiento de las zonas completadas: MZ, Sanctuaries, Perfect Diet y Patrol Zones. Barra de progreso visual.

### Dino Stats y Growth Timer
Stats base de cada dinosaurio (HP, damage, speed, stamina) y calculadora de crecimiento con countdown por stage. El multiplicador de crecimiento se toma automáticamente del servidor seleccionado.

### Selector de servidor
Dropdown en el overlay que carga los servidores disponibles desde el backend. Al seleccionar uno, el multiplicador de crecimiento se aplica automáticamente a la calculadora y el selector de dino se filtra para mostrar solo las especies permitidas. La selección persiste entre sesiones via localStorage.

## Requisitos (overlay local)

- Windows 10/11
- [Node.js](https://nodejs.org/) v18+
- The Isle en modo **Borderless Windowed** (no fullscreen exclusivo)

## Instalación

```bash
git clone https://github.com/Inigoo96/gondwa.git
cd gondwa/overlay
npm install
```

Si Electron no se instala correctamente, ejecuta manualmente:

```bash
node node_modules/electron/install.js
```

## Uso

```bash
npm start
```

Para modo desarrollo (con DevTools):

```bash
npm run dev
```

## Distribución (Windows)

Genera instalador NSIS + portable en la carpeta `dist/`:

```bash
npm run dist
```

Para solo verificar que el build es correcto sin generar instalador (más rápido):

```bash
npm run dist:dir
```

El instalador permite elegir la carpeta de instalación y crea acceso directo en el escritorio.

### Controles

| Tecla | Acción |
|-------|--------|
| **F9** | Ocultar / mostrar el overlay |
| **F10** | Activar / desactivar modo click-through |

### Cómo funciona el mapa

1. Abre The Isle en modo Borderless Windowed.
2. Ejecuta Gondwa.
3. En el juego, copia tus coordenadas al clipboard.
4. La app las detecta automáticamente y muestra tu posición en el minimapa.
5. Pulsa **F10** para que los clicks pasen al juego mientras el overlay está visible.

## Dinosaurios disponibles (v0.5.0)

**Carnívoros (10):** Tyrannosaurus, Deinosuchus, Allosaurus, Ceratosaurus, Carnotaurus, Dilophosaurus, Omniraptor, Herrerasaurus, Pteranodon, Troodon

**Herbívoros (8):** Triceratops, Stegosaurus, Diabloceratops, Maiasaura, Tenontosaurus, Pachycephalosaurus, Dryosaurus, Hypsilophodon

**Omnívoros (2):** Gallimimus, Beipiaosaurus

> **Nota:** Los stats son aproximados y necesitan verificación con datos reales del juego.

## Roadmap

### Completado
- [x] Imagen real del mapa Gateway como fondo del minimapa
- [x] Calibración exacta de coordenadas del mapa
- [x] Mutation Builder con guía de 16 mutaciones
- [x] Prime List (Patrol Zone Tracker) con progreso visual
- [x] Dino Stats (HP, Damage, Speed)
- [x] Zonas interactivas en el mapa (MZ, Sanctuaries, Patrol Zones)
- [x] Selector global de especie visible en todas las pestañas
- [x] Growth Timer con countdown por stage y multiplicador de servidor
- [x] 20 dinosaurios añadidos (10 carnívoros, 8 herbívoros, 2 omnívoros)
- [x] Backend Spring Boot multi-tenant con seed automático de catálogos
- [x] Autenticación Steam OpenID 2.0 + JWT (overlay)
- [x] Panel admin React + Vite: crear, editar y eliminar servidores
- [x] Selector de servidor en el overlay (multiplicador automático + filtro de dinos permitidos)
- [x] Display name de Steam en lugar del Steam ID
- [x] Deploy del admin panel en GitHub Pages con CI/CD (GitHub Actions)
- [x] Deploy del backend y base de datos en Railway
- [x] Overlay conectado al backend de Railway en producción (CSP, CORS, encoding UTF-8)
- [x] Logout con confirmación en overlay y admin panel
- [x] Dashboard del admin panel rediseñado con stats y tarjetas elaboradas
- [x] Optimización: 0 filas en server_allowed_dinos = todos los dinos permitidos

### Completado — Panel admin 100% Discord (v0.6.0)
> Identidad del panel separada del overlay: el overlay sigue con Steam; el panel es 100% Discord.
- [x] Esquema: tabla `admins` (Discord), `servers.owner` → admin, tabla `server_members`
- [x] Login del panel por Discord OAuth2 + JWT con identidad dual (`type=admin`/`type=player`)
- [x] Verificación de propiedad del guild de Discord en el alta de servidor + cache de guilds elegibles
- [x] Moderación **a nivel de admin** (la persona): aprobar/rechazar/banear con máquina de estados; un admin `pending` puede crear pero no es público hasta aprobarlo; el público solo ve servers de admins `accepted`
- [x] Frontend: botón "Login with Discord", alta con selector de guild, vista de moderación de admins
- [x] Hardening de seguridad: secretos solo por env (Railway); el backend no arranca con el `JWT_SECRET` de dev

### Pendiente — Corrección de datos de dinosaurios
> **IMPORTANTE:** Los datos actuales de dinos.json necesitan revisión.
- [ ] **HP**: En The Isle, HP = peso del dino en kg (ej: Rex ~12250, Trike ~12500, Croc ~13500)
- [ ] **Damage**: Verificar valores de daño base con datos reales
- [ ] **Speed**: Verificar velocidades (las fuentes online no coinciden)
- [ ] **Growth times**: Verificar con gameplay real
- [ ] **Mutations**: Solo 5 de 20 dinos tienen lista de mutaciones recomendadas

### Próximas funcionalidades
- [ ] **Co-admins**: flujo de invitaciones para varios admins por server (la tabla `server_members` ya está modelada)
- [ ] **Claim de servidores desde BattleMetrics**: buscar/reclamar un server existente
- [ ] Anuncios de servidor (el admin publica mensajes, el overlay los muestra)
- [ ] Estado del servidor + IP de conexión directa
- [ ] Eventos programados (visible en el overlay como recordatorio)
- [ ] Página pública del servidor (URL shareable para Discord)
- [ ] Sistema de notificaciones Discord webhook (cuando se aprueban/banean admins)

### Fase 2 — Persistencia e historial
- [ ] Persistencia de datos entre sesiones (patrol zones, último dino, posición)
- [ ] Historial de runs/vidas pasadas (dino, mutaciones conseguidas, causa de muerte)

### Fase 3 — Mapa avanzado
- [ ] Sistema de tiles para carga eficiente del mapa por zoom
- [ ] Capas con filtros toggle: Sanctuaries, MZ, ríos, patrol zones
- [ ] Historial de posiciones (trail/rastro en el mapa)

### Fase 4 — Modo Pack (multijugador)
- [ ] Servidor WebSocket ligero para sincronización de posiciones
- [ ] Sistema de salas con código (ej: PACK-77X)
- [ ] Compartir posición en tiempo real con amigos en el mapa

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 Íñigo
