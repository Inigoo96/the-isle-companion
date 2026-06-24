// ============================================================
// Isle Companion - Renderer
// ============================================================

let dinoData = null;
let mutationsData = null;
let zoneData = null;
let currentCoords = null;
let selectedDino = null;
let growthTimerInterval = null;
let growthStartTime = null;
let growthStartPercent = 0;
let growthMultiplier = 1;
let allDinos = [];
let currentServer = null;

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
  if (rect.width > 0 && rect.height > 0) {
    canvas.width = rect.width;
    canvas.height = rect.height;
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
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.75)');
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
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
    window.tutorial?.start();
  } catch (e) {
    console.error('Failed to load dino data:', e);
  }
}

async function loadMutationsData() {
  try {
    const resp = await fetch('../../data/mutations.json');
    mutationsData = await resp.json();
  } catch (e) {
    console.error('Failed to load mutations data:', e);
  }
}

function populateDinoSelect() {
  const select = document.getElementById('dino-select');
  allDinos = [...(dinoData.carnivores || []), ...(dinoData.herbivores || []), ...(dinoData.omnivores || [])];
  allDinos.sort((a, b) => a.name.localeCompare(b.name));

  select.addEventListener('change', () => {
    const name = select.value;
    selectedDino = allDinos.find(d => d.name === name) || null;
    updateDinoIndicator();
    renderMutations();
    renderStats();
    renderGrowthTimer();
  });

  renderDinoOptions();
  window.tutorial?.start();
}

function renderDinoOptions() {
  const select = document.getElementById('dino-select');
  const prevValue = select.value;

  let visible = allDinos;
  if (currentServer?.allowedDinos?.length > 0) {
    const allowedNames = new Set(currentServer.allowedDinos.map(d => d.name));
    visible = allDinos.filter(d => allowedNames.has(d.name));
  }

  select.innerHTML = '<option value="">-- Select dinosaur --</option>';
  visible.forEach(dino => {
    const opt = document.createElement('option');
    opt.value = dino.name;
    opt.textContent = dino.name;
    select.appendChild(opt);
  });

  if (prevValue && visible.find(d => d.name === prevValue)) {
    select.value = prevValue;
  } else if (selectedDino && !visible.find(d => d.name === selectedDino.name)) {
    selectedDino = null;
    updateDinoIndicator();
    renderMutations();
    renderStats();
    renderGrowthTimer();
  }
}

// --- SERVER SELECTOR ---
async function loadServers() {
  try {
    const resp = await fetch(`${BACKEND}/servers`);
    if (!resp.ok) return;
    const servers = await resp.json();
    const select = document.getElementById('server-select');
    servers.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.slug;
      opt.textContent = s.name;
      select.appendChild(opt);
    });
    const saved = localStorage.getItem('isle_server_slug');
    if (saved && servers.find(s => s.slug === saved)) {
      select.value = saved;
      await applyServer(saved);
    }
  } catch (e) { /* backend not running — overlay works without it */ }
}

async function applyServer(slug) {
  if (!slug) {
    currentServer = null;
    localStorage.removeItem('isle_server_slug');
    updateServerBar(null);
    if (allDinos.length > 0) renderDinoOptions();
    return;
  }
  try {
    const resp = await fetch(`${BACKEND}/servers/${slug}`);
    if (!resp.ok) return;
    currentServer = await resp.json();
    localStorage.setItem('isle_server_slug', slug);
    updateServerBar(currentServer);
    if (allDinos.length > 0) renderDinoOptions();
    if (!growthStartTime && selectedDino) renderGrowthTimer();
  } catch (e) { /* silent fail */ }
}

function updateServerBar(server) {
  const mult = document.getElementById('server-multiplier');
  if (server) {
    mult.textContent = `×${server.growthMultiplier}`;
    mult.classList.remove('hidden');
  } else {
    mult.classList.add('hidden');
  }
}

