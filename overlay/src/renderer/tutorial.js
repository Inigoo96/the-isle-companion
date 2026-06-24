const TUTORIAL_KEY = 'tic_tutorial_v1';

const STEPS = [
  {
    title: 'Welcome to The Isle Companion!',
    desc: 'A desktop overlay to help you play The Isle Evrima. Quick tour — 2 minutes.',
    target: null,
    tab: null,
  },
  {
    title: 'Dinosaur Selector',
    desc: 'Pick your species here. Recommended mutations, stats and the growth timer all update automatically for the selected dino.',
    target: '#global-dino-bar',
    tab: null,
    autoSelect: true,
  },
  {
    title: 'Map — Your Position in Real Time',
    desc: 'Copy your in-game coordinates (Alt+C by default). The overlay detects them automatically and shows your position on the Gateway map.',
    target: '#map-container',
    tab: 'map',
  },
  {
    title: 'Map Layers',
    desc: 'Toggle zones on and off: Patrol Zones (red), Migration Zones (green) and Sanctuaries (yellow). Use them to plan your route to Prime.',
    target: '#map-toolbar',
    tab: 'map',
  },
  {
    title: 'Prime List — The Road to Prime',
    desc: 'Complete 5 of these 10 tasks before reaching 75% growth to unlock Prime mutations and superior nesting genetics. Check them off as you go.',
    target: '#prime-header',
    tab: 'prime',
  },
  {
    title: 'Recommended Mutations',
    desc: 'The 14 best mutations for your dino, ranked by priority. Tagged as Slot 2 exclusive, situational or lifestyle-unlockable.',
    target: '#mutations-list',
    tab: 'mutations',
  },
  {
    title: 'Stats by Growth Stage',
    desc: 'Weight/HP, speed and bite force for your dino at each stage: Hatchling, Juvenile, Adult and Prime.',
    target: '#stats-dino-info',
    tab: 'stats',
  },
  {
    title: 'Growth Timer',
    desc: 'Set the server growth multiplier and your current growth %. Hit Start and the timer counts down to each stage.',
    target: '#growth-controls',
    tab: 'stats',
  },
  {
    title: 'Overlay Controls',
    desc: 'F9 hides and shows the overlay. F10 enables click-through mode — clicks pass to the game without closing the overlay.',
    target: '#titlebar',
    tab: null,
  },
  {
    title: 'Ready to Play!',
    desc: 'Select your dino, copy coordinates in-game and start tracking your run. Good luck!',
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
          <button id="tut-skip">Skip guide x</button>
        </div>
        <h3 id="tut-title"></h3>
        <p id="tut-desc"></p>
        <div id="tut-nav">
          <button id="tut-prev" class="tut-btn tut-secondary">Back</button>
          <button id="tut-next" class="tut-btn tut-primary">Next</button>
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
      document.getElementById('tut-next').textContent = isLast ? 'Start playing!' : 'Next';
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
