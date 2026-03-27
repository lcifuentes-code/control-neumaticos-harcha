// ============================================================
// NEUMATRACK · Flota y KPIs
// ============================================================

function filterFleet() {
  const faena = document.getElementById('faenaFilter')?.value || '';
  const q     = (document.getElementById('searchTruck')?.value || '').toLowerCase();
  filteredTrucks = trucks.filter(t => {
    if (faena && t.faena !== faena) return false;
    if (q && !t.num.toLowerCase().includes(q) && !t.plate.toLowerCase().includes(q)) return false;
    return true;
  });
  renderFleet();
  syncKpiBar();
}

function renderFleet() {
  const container = document.getElementById('fleetList');
  container.innerHTML = '';
  document.getElementById('fleetCount').textContent = filteredTrucks.length + ' unidades';

  filteredTrucks.forEach(truck => {
    const hasCrit = truck.positions.some(p=>p.state==='crit');
    const hasWarn = truck.positions.some(p=>p.state==='warn');
    const dotColor = hasCrit ? 'var(--crit)' : hasWarn ? 'var(--warn)' : 'var(--ok)';

    const el = document.createElement('div');
    el.className = 'truck-item' + (truck.id === currentTruckId ? ' active' : '');
    el.onclick = () => selectTruck(truck.id);
    el.innerHTML = `
      <div class="truck-info">
        <div class="truck-id">${truck.num}</div>
        <div class="truck-plate">${truck.plate}</div>
        <div class="truck-faena">${truck.faena}</div>
      </div>
      <div class="status-dot-sm" style="background:${dotColor}"></div>
    `;
    container.appendChild(el);
  });
}

function syncKpiBar() {
  const list = filteredTrucks.length ? filteredTrucks : trucks;
  let total=list.length, ok=0, warn=0, crit=0, empty=0, totalPos=0;
  list.forEach(t => {
    t.positions.forEach(p => {
      totalPos++;
      if (p.state==='ok')    ok++;
      else if (p.state==='warn')  warn++;
      else if (p.state==='crit')  crit++;
      else if (p.state==='empty') empty++;
    });
  });
  document.getElementById('kpiTrucks').textContent      = total + ' Camiones';
  document.getElementById('kpiTrucksTop').textContent   = total + ' Camiones';
  document.getElementById('kpiTotalPos').textContent    = totalPos + ' Pos. totales';
  document.getElementById('kpiOk').textContent          = ok + ' OK';
  document.getElementById('kpiWarn').textContent        = warn + ' Desgaste';
  document.getElementById('kpiCrit').textContent        = crit + ' Críticos';
  document.getElementById('kpiEmpty').textContent       = empty + ' Vacíos';
}
