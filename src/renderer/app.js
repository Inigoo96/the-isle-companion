// ============================================================
// Isle Companion - Renderer
// ============================================================

let dinoData = null;
let zoneData = null;
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

let zoom = 1;
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 0.3;
let panX = 0;
let panY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let panStartX = 0;
let panStartY = 0;

const mapImage = new Image();
let mapLoaded = false;
mapImage.onload = () => {
  mapLoaded = true;
  resizeCanvas();
};
mapImage.src = '../../assets/maps/gateway.webp';

function clampPan() {
  const w = canvas.width;
  const h = canvas.height;
  const maxPanX = (w * zoom - w) / 2;
  const maxPanY = (h * zoom - h) / 2;
  panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
  panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
}

function setZoom(newZoom, centerX, centerY) {
  const oldZoom = zoom;
  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, newZoom));
  if (centerX !== undefined && centerY !== undefined) {
    const w = canvas.width;
    const h = canvas.height;
    const mx = centerX - w / 2;
    const my = centerY - h / 2;
    panX = (panX - mx) * (zoom / oldZoom) + mx;
    panY = (panY - my) * (zoom / oldZoom) + my;
  }
  clampPan();
  updateZoomDisplay();
  drawMap();
}

function updateZoomDisplay() {
  const label = document.getElementById('zoom-level');
  if (label) label.textContent = `${Math.round(zoom * 100)}%`;
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height);
  if (size > 0) {
    canvas.width = size;
    canvas.height = size;
  }
  clampPan();
  drawMap();
}

new ResizeObserver(resizeCanvas).observe(canvas);

function drawMap() {
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const tx = w / 2 + panX;
  const ty = h / 2 + panY;
  ctx.translate(tx, ty);
  ctx.scale(zoom, zoom);
  ctx.translate(-w / 2, -h / 2);

  if (mapLoaded) {
    ctx.drawImage(mapImage, 0, 0, w, h);
  } else {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, w, h);
  }

  if (zoneData) {
    const showPatrol = document.getElementById('toggle-patrol').checked;
    const showMigration = document.getElementById('toggle-migration').checked;
    const showSanc = document.getElementById('toggle-sanctuaries').checked;

    if (showMigration) drawZones(zoneData.migrationZones, 'rgba(0, 230, 118, 0.18)', 'rgba(0, 230, 118, 0.7)', w, h);
    if (showPatrol) drawZones(zoneData.patrolZones, 'rgba(255, 59, 59, 0.18)', 'rgba(255, 59, 59, 0.7)', w, h);
    if (showSanc) drawZones(zoneData.sanctuaries, 'rgba(255, 214, 0, 0.22)', 'rgba(255, 214, 0, 0.8)', w, h);
  }

  if (currentCoords) {
    const px = ((currentCoords.y - MAP_BOUNDS.yMin) / (MAP_BOUNDS.yMax - MAP_BOUNDS.yMin)) * w;
    const py = ((currentCoords.x - MAP_BOUNDS.xMin) / (MAP_BOUNDS.xMax - MAP_BOUNDS.xMin)) * h;

    const dotSize = Math.max(3, 6 / zoom);
    const glowSize = Math.max(8, 20 / zoom);

    const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, dotSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(1, 2 / zoom);
    ctx.beginPath();
    ctx.arc(px, py, dotSize, 0, Math.PI * 2);
    ctx.stroke();

    document.getElementById('no-coords').style.display = 'none';
  }

  ctx.restore();
}

function vulnonaToPixel(vx, vy, w, h) {
  const gameX = vx * 1000;
  const gameY = vy * 1000;
  const px = ((gameY - MAP_BOUNDS.yMin) / (MAP_BOUNDS.yMax - MAP_BOUNDS.yMin)) * w;
  const py = ((gameX - MAP_BOUNDS.xMin) / (MAP_BOUNDS.xMax - MAP_BOUNDS.xMin)) * h;
  return [px, py];
}

function drawZones(zones, fillColor, strokeColor, w, h) {
  zones.forEach(zone => {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(0.5, 1 / zoom);

    if (zone.type === 'circle') {
      const [cx, cy] = vulnonaToPixel(zone.center[0], zone.center[1], w, h);
      const rx = (zone.radius * 1000) / (MAP_BOUNDS.yMax - MAP_BOUNDS.yMin) * w;
      const ry = (zone.radius * 1000) / (MAP_BOUNDS.xMax - MAP_BOUNDS.xMin) * h;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (zone.type === 'polygon') {
      ctx.beginPath();
      zone.points.forEach((p, i) => {
        const [px, py] = vulnonaToPixel(p[0], p[1], w, h);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  });
}

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  setZoom(zoom + delta, mx, my);
}, { passive: false });

// Drag to pan
canvas.addEventListener('mousedown', (e) => {
  if (zoom <= 1) return;
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  panStartX = panX;
  panStartY = panY;
  canvas.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  panX = panStartX + (e.clientX - dragStartX);
  panY = panStartY + (e.clientY - dragStartY);
  clampPan();
  drawMap();
});

window.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    canvas.style.cursor = zoom > 1 ? 'grab' : 'default';
  }
});

// Zoom buttons
document.getElementById('zoom-in').addEventListener('click', () => {
  const w = canvas.width;
  const h = canvas.height;
  setZoom(zoom + ZOOM_STEP, w / 2, h / 2);
});

document.getElementById('zoom-out').addEventListener('click', () => {
  const w = canvas.width;
  const h = canvas.height;
  setZoom(zoom - ZOOM_STEP, w / 2, h / 2);
});

document.getElementById('zoom-reset').addEventListener('click', () => {
  zoom = 1;
  panX = 0;
  panY = 0;
  updateZoomDisplay();
  drawMap();
});

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// --- COORDINATE UPDATES FROM CLIPBOARD ---
window.isleAPI.onCoordinatesUpdate((coords) => {
  currentCoords = coords;
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
    container.innerHTML = '<div class="hint-box">Select a dinosaur above</div>';
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
    container.innerHTML = '<p class="hint-box">Select a dinosaur in the Mutations tab to see its base stats</p>';
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

// --- ZONE DATA ---
async function loadZoneData() {
  try {
    const resp = await fetch('../../data/zones.json');
    zoneData = await resp.json();
    drawMap();
  } catch (e) {
    console.error('Failed to load zone data:', e);
  }
}

document.getElementById('toggle-patrol').addEventListener('change', drawMap);
document.getElementById('toggle-migration').addEventListener('change', drawMap);
document.getElementById('toggle-sanctuaries').addEventListener('change', drawMap);

// --- INIT ---
loadDinoData();
loadZoneData();
renderMutations();