function renderMutations() {
  const container = document.getElementById('mutations-list');
  container.innerHTML = '';

  if (!selectedDino) {
    container.innerHTML = '<div class="hint-box">Select a dinosaur above</div>';
    return;
  }

  const muts = selectedDino.recommendedMutations;
  if (!muts || muts.length === 0) {
    container.innerHTML = '<div class="hint-box">No mutation data available</div>';
    return;
  }

  const TAG_LABELS = { s2: 'Slot 2', desb: 'Unlock', situ: 'Situ' };

  muts.forEach((mut, i) => {
    const name = mut.name || mut;
    const tags = mut.tags || [];
    const info = mutationsData ? mutationsData[name] : null;

    const tagsHtml = tags.map(t =>
      `<span class="mut-tag mut-tag-${t}">${TAG_LABELS[t] || t}</span>`
    ).join('');
    const effectHtml = info ? `<span class="mut-effect">${info.effect}</span>` : '';

    const div = document.createElement('div');
    div.className = 'mutation-item';
    div.innerHTML = `
      <span class="mutation-number">${i + 1}</span>
      <div class="mutation-body">
        <div class="mutation-name-row">
          <span class="mutation-name">${name}</span>${tagsHtml}
        </div>
        ${effectHtml}
      </div>`;
    container.appendChild(div);
  });
}

function formatWeight(w) {
  if (w >= 1000) return (w / 1000).toFixed(1).replace(/\.0$/, '') + 't';
  if (w >= 1) return Math.round(w).toLocaleString() + ' kg';
  return w + ' kg';
}

function formatStat(val) {
  if (val >= 1000) return val.toLocaleString();
  if (val >= 1) return Math.round(val * 10) / 10;
  return val;
}

