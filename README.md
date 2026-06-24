# The Isle Companion

Overlay de escritorio para **The Isle** que proporciona herramientas de informacion y seguimiento para mejorar tu experiencia de juego.

![Electron](https://img.shields.io/badge/Electron-35.7.5-47848F?logo=electron&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=nodedotjs&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Funcionalidades

### Minimapa con posicion del jugador
Copia tus coordenadas in-game al clipboard y la app detecta tu posicion automaticamente, mostrandola sobre un mapa con grid y puntos cardinales.

### Mutation Builder
Guia de las 16 mutaciones recomendadas para cada dinosaurio, ordenadas de la 1a a la 16a. Selector por nombre y tier.

### Patrol Zone Tracker
Checklist para llevar el seguimiento de las zonas completadas: MZ, Sanctuaries, Perfect Diet y Patrol Zones. Barra de progreso visual.

### Dino Stats y Growth Timer
Stats base de cada dinosaurio (HP, damage, speed, stamina) y calculadora de crecimiento con countdown por stage. El multiplicador de crecimiento se toma automaticamente del servidor seleccionado.

### Selector de servidor
Dropdown en el overlay que carga los servidores disponibles desde el backend. Al seleccionar uno, el multiplicador de crecimiento se aplica automaticamente a la calculadora y el selector de dino se filtra para mostrar solo las especies permitidas. La seleccion persiste entre sesiones via localStorage.

## Requisitos

- Windows 10/11
- [Node.js](https://nodejs.org/) v18+
- The Isle en modo **Borderless Windowed** (no fullscreen exclusivo)

## Instalacion

```bash
git clone https://github.com/Inigoo96/the-isle-companion.git
cd the-isle-companion
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

## Distribucion (Windows)

Genera instalador NSIS + portable en la carpeta `dist/`:

```bash
npm run dist
```

Para solo verificar que el build es correcto sin generar instalador (mas rapido):

```bash
npm run dist:dir
```

El instalador permite elegir la carpeta de instalacion y crea acceso directo en el escritorio.

### Controles

| Tecla | Accion |
|-------|--------|
| **F9** | Ocultar / mostrar el overlay |
| **F10** | Activar / desactivar modo click-through |

### Como funciona el mapa

1. Abre The Isle en modo Borderless Windowed.
2. Ejecuta The Isle Companion.
3. En el juego, copia tus coordenadas al clipboard.
4. La app las detecta automaticamente y muestra tu posicion en el minimapa.
5. Pulsa **F10** para que los clicks pasen al juego mientras el overlay esta visible.

## Estructura del proyecto

```
the-isle-companion/               ← monorepo
├── overlay/                      # App Electron (overlay de escritorio)
│   ├── src/
│   │   ├── main.js               # Proceso principal (ventana, clipboard, atajos, auth Steam)
│   │   ├── preload.js            # Puente seguro Node.js <-> UI
│   │   └── renderer/
│   │       ├── index.html        # Interfaz (tabs, mapa, formularios)
│   │       ├── styles.css        # Tema oscuro transparente
│   │       └── app.js            # Logica UI + login Steam
│   └── package.json
├── backend/                      # API Spring Boot (multi-tenant)
│   ├── src/main/java/…           # Entidades, repos, servicios, controladores
│   ├── src/main/resources/
│   │   ├── db/migration/         # Migraciones Flyway (V1, V2)
│   │   └── seed/                 # JSONs para seed de catalogos
│   └── README.md
├── admin/                        # Panel de administracion React + Vite
│   ├── src/
│   │   ├── pages/                # Login, Dashboard, ServerForm, AuthCallback
│   │   ├── components/           # Layout
│   │   ├── api.js                # Fetch wrapper con Bearer token
│   │   └── auth.js               # Helpers de sesion (localStorage)
│   └── README.md
└── README.md
```

## Dinosaurios disponibles (v0.2.0)

**Carnivoros (10):** Tyrannosaurus, Deinosuchus, Allosaurus, Ceratosaurus, Carnotaurus, Dilophosaurus, Omniraptor, Herrerasaurus, Pteranodon, Troodon

**Herbivoros (8):** Triceratops, Stegosaurus, Diabloceratops, Maiasaura, Tenontosaurus, Pachycephalosaurus, Dryosaurus, Hypsilophodon

**Omnivoros (2):** Gallimimus, Beipiaosaurus

> **Nota:** Los stats son aproximados y necesitan verificacion con datos reales del juego. Ver seccion "Pendiente" en el Roadmap.

## Roadmap

### Completado
- [x] Imagen real del mapa Gateway como fondo del minimapa
- [x] Calibracion exacta de coordenadas del mapa
- [x] Mutation Builder con guia de 16 mutaciones
- [x] Prime List (Patrol Zone Tracker) con progreso visual
- [x] Dino Stats (HP, Damage, Speed)
- [x] Zonas interactivas en el mapa (MZ, Sanctuaries, Patrol Zones)
- [x] Selector global de especie visible en todas las pestañas
- [x] Growth Timer con countdown por stage y multiplicador de servidor
- [x] 20 dinosaurios añadidos (10 carnivoros, 8 herbivoros, 2 omnivoros)
- [x] Eliminado HP Tracker (no accesible desde cliente)
- [x] Backend Spring Boot multi-tenant con seed automatico de catalogos
- [x] Autenticacion Steam OpenID 2.0 + JWT (overlay y admin panel)
- [x] Panel admin React + Vite: crear, editar y eliminar servidores
- [x] Selector de servidor en el overlay (multiplicador automatico + filtro de dinos permitidos)
- [x] Display name de Steam en lugar del Steam ID (actualizado automaticamente al arrancar)

### Pendiente — Correccion de datos de dinosaurios
> **IMPORTANTE:** Los datos actuales de dinos.json necesitan revision. Las fuentes online (XGamingServer, Isle Helper, evrimaquickguide) tienen datos contradictorios entre si. Hay que verificar con datos reales del juego:
- [ ] **HP**: En The Isle, HP = peso del dino en kg. Los valores actuales son incorrectos para muchos dinos (ej: Rex deberia ser ~12250, Trike ~12500, Croc ~13500, Troodon ~82, Dilo ~997)
- [ ] **Damage**: Verificar valores de daño base de cada dino con datos reales
- [ ] **Speed**: Verificar velocidades — las fuentes online no coinciden entre si
- [ ] **Growth times**: Algunos timers no son correctos — las fuentes dan tiempos muy diferentes (ej: Rex 220min vs 35h segun la fuente). Verificar con gameplay real
- [ ] **Quitar Bleed**: No es un stat util para el overlay, reemplazar por otro dato mas relevante
- [ ] **Mutations**: Solo 5 de los 20 dinos tienen lista de mutaciones recomendadas

### Fase 1.5 — Datos verificados + mejoras
- [ ] Verificar y corregir todos los stats con datos reales del juego
- [ ] Guia de dieta por especie y stage de crecimiento
- [ ] Completar mutaciones recomendadas para los 20 dinos

### Fase 2 — Persistencia e historial
- [ ] Persistencia de datos entre sesiones (patrol zones, ultimo dino, posicion)
- [ ] Historial de runs/vidas pasadas (dino, mutaciones conseguidas, causa de muerte)

### Fase 3 — Mapa avanzado
- [ ] Sistema de tiles (gdal2tiles) para carga eficiente del mapa por zoom
- [ ] Capas con filtros toggle: Sanctuaries, MZ, rios, patrol zones
- [ ] Historial de posiciones (trail/rastro en el mapa)
- [ ] Soporte para futuros mapas

### Fase 4 — Modo Pack (multijugador)
- [ ] Servidor WebSocket ligero para sincronizacion de posiciones
- [ ] Sistema de salas con codigo (ej: PACK-77X)
- [ ] Compartir posicion en tiempo real con amigos en el mapa
- [ ] Indicadores visuales de compañeros de pack

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 Íñigo
