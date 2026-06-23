// ============================================================
// Isle Companion - Renderer
// ============================================================

let dinoData = null;
let currentCoords = null;
let selectedDino = null;

// Gateway map bounds (from Vulnona data_1.txt, converted to game units *1000)
// UE5 coords: X = North-South, Y = East-West, Z = altitude
// Projection: Game Y → Screen X, Game X → Screen Y (inverted)
const MAP_BOUNDS = {
  xMin: -607000,
  xMax: 509000,
  yMin: -505000,
  yMax: 607000
};

// --- TABS ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'map') drawMap();
  });
});

// --- MINIMAP ---
const canvas = document.getElementById('minimap');
const ctx = canvas.getContext('2d');

const mapImage = new Image();
let mapLoaded = false;
mapImage.onload = () => {
  mapLoaded = true;
  resizeCanvas();
};
mapImage.src = '../../assets/maps/gateway.webp';

function resizeCanvas() {
  const container = canvas.parentElement;
  const size = Math.min(container.clientWidth, 360);
  canvas.width = size;
  canvas.height = size;
  drawMap();
}

function drawMap() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  if (mapLoaded) {
    ctx.drawImage(mapImage, 0, 0, w, h);
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#666';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('Cargando mapa...', w / 2, h / 2);
  }

  // Player position
  if (currentCoords) {
    // UE5 axis mapping: Game Y (E-W) → Screen X, Game X (N-S) → Screen Y
    // No inversion needed: vulnona image has xMin (north) at top already
    const px = ((currentCoords.y - MAP_BOUNDS.yMin) / (MAP_BOUNDS.yMax - MAP_BOUNDS.yMin)) * w;
    const py = ((currentCoords.x - MAP_BOUNDS.xMin) / (MAP_BOUNDS.xMax - MAP_BOUNDS.xMin)) * h;

    // Outer glow
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 20);
    gradient.addColorStop(0, 'rgba(80, 200, 120, 0.6)');
    gradient.addColorStop(1, 'rgba(80, 200, 120, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, 20, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#50c878';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    // White border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.stroke();

    document.getElementById('no-coords').style.display = 'none';
  }
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// --- COORDINATE UPDATES FROM CLIPBOARD ---
window.isleAPI.onCoordinatesUpdate((coords) => {
  currentCoords = coords;
  document.getElementById('coord-x').textContent = `X: ${coords.x.toFixed(0)}`;
  document.getElementById('coord-y').textContent = `Y: ${coords.y.toFixed(0)}`;
  document.getElementById('coord-z').textContent = `Z: ${coords.z.toFixed(0)}`;
  drawMap();
});

// --- CLICK-THROUGH INDICATOR ---
window.isleAPI.onClickThroughChanged((state) => {
  const badge = document.getElementById('click-through-badge');
  badge.classList.toggle('hidden', !state);
});

// --- DINO DATA ---
async function loadDinoData() {
  try {
    const resp = await fetch('../../data/dinos.json');
    dinoData = await resp.json();
    populateDinoSelect();
  } catch (e) {
    console.error('Failed to load dino data:', e);
  }
}

function populateDinoSelect() {
  const select = document.getElementById('dino-select');
  const allDinos = [...(dinoData.carnivores || []), ...(dinoData.herbivores || [])];
  allDinos.sort((a, b) => a.name.localeCompare(b.name));

  allDinos.forEach(dino => {
    const opt = document.createElement('option');
    opt.value = dino.name;
    opt.textContent = `${dino.name} (${dino.tier})`;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    const name = select.value;
    selectedDino = allDinos.find(d => d.name === name) || null;
    renderMutations();
    renderStats();
  });
}

function renderMutations() {
  const container = document.getElementById('mutations-list');
  container.innerHTML = '';

  if (!selectedDino) {
    container.innerHTML = '<div class="hint-box">Selecciona un dinosaurio arriba</div>';
    return;
  }

  selectedDino.recommendedMutations.forEach((mut, i) => {
    const div = document.createElement('div');
    div.className = 'mutation-item';
    div.innerHTML = `<span class="mutation-number">${i + 1}</span><span class="mutation-name">${mut}</span>`;
    container.appendChild(div);
  });
}

function renderStats() {
  const container = document.getElementById('stats-dino-info');
  const hpTracker = document.getElementById('hp-tracker');

  if (!selectedDino) {
    container.innerHTML = '<p class="hint-box">Selecciona un dinosaurio en la pestaña Mutations para ver sus stats base</p>';
    hpTracker.classList.add('hidden');
    return;
  }

  const s = selectedDino.baseStats;
  container.innerHTML = `
    <h3>${selectedDino.name} <span style="color:#888;font-size:11px">(${selectedDino.tier})</span></h3>
    <div class="dino-stats-grid">
      <div class="stat-card"><div class="label">HP</div><div class="value">${s.hp}</div></div>
      <div class="stat-card"><div class="label">Damage</div><div class="value">${s.damage}</div></div>
      <div class="stat-card"><div class="label">Speed</div><div class="value">${s.speed}</div></div>
      <div class="stat-card"><div class="label">Stamina</div><div class="value">${s.stamina}</div></div>
    </div>
  `;
  hpTracker.classList.remove('hidden');
}

// --- HP SLIDER ---
document.getElementById('hp-slider').addEventListener('input', (e) => {
  const val = parseInt(e.target.value);
  document.getElementById('hp-value').textContent = `${val}%`;
  const fill = document.getElementById('hp-fill');
  fill.style.width = `${val}%`;

  if (val > 60) fill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
  else if (val > 30) fill.style.background = 'linear-gradient(90deg, #f39c12, #e67e22)';
  else fill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
});

// --- PATROL ZONES ---
const patrolChecks = document.querySelectorAll('.patrol-checklist input');
const patrolFill = document.getElementById('patrol-fill');
const patrolText = document.getElementById('patrol-text');

function updatePatrolProgress() {
  const checked = document.querySelectorAll('.patrol-checklist input:checked').length;
  const total = patrolChecks.length;
  patrolFill.style.width = `${(checked / total) * 100}%`;
  patrolText.textContent = `${checked} / ${total}`;
}

patrolChecks.forEach(cb => cb.addEventListener('change', updatePatrolProgress));

document.getElementById('patrol-reset').addEventListener('click', () => {
  patrolChecks.forEach(cb => { cb.checked = false; });
  updatePatrolProgress();
});

// --- INIT ---
loadDinoData();
renderMutations();
