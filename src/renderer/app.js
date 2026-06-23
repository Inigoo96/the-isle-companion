// ============================================================
// Isle Companion - Renderer
// ============================================================

let dinoData = null;
let zoneData = null;
let currentCoords = null;
let selectedDino = null;
let growthTimerInterval = null;
let growthStartTime = null;
let growthStartStageIndex = 0;
let growthMultiplier = 1;

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
  const allDinos = [...(dinoData.carnivores || []), ...(dinoData.herbivores || []), ...(dinoData.omnivores || [])];
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
    updateDinoIndicator();
    renderMutations();
    renderStats();
    renderGrowthTimer();
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

  if (!selectedDino) {
    container.innerHTML = '<p class="hint-box">Select a dinosaur above to see its base stats</p>';
    return;
  }

  const s = selectedDino.baseStats;
  container.innerHTML = `
    <h3>${selectedDino.name} <span style="color:#888;font-size:11px">(${selectedDino.tier})</span></h3>
    <div class="dino-stats-grid">
      <div class="stat-card"><div class="label">HP</div><div class="value">${s.hp.toLocaleString()}</div></div>
      <div class="stat-card"><div class="label">Damage</div><div class="value">${s.damage}</div></div>
      <div class="stat-card"><div class="label">Speed</div><div class="value">${s.speed} km/h</div></div>
      <div class="stat-card"><div class="label">Bleed</div><div class="value">${s.bleed}/s</div></div>
    </div>
  `;
}

// --- PRIME LIST ---
const PRIME_NEEDED = 5;
const primeChecks = document.querySelectorAll('.prime-task input');
const primeFill = document.getElementById('prime-fill');
const primeCount = document.getElementById('prime-count');
const primeStatus = document.getElementById('prime-status');

const defaultTasks = ['no-spasms', 'no-infertile'];

function updatePrimeProgress() {
  const checked = document.querySelectorAll('.prime-task input:checked').length;
  const isPrime = checked >= PRIME_NEEDED;
  primeFill.style.width = `${Math.min(checked / PRIME_NEEDED, 1) * 100}%`;
  primeFill.classList.toggle('complete', isPrime);
  primeCount.textContent = `${checked} / ${PRIME_NEEDED}`;
  primeStatus.textContent = isPrime ? 'PRIME' : 'NOT PRIME';
  primeStatus.className = isPrime ? 'prime-achieved' : 'prime-not-yet';

  document.querySelectorAll('.prime-task').forEach(task => {
    const cb = task.querySelector('input');
    const taskId = task.dataset.task;
    const isDefault = defaultTasks.includes(taskId);
    const isLost = isDefault && !cb.checked;

    task.classList.remove('lost', 'locked');
    cb.disabled = false;

    if (isLost) {
      task.classList.add('lost');
      cb.disabled = true;
    } else if (isPrime) {
      cb.disabled = true;
      if (!cb.checked) task.classList.add('locked');
    }
  });
}

primeChecks.forEach(cb => cb.addEventListener('change', updatePrimeProgress));
updatePrimeProgress();

document.getElementById('prime-reset').addEventListener('click', () => {
  primeChecks.forEach((cb, i) => { cb.checked = i < 2; });
  updatePrimeProgress();
});

// --- DINO INDICATOR ---
function updateDinoIndicator() {
  const indicator = document.getElementById('dino-indicator');
  if (!selectedDino) {
    indicator.classList.add('hidden');
    return;
  }
  indicator.classList.remove('hidden');
  document.getElementById('dino-diet-icon').textContent = selectedDino.diet === 'carnivore' ? '\u{1F969}' : '\u{1F33F}';
  document.getElementById('dino-name-label').textContent = selectedDino.name;
  document.getElementById('dino-tier-badge').textContent = selectedDino.tier;
}

