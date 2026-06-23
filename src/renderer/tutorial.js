const TUTORIAL_KEY = 'tic_tutorial_v1';

const STEPS = [
  {
    title: '¡Bienvenido a The Isle Companion!',
    desc: 'Un overlay de escritorio para jugar mejor en The Isle Evrima. Te explicamos todo en 2 minutos.',
    target: null,
    tab: null,
  },
  {
    title: 'Selector de dinosaurio',
    desc: 'Selecciona tu especie aquí. Las mutaciones recomendadas, stats y growth timer se adaptan automáticamente a tu dino.',
    target: '#global-dino-bar',
    tab: null,
    autoSelect: true,
  },
  {
    title: 'Mapa — tu posición en tiempo real',
    desc: 'Copia las coordenadas in-game (Alt+C por defecto). El overlay las detecta automáticamente y muestra tu posición sobre el mapa de Gateway.',
    target: '#map-container',
    tab: 'map',
  },
  {
    title: 'Capas del mapa',
    desc: 'Activa o desactiva zonas: Patrol Zones (rojo), Migration Zones (verde) y Sanctuaries (amarillo). Úsalas para planear tu ruta al Prime.',
    target: '#map-toolbar',
    tab: 'map',
  },
  {
    title: 'Prime List — el camino al Prime',
    desc: 'Completa 5 de estas 10 tareas antes del 75% de growth para desbloquear mutaciones Prime y mejor genética de nesting. Márcalas según las vayas cumpliendo.',
    target: '#prime-header',
    tab: 'prime',
  },
  {
    title: 'Mutaciones recomendadas',
    desc: 'Las 14 mejores mutaciones para tu dino, ordenadas por prioridad. Con etiquetas: Slot 2 exclusivo, situacional o desbloqueable por lifestyle.',
    target: '#mutations-list',
    tab: 'mutations',
  },
  {
    title: 'Stats por etapa de crecimiento',
    desc: 'Peso/HP, velocidad y fuerza de mordida de tu dino en cada stage: Hatchling, Juvenile, Adult y Prime.',
    target: '#stats-dino-info',
    tab: 'stats',
  },
  {
    title: 'Growth Timer',
    desc: 'Introduce el multiplicador de crecimiento del servidor y tu % actual de growth. Pulsa Start y el timer cuenta el tiempo hasta cada etapa.',
    target: '#growth-controls',
    tab: 'stats',
  },
  {
    title: 'Controles del overlay',
    desc: 'F9 oculta y muestra el overlay. F10 activa el modo click-through: los clics pasan al juego sin que el overlay interfiera.',
    target: '#titlebar',
    tab: null,
  },
  {
    title: '¡Todo listo para jugar!',
    desc: 'Selecciona tu dino, copia las coordenadas en el juego y empieza a trackear tu run. ¡Buena suerte!',
    target: null,
    tab: null,
  },
];

class Tutorial {
  constructor() {
    this.step = 0;
    this.el = null;
  }

  shouldShow() {
    return !localStorage.getItem(TUTORIAL_KEY);
  }

  start() {
    if (!this.shouldShow()) return;
    this._build();
    this._goto(0);
  }

  _build() {
    this.el = document.createElement('div');
    this.el.id = 'tut-overlay';
    this.el.innerHTML = `
      <div id="tut-backdrop"></div>
      <div id="tut-spot"></div>
      <div id="tut-card">
        <div id="tut-top">
          <span id="tut-counter"></span>
          <button id="tut-skip">Saltar guía ✕</button>
        </div>
        <h3 id="tut-title"></h3>
        <p id="tut-desc"></p>
        <div id="tut-nav">
          <button id="tut-prev" class="tut-btn tut-secondary">← Anterior</button>
          <button id="tut-next" class="tut-btn tut-primary">Siguiente →</button>
        </div>
      </div>
    `;
    document.body.appendChild(this.el);

    document.getElementById('tut-skip').onclick = () => this._finish();
    document.getElementById('tut-prev').onclick = () => this._goto(this.step - 1);
    document.getElementById('tut-next').onclick = () => {
      this.step < STEPS.length - 1 ? this._goto(this.step + 1) : this._finish();
    };
  }

  _goto(index) {
    this.step = index;
    const s = STEPS[index];
    const isLast = index === STEPS.length - 1;

    if (s.tab) {
      document.querySelector(`.tab[data-tab="${s.tab}"]`)?.click();
    }

    if (s.autoSelect) {
      const sel = document.getElementById('dino-select');
      if (sel && sel.value === '' && sel.options.length > 1) {
        sel.value = sel.options[1].value;
        sel.dispatchEvent(new Event('change'));
      }
    }

    requestAnimationFrame(() => {
      document.getElementById('tut-counter').textContent = `${index + 1} / ${STEPS.length}`;
      document.getElementById('tut-title').textContent = s.title;
      document.getElementById('tut-desc').textContent = s.desc;
      document.getElementById('tut-prev').style.visibility = index === 0 ? 'hidden' : 'visible';
      document.getElementById('tut-next').textContent = isLast ? '¡Empezar a jugar!' : 'Siguiente →';
      this._placeSpot(s.target);
    });
  }

  _placeSpot(selector) {
    const spot     = document.getElementById('tut-spot');
    const card     = document.getElementById('tut-card');
    const backdrop = document.getElementById('tut-backdrop');

    if (!selector) {
      spot.style.display     = 'none';
      backdrop.style.display = 'block';
      card.style.cssText     = 'top:50%;left:50%;transform:translate(-50%,-50%)';
      return;
    }

    const target = document.querySelector(selector);
    if (!target) {
      spot.style.display     = 'none';
      backdrop.style.display = 'block';
      card.style.cssText     = 'top:50%;left:50%;transform:translate(-50%,-50%)';
      return;
    }

    backdrop.style.display = 'none';
    spot.style.display     = 'block';

    const pad = 5;
    const r   = target.getBoundingClientRect();

    spot.style.top    = (r.top  - pad) + 'px';
    spot.style.left   = (r.left - pad) + 'px';
    spot.style.width  = (r.width  + pad * 2) + 'px';
    spot.style.height = (r.height + pad * 2) + 'px';

    const cardW = 272;
    const cardH = card.offsetHeight || 190;
    const winW  = window.innerWidth;
    const winH  = window.innerHeight;

    let top  = r.bottom + pad + 10;
    let left = r.left;

    if (top + cardH > winH - 6) top = r.top - pad - cardH - 10;
    top  = Math.max(6, Math.min(top,  winH - cardH - 6));
    left = Math.max(6, Math.min(left, winW - cardW - 6));

    card.style.cssText = `top:${top}px;left:${left}px;transform:none`;
  }

  _finish() {
    localStorage.setItem(TUTORIAL_KEY, '1');
    this.el?.remove();
    this.el = null;
  }
}

window.tutorial = new Tutorial();
