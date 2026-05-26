// ===== DATA =====
const buses = [
  { id: 'B-12', route: 'Lebak Bulus → Fatmawati', eta: 3, status: 'on-time' },
  { id: 'B-07', route: 'Blok M → Senayan', eta: 7, status: 'on-time' },
  { id: 'B-21', route: 'Dukuh Atas → Sudirman', eta: 5, status: 'late' },
  { id: 'B-34', route: 'Lebak Bulus → Pondok Indah', eta: 2, status: 'on-time' },
  { id: 'B-15', route: 'HI → Monas', eta: 9, status: 'on-time' },
];

const stations = [
  { name: 'Lebak Bulus', pct: 72 },
  { name: 'Fatmawati', pct: 45 },
  { name: 'Blok M', pct: 88 },
  { name: 'Senayan', pct: 31 },
  { name: 'Dukuh Atas', pct: 91 },
  { name: 'Bundaran HI', pct: 60 },
];

const stops = [
  { name: 'Depok Baru', eta: 'Departed', state: 'done' },
  { name: 'Lebak Bulus Residence', eta: '1 min ago', state: 'done' },
  { name: 'Pesanggrahan', eta: 'Now arriving', state: 'active' },
  { name: 'Lebak Bulus MRT', eta: '4 min', state: '', transfer: true },
];

let delayActive = false;
let surgeActive = false;


// ===== TAB SWITCH =====
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((el, i) => {
    el.classList.toggle('active', (tab === 'operator' ? 0 : 1) === i);
  });
  document.querySelectorAll('.panel').forEach((el, i) => {
    el.classList.toggle('active', (tab === 'operator' ? 0 : 1) === i);
  });
}


// ===== RENDER FLEET TABLE =====
function renderFleet() {
  const tbody = document.getElementById('fleet-body');
  tbody.innerHTML = buses.map(bus => {
    const labelMap = { 'on-time': 'On time', 'late': 'Late', 'delayed': 'Delayed' };
    return `
      <tr>
        <td><strong>${bus.id}</strong></td>
        <td style="color:#888;font-size:12px">${bus.route}</td>
        <td>${bus.eta} min</td>
        <td><span class="status-badge ${bus.status}">${labelMap[bus.status]}</span></td>
      </tr>`;
  }).join('');
}