function renderStats() {
  const container = document.getElementById('stats-dino-info');

  if (!selectedDino) {
    container.innerHTML = '<p class="hint-box">Select a dinosaur above to see its stats</p>';
    return;
  }

  const s = selectedDino.stats;
  const stageOrder = ['hatchling', 'juvenile', 'adult', 'prime'];
  const stageLabels = { hatchling: 'Hatchling', juvenile: 'Juvenile', adult: 'Adult', prime: 'Prime' };
  const available = stageOrder.filter(k => s[k]);

  let abilityHtml = '';
  if (selectedDino.ability) {
    abilityHtml = `<div class="ability-badge">${selectedDino.ability}</div>`;
  }

  let tableHtml = `<table class="stats-table">
    <thead><tr><th></th>`;
  available.forEach(k => {
    const cls = k === 'prime' ? ' class="prime-col"' : '';
    tableHtml += `<th${cls}>${stageLabels[k]}</th>`;
  });
  tableHtml += `</tr></thead><tbody>`;

  const rows = [
    { label: 'HP / Weight', key: 'weight', fmt: formatWeight },
    { label: 'Sprint', key: 'speed', fmt: v => v + ' km/h' },
    { label: 'Bite Force', key: 'biteForce', fmt: formatStat }
  ];

  rows.forEach(row => {
    tableHtml += `<tr><td class="stat-row-label">${row.label}</td>`;
    available.forEach(k => {
      const cls = k === 'prime' ? ' class="prime-col"' : '';
      tableHtml += `<td${cls}>${row.fmt(s[k][row.key])}</td>`;
    });
    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table>`;

  container.innerHTML = `
    <div class="stats-header">
      <h3>${selectedDino.name} <span class="tier-label">${selectedDino.tier}</span></h3>
      ${abilityHtml}
    </div>
    ${tableHtml}
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
const TIER_COLORS = {
  'Apex':    { bg: 'rgba(231,76,60,0.2)',   color: '#e74c3c' },
  'High':    { bg: 'rgba(230,126,34,0.2)',  color: '#e67e22' },
  'Mid':     { bg: 'rgba(241,196,15,0.2)',  color: '#f1c40f' },
  'Low-Mid': { bg: 'rgba(52,152,219,0.2)',  color: '#3498db' },
  'Low':     { bg: 'rgba(120,120,120,0.2)', color: '#888' }
};

function updateDinoIndicator() {
  const indicator = document.getElementById('dino-indicator');
  if (!selectedDino) {
    indicator.classList.add('hidden');
    return;
  }
  indicator.classList.remove('hidden');
  const badge = document.getElementById('dino-tier-badge');
  badge.textContent = selectedDino.tier;
  const style = TIER_COLORS[selectedDino.tier] || TIER_COLORS['Low'];
  badge.style.background = style.bg;
  badge.style.color = style.color;
}

// --- GROWTH TIMER ---
function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m`;
}

function getStageAtPercent(percent) {
  if (percent < 25) return 0;
  if (percent < 50) return 1;
  if (percent < 75) return 2;
  return 3;
}

function percentToVanillaMinutes(stages, percent) {
  const stageIdx = getStageAtPercent(percent);
  let mins = 0;
  for (let i = 0; i < stageIdx; i++) mins += stages[i].minutes;
  const progressInStage = (percent - stageIdx * 25) / 25;
  mins += progressInStage * stages[stageIdx].minutes;
  return mins;
}

function vanillaMinutesToStage(stages, vanillaMins) {
  let accumulated = 0;
  for (let i = 0; i < stages.length; i++) {
    if (vanillaMins < accumulated + stages[i].minutes) return i;
    accumulated += stages[i].minutes;
  }
  return stages.length - 1;
}

function renderGrowthTimer() {
  const container = document.getElementById('growth-timer');
  const stagesDiv = document.getElementById('growth-stages');

  stopGrowthTimer();

  if (!selectedDino || !selectedDino.growthData) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  const gd = selectedDino.growthData;
  const multiplier = parseFloat(currentServer?.growthMultiplier) || 1;
  const percent = parseFloat(document.getElementById('growth-percent').value) || 0;
  const currentStageIdx = getStageAtPercent(percent);

  const vanillaElapsed = percentToVanillaMinutes(gd.stages, percent);
  const remainingMins = (gd.totalMinutes - vanillaElapsed) / multiplier;
  document.getElementById('growth-total-time').textContent = formatMinutes(remainingMins);

  stagesDiv.innerHTML = '';
  gd.stages.forEach((stage, i) => {
    const adjustedMins = stage.minutes / multiplier;
    const div = document.createElement('div');
    div.className = 'growth-stage-card';
    if (i < currentStageIdx) div.classList.add('completed-stage');
    if (i === currentStageIdx) div.classList.add('active-stage');
    div.innerHTML = `
      <span class="stage-name">${stage.name}</span>
      <span class="stage-duration">${formatMinutes(adjustedMins)}</span>
    `;
    stagesDiv.appendChild(div);
  });

  document.getElementById('growth-progress').classList.add('hidden');
  document.getElementById('growth-start-btn').classList.remove('hidden');
  document.getElementById('growth-reset-btn').classList.add('hidden');
}

function startGrowthTimer() {
  if (!selectedDino || !selectedDino.growthData) return;

  growthMultiplier = parseFloat(currentServer?.growthMultiplier) || 1;
  growthStartPercent = parseFloat(document.getElementById('growth-percent').value) || 0;
  growthStartTime = Date.now();

  document.getElementById('growth-progress').classList.remove('hidden');
  document.getElementById('growth-start-btn').classList.add('hidden');
  document.getElementById('growth-reset-btn').classList.remove('hidden');
  document.getElementById('growth-percent').disabled = true;

  growthTimerInterval = setInterval(updateGrowthDisplay, 1000);
  updateGrowthDisplay();
}

function stopGrowthTimer() {
  if (growthTimerInterval) {
    clearInterval(growthTimerInterval);
    growthTimerInterval = null;
  }
  growthStartTime = null;
  const percentInput = document.getElementById('growth-percent');
  if (percentInput) percentInput.disabled = false;
}

function resetGrowthTimer() {
  stopGrowthTimer();
  renderGrowthTimer();
}

function updateGrowthDisplay() {
  if (!growthStartTime || !selectedDino || !selectedDino.growthData) return;

  const gd = selectedDino.growthData;
  const stages = gd.stages;
  const timerElapsedSecs = (Date.now() - growthStartTime) / 1000;

  const vanillaOffsetMins = percentToVanillaMinutes(stages, growthStartPercent);
  const vanillaElapsedMins = (timerElapsedSecs * growthMultiplier) / 60;
  const totalVanillaMins = vanillaOffsetMins + vanillaElapsedMins;

  const vanillaRemainingMins = Math.max(0, gd.totalMinutes - totalVanillaMins);
  const realRemainingSecs = (vanillaRemainingMins * 60) / growthMultiplier;

  const totalRealSecs = ((gd.totalMinutes - vanillaOffsetMins) * 60) / growthMultiplier;
  const progress = Math.min(1, timerElapsedSecs / totalRealSecs);

  document.getElementById('growth-elapsed').textContent = formatDuration(Math.floor(timerElapsedSecs));
  document.getElementById('growth-remaining').textContent = formatDuration(Math.ceil(realRemainingSecs));
  document.getElementById('growth-fill').style.width = `${progress * 100}%`;

  const etaDate = new Date(Date.now() + realRemainingSecs * 1000);
  document.getElementById('growth-eta').textContent = etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const currentStageIdx = vanillaMinutesToStage(stages, totalVanillaMins);

  document.querySelectorAll('.growth-stage-card').forEach((card, i) => {
    card.classList.toggle('active-stage', i === currentStageIdx);
    card.classList.toggle('completed-stage', i < currentStageIdx);
  });

  if (realRemainingSecs <= 0) {
    stopGrowthTimer();
    document.getElementById('growth-remaining').textContent = 'ADULT!';
    document.getElementById('growth-remaining').classList.add('growth-complete');
    document.getElementById('growth-reset-btn').classList.remove('hidden');
    document.getElementById('growth-start-btn').classList.add('hidden');
    document.getElementById('growth-progress').classList.remove('hidden');
  }
}

document.getElementById('growth-start-btn').addEventListener('click', startGrowthTimer);
document.getElementById('growth-reset-btn').addEventListener('click', resetGrowthTimer);
document.getElementById('growth-percent').addEventListener('input', () => {
  if (!growthStartTime) renderGrowthTimer();
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

// --- STEAM AUTH ---
const BACKEND = 'http://localhost:8080';

function getToken()        { return localStorage.getItem('isle_token'); }
function getDisplayName()  { return localStorage.getItem('isle_display_name'); }

function updateAuthUI() {
  const name = getDisplayName();
  const loginBtn  = document.getElementById('steam-login-btn');
  const steamUser = document.getElementById('steam-user');
  if (name) {
    loginBtn.classList.add('hidden');
    steamUser.textContent = name;
    steamUser.classList.remove('hidden');
  } else {
    loginBtn.classList.remove('hidden');
    steamUser.classList.add('hidden');
  }
}

document.getElementById('steam-login-btn').addEventListener('click', () => {
  window.isleAPI.steamLogin();
});

window.isleAPI.onAuthSuccess(({ token, displayName }) => {
  localStorage.setItem('isle_token', token);
  localStorage.setItem('isle_display_name', displayName);
  updateAuthUI();
});

document.getElementById('server-select').addEventListener('change', e => {
  applyServer(e.target.value);
});

async function refreshProfile() {
  const token = getToken();
  if (!token) return;
  try {
    const resp = await fetch(`${BACKEND}/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return;
    const { displayName } = await resp.json();
    if (displayName) { localStorage.setItem('isle_display_name', displayName); updateAuthUI(); }
  } catch (e) { /* silent */ }
}

// --- INIT ---
loadDinoData();
loadMutationsData();
loadZoneData();
loadServers();
renderMutations();
updateAuthUI();
refreshProfile();