// --- GROWTH TIMER ---
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function renderGrowthTimer() {
  const container = document.getElementById('growth-timer');
  const stagesDiv = document.getElementById('growth-stages');
  const stageSelect = document.getElementById('growth-stage-select');

  stopGrowthTimer();

  if (!selectedDino || !selectedDino.growthData) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  const gd = selectedDino.growthData;
  const stageTargets = ['Juvenile', 'Sub-Adult', 'Adult'];

  stagesDiv.innerHTML = '';
  gd.stages.forEach((stage, i) => {
    const div = document.createElement('div');
    div.className = 'growth-stage-card';
    div.innerHTML = `
      <span class="stage-name">${stage.name}</span>
      <span class="stage-arrow">→</span>
      <span class="stage-target">${stageTargets[i]}</span>
      <span class="stage-duration">${formatDuration(stage.durationSeconds)}</span>
    `;
    stagesDiv.appendChild(div);
  });

  stageSelect.innerHTML = '';
  gd.stages.forEach((stage, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = stage.name;
    stageSelect.appendChild(opt);
  });

  document.getElementById('growth-progress').classList.add('hidden');
  document.getElementById('growth-start-btn').classList.remove('hidden');
  document.getElementById('growth-reset-btn').classList.add('hidden');
}

function startGrowthTimer() {
  if (!selectedDino || !selectedDino.growthData) return;

  growthMultiplier = parseFloat(document.getElementById('growth-multiplier').value) || 1;
  growthStartStageIndex = parseInt(document.getElementById('growth-stage-select').value) || 0;
  growthStartTime = Date.now();

  document.getElementById('growth-progress').classList.remove('hidden');
  document.getElementById('growth-start-btn').classList.add('hidden');
  document.getElementById('growth-reset-btn').classList.remove('hidden');
  document.getElementById('growth-multiplier').disabled = true;
  document.getElementById('growth-stage-select').disabled = true;

  growthTimerInterval = setInterval(updateGrowthDisplay, 1000);
  updateGrowthDisplay();
}

function stopGrowthTimer() {
  if (growthTimerInterval) {
    clearInterval(growthTimerInterval);
    growthTimerInterval = null;
  }
  growthStartTime = null;
  const multiplierInput = document.getElementById('growth-multiplier');
  const stageSelect = document.getElementById('growth-stage-select');
  if (multiplierInput) multiplierInput.disabled = false;
  if (stageSelect) stageSelect.disabled = false;
}

function resetGrowthTimer() {
  stopGrowthTimer();
  document.getElementById('growth-progress').classList.add('hidden');
  document.getElementById('growth-start-btn').classList.remove('hidden');
  document.getElementById('growth-reset-btn').classList.add('hidden');
}

function updateGrowthDisplay() {
  if (!growthStartTime || !selectedDino || !selectedDino.growthData) return;

  const stages = selectedDino.growthData.stages;
  const elapsedSeconds = (Date.now() - growthStartTime) / 1000;

  let totalRemainingFromStage = 0;
  for (let i = growthStartStageIndex; i < stages.length; i++) {
    totalRemainingFromStage += stages[i].durationSeconds;
  }
  const adjustedTotal = totalRemainingFromStage / growthMultiplier;
  const remaining = Math.max(0, adjustedTotal - elapsedSeconds);
  const progress = Math.min(1, elapsedSeconds / adjustedTotal);

  document.getElementById('growth-elapsed').textContent = formatDuration(Math.floor(elapsedSeconds));
  document.getElementById('growth-remaining').textContent = formatDuration(Math.ceil(remaining));
  document.getElementById('growth-fill').style.width = `${progress * 100}%`;

  const etaDate = new Date(Date.now() + remaining * 1000);
  document.getElementById('growth-eta').textContent = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let accumulated = 0;
  let currentStageIdx = stages.length;
  for (let i = growthStartStageIndex; i < stages.length; i++) {
    const stageDuration = stages[i].durationSeconds / growthMultiplier;
    if (elapsedSeconds < accumulated + stageDuration) {
      currentStageIdx = i;
      break;
    }
    accumulated += stageDuration;
  }

  document.querySelectorAll('.growth-stage-card').forEach((card, i) => {
    card.classList.toggle('active-stage', i === currentStageIdx);
    card.classList.toggle('completed-stage', i < growthStartStageIndex || (i < currentStageIdx && i >= growthStartStageIndex));
  });

  if (remaining <= 0) {
    stopGrowthTimer();
    document.getElementById('growth-remaining').textContent = 'ADULT!';
    document.getElementById('growth-remaining').classList.add('growth-complete');
    document.getElementById('growth-reset-btn').classList.remove('hidden');
  }
}

document.getElementById('growth-start-btn').addEventListener('click', startGrowthTimer);
document.getElementById('growth-reset-btn').addEventListener('click', resetGrowthTimer);

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