// ===== RENDER DENSITY BARS =====
function renderDensity() {
  const container = document.getElementById('density-container');
  container.innerHTML = stations.map(s => {
    const color = s.pct > 80 ? '#E24B4A' : s.pct > 60 ? '#BA7517' : '#1D9E75';
    return `
      <div class="density-item">
        <div class="density-header">
          <span>${s.name}</span>
          <span style="font-weight:600;color:${color}">${s.pct}%</span>
        </div>
        <div class="density-bar-wrap">
          <div class="density-bar" style="width:${s.pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}


// ===== RENDER ALERTS =====
function renderAlerts(extra = []) {
  const base = [
    { type: 'warn', msg: 'B-21 running 3 min late on Dukuh Atas route', time: '2 min ago' },
  ];
  const all = [...extra, ...base];
  document.getElementById('alerts-container').innerHTML = all.map(a => `
    <div class="alert-item ${a.type}">
      <div>${a.msg}</div>
      <div class="alert-time">${a.time}</div>
    </div>`).join('');
}


// ===== RENDER STOPS =====
function renderStops(syncOk) {
  const container = document.getElementById('stop-list');
  container.innerHTML = `<div class="stop-line"></div>` + stops.map(s => `
    <div class="stop-item">
      <div class="stop-dot ${s.state}"></div>
      <div class="stop-name">${s.name}</div>
      <div class="stop-eta ${s.state === 'active' ? 'now' : ''}">${s.eta}</div>
      ${s.transfer
        ? `<div class="transfer-tag">
             <i class="ti ti-arrows-exchange"></i>
             MRT transfer — ${syncOk ? 'connection secured' : '⚠ checking connection'}
           </div>`
        : ''}
    </div>`).join('');
}


// ===== UPDATE METRIC CARDS =====
function updateMetrics(delay, surge) {
  const ontime = document.getElementById('m-ontime');
  const wait   = document.getElementById('m-wait');
  const pax    = document.getElementById('m-pax');

  ontime.textContent = delay ? '71%' : '87%';
  ontime.className   = 'metric-val ' + (delay ? 'red' : 'green');

  wait.textContent = delay ? '8.7 min' : surge ? '6.1 min' : '4.2 min';
  wait.className   = 'metric-val ' + (delay || surge ? 'red' : 'amber');

  pax.textContent = surge ? '15,240' : '12,480';
}


// ===== UPDATE PASSENGER PANEL =====
function updatePaxPanel(delay) {
  const banner    = document.getElementById('sync-banner');
  const syncText  = document.getElementById('sync-text');
  const mrtDepart = document.getElementById('mrt-depart');
  const transBuf  = document.getElementById('transfer-buf');
  const connStat  = document.getElementById('conn-status');
  const mrtSub    = document.getElementById('mrt-sub');

  if (delay) {
    banner.className  = 'sync-banner warn';
    syncText.textContent = 'MRT delayed +5 min — SYNTRA auto-adjusted feeder B12 departure';

    mrtDepart.textContent = '11 min';
    mrtDepart.className   = 'metric-val amber';

    transBuf.textContent = '7 min';
    transBuf.className   = 'metric-val green';

    connStat.textContent = 'Secured';
    connStat.className   = 'metric-val green';

    mrtSub.textContent = 'Delayed +5 min — feeder held automatically by SYNTRA';
  } else {
    banner.className  = 'sync-banner';
    syncText.textContent = 'All connections synchronized — no delays detected';

    mrtDepart.textContent = '6 min';
    mrtDepart.className   = 'metric-val green';

    transBuf.textContent = '2 min';
    transBuf.className   = 'metric-val';

    connStat.textContent = 'Secure';
    connStat.className   = 'metric-val green';

    mrtSub.textContent = 'Next departure: on schedule';
  }
}


// ===== SIMULATE MRT DELAY =====
function triggerDelay() {
  delayActive = true;
  buses[0].status = 'delayed';
  buses[0].eta    = 11;
  buses[2].status = 'delayed';
  buses[2].eta    = 12;

  renderFleet();
  renderAlerts([
    { type: 'info', msg: 'SYNTRA: MRT Lebak Bulus delayed +5 min — feeder B12 auto-adjusted', time: 'just now' },
    { type: 'info', msg: 'SYNTRA: Feeder B12 held at Pesanggrahan — connection secured', time: 'just now' },
  ]);
  updateMetrics(true, false);
  updatePaxPanel(true);
  renderStops(true);
}


// ===== SIMULATE PASSENGER SURGE =====
function triggerSurge() {
  surgeActive = true;
  stations[2].pct = 98;
  stations[4].pct = 97;

  renderDensity();
  renderAlerts([
    { type: 'danger', msg: 'SYNTRA: Passenger surge at Blok M — extra fleet dispatched', time: 'just now' },
    { type: 'danger', msg: 'SYNTRA: Density alert Dukuh Atas — 97% capacity', time: 'just now' },
  ]);
  updateMetrics(false, true);
}


// ===== RESET =====
function resetSim() {
  delayActive = false;
  surgeActive = false;

  buses[0].status = 'on-time'; buses[0].eta = 3;
  buses[2].status = 'late';    buses[2].eta = 5;
  stations[2].pct = 88;
  stations[4].pct = 91;

  renderFleet();
  renderDensity();
  renderAlerts();
  updateMetrics(false, false);
  updatePaxPanel(false);
  renderStops(false);
}


// ===== CLOCK =====
function updateClock() {
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}


// ===== REAL-TIME SIMULATION =====
setInterval(() => {
  if (!delayActive) {
    buses.forEach(bus => {
      bus.eta = Math.max(1, bus.eta + (Math.random() > 0.6 ? 1 : -1));
    });
    renderFleet();
  }
  if (!surgeActive) {
    stations.forEach(s => {
      s.pct = Math.min(99, Math.max(10, s.pct + Math.round((Math.random() - 0.5) * 4)));
    });
    renderDensity();
  }
  updateClock();
}, 2000);


// ===== INIT =====
renderFleet();
renderDensity();
renderAlerts();
updatePaxPanel(false);
renderStops(false);
updateClock();