// ============================================================
// Isle Companion - Renderer
// ============================================================

let dinoData = null;
let currentCoords = null;
let selectedDino = null;

// Gateway map bounds (approximate, will need calibration with real coords)
const MAP_BOUNDS = {
  minX: -400000,
  maxX: 400000,
  minY: -400000,
  maxY: 400000
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

  // Background grid
  ctx.strokeStyle = 'rgba(80, 200, 120, 0.1)';
  ctx.lineWidth = 1;
  const gridSize = w / 10;
  for (let i = 0; i <= 10; i++) {
    ctx.beginPath();
    ctx.moveTo(i * gridSize, 0);
    ctx.lineTo(i * gridSize, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * gridSize);
    ctx.lineTo(w, i * gridSize);
    ctx.stroke();
  }

  // Center crosshair
  ctx.strokeStyle = 'rgba(80, 200, 120, 0.2)';
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  // Cardinal directions
  ctx.fillStyle = 'rgba(80, 200, 120, 0.5)';
  ctx.font = '11px Segoe UI';
  ctx.textAlign = 'center';
  ctx.fillText('N', w / 2, 14);
  ctx.fillText('S', w / 2, h - 4);
  ctx.textAlign = 'left';
  ctx.fillText('W', 4, h / 2 + 4);
  ctx.textAlign = 'right';
  ctx.fillText('E', w - 4, h / 2 + 4);

  // Player position
  if (currentCoords) {
    const px = ((currentCoords.x - MAP_BOUNDS.minX) / (MAP_BOUNDS.maxX - MAP_BOUNDS.minX)) * w;
    const py = ((currentCoords.y - MAP_BOUNDS.minY) / (MAP_BOUNDS.maxY - MAP_BOUNDS.minY)) * h;

    // Glow effect
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, 16);
    gradient.addColorStop(0, 'rgba(80, 200, 120, 0.5)');
    gradient.addColorStop(1, 'rgba(80, 200, 120, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(px, py, 16, 0, Math.PI * 2);
    ctx.fill();

    // Player dot
    ctx.fillStyle = '#50c878';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();

    // White border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
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
