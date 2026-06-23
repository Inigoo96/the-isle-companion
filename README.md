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

### Dino Stats y HP Tracker
Stats base de cada dinosaurio (HP, damage, speed, stamina) y un slider manual de HP con barra de color que cambia segun el nivel de vida.

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
the-isle-companion/
├── src/
│   ├── main.js              # Proceso principal Electron (ventana, clipboard, atajos)
│   ├── preload.js            # Puente seguro Node.js <-> UI
│   └── renderer/
│       ├── index.html         # Interfaz (tabs, mapa, formularios)
│       ├── styles.css         # Tema oscuro transparente
│       └── app.js             # Logica UI (mapa canvas, dinos, patrol tracker)
├── data/
│   └── dinos.json             # Base de datos de dinosaurios, stats y mutations
├── assets/
│   └── maps/                  # Imagenes de mapas (pendiente)
├── DOCUMENTACION.txt          # Documentacion tecnica detallada
└── package.json
```

## Dinosaurios disponibles (v0.1.0)

**Carnivoros:** Carnotaurus, Utahraptor, Allosaurus, Ceratosaurus

**Herbivoros:** Stegosaurus, Tenontosaurus

> Los stats son aproximados y se iran actualizando. Faltan muchos dinos por añadir.

## Roadmap

### Completado
- [x] Imagen real del mapa Gateway como fondo del minimapa
- [x] Calibracion exacta de coordenadas del mapa
- [x] Mutation Builder con guia de 16 mutaciones
- [x] Prime List (Patrol Zone Tracker) con progreso visual
- [x] Dino Stats y HP Tracker
- [x] Zonas interactivas en el mapa (MZ, Sanctuaries, Patrol Zones)

### Fase 1 — Selector de especie + Growth Timer
- [ ] Selector global de especie: al elegir dino, adaptar Prime List, Stats y Timer
- [ ] Calculadora de crecimiento: countdown por stage (Hatchling → Juvenile → Sub-Adult → Adult)
- [ ] Tiempos de las 18+ especies jugables con soporte para multiplicador de servidor
- [ ] Guia de dieta por especie y stage de crecimiento

### Fase 2 — Datos completos y persistencia
- [ ] Todos los dinosaurios del juego con stats verificados (28 especies)
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

MIT
