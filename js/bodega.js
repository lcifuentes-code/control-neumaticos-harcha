// ============================================================
// NEUMATRACK · Bodega Los Lagos
// ============================================================

const BODEGA_LOCATIONS = ['Los Lagos','LOS LAGOS','los lagos','Bodega Los Lagos','BODEGA LOS LAGOS','Bodega'];

function isBodega(item) {
  if (!item) return false;
  const loc = (item.location||'').toLowerCase();
  return item.status==='stock' && (item.location||'').length > 0 && (
    BODEGA_LOCATIONS.some(l => loc.includes(l.toLowerCase()))
  );
}

function openBodega() {
  closeMenu();
  document.getElementById('bodegaNewBtn').disabled = role==='guest';
  renderBodega();
  document.getElementById('bodegaBackdrop').style.display = 'flex';
}

function closeBodega(ev) {
  if (ev && ev.target.id !== 'bodegaBackdrop') return;
  document.getElementById('bodegaBackdrop').style.display = 'none';
}

function openBodegaForm() {
  closeBodega();
  openInventory();
  setTimeout(() => {
    openInvForm();
    const locEl = document.getElementById('fLoc');
    if (locEl) locEl.value = 'Bodega Los Lagos';
  }, 200);
}

function renderBodega() {
  const list = document.getElementById('bodegaList');
  if (!list) return;
  const q = (document.getElementById('bodegaSearch')?.value||'').toLowerCase();

  let items = inventory.filter(i => i.status==='stock' && (
    (i.location||'').toLowerCase().includes('los lagos') ||
    (i.location||'').toLowerCase().includes('bodega')
  ));
  if (q) items = items.filter(i =>
    (i.code||'').toLowerCase().includes(q) ||
    (i.brand||'').toLowerCase().includes(q) ||
    (i.size||'').toLowerCase().includes(q)
  );

  if (!items.length) {
    list.innerHTML = '<div style="color:#64748b;text-align:center;padding:24px;">Sin neumáticos en bodega. Agrega nuevos con el botón "+ Agregar".</div>';
    return;
  }

  list.innerHTML = items.map(i => {
    const condName = i.condition==='new'?'Nuevo':i.condition==='used'?'Usado':'Recauchado';
    const condColor = i.condition==='new'?'#22c55e':i.condition==='used'?'#fbbf24':'#a78bfa';
    const truckOpts = trucks.map(t =>
      `<option value="${t.id}">${t.num} — ${t.plate} (${t.faena})</option>`
    ).join('');

    return `
    <div style="background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:12px 14px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div style="color:#93c5fd;font-size:15px;font-weight:700;">${i.code}</div>
          <div style="color:#9ca3af;font-size:12px;margin-top:3px;">
            ${i.brand||'—'} &nbsp;·&nbsp; ${i.size||'—'} &nbsp;·&nbsp;
            <span style="color:${condColor}">${condName}</span>
            ${i.depth ? '&nbsp;·&nbsp; '+i.depth+'mm' : ''}
          </div>
          <div style="color:#64748b;font-size:11px;margin-top:2px;">📍 ${i.location||'Bodega'} &nbsp;·&nbsp; Ingreso: ${i.entryDate||'—'}</div>
        </div>
        <div style="background:rgba(34,197,94,.12);color:#86efac;border:1px solid rgba(34,197,94,.3);border-radius:8px;padding:4px 8px;font-size:10px;letter-spacing:.1em;white-space:nowrap;">EN STOCK</div>
      </div>
      ${role!=='guest' ? `
      <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <select id="bodega_truck_${i.code.replace(/[^a-z0-9]/gi,'_')}"
          onchange="updateBodegaPosOptions('${i.code.replace(/[^a-z0-9]/gi,'_')}')"
          style="flex:1;min-width:180px;border-radius:8px;border:1px solid #1f2937;background:#020b1a;padding:7px 8px;color:#e5e7eb;font-size:11px;">
          <option value="">— Seleccionar camión —</option>
          ${truckOpts}
        </select>
        <select id="bodega_pos_${i.code.replace(/[^a-z0-9]/gi,'_')}" style="width:90px;border-radius:8px;border:1px solid #1f2937;background:#020b1a;padding:7px 8px;color:#e5e7eb;font-size:11px;">
          <option value="">Pos.</option>
        </select>
        <button style="border-radius:8px;border:none;background:#2563eb;color:#e5f0ff;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;"
          onclick="transferFromBodega('${i.code}')">➜ Transferir</button>
      </div>` : ''}
    </div>`;
  }).join('');
}

// BUG FIX: Generar opciones de posición dinámicamente según el camión seleccionado
function updateBodegaPosOptions(safeId) {
  const truckSel = document.getElementById('bodega_truck_' + safeId);
  const posSel   = document.getElementById('bodega_pos_' + safeId);
  if (!truckSel || !posSel) return;

  posSel.innerHTML = '<option value="">Pos.</option>';

  const truck = trucks.find(t => String(t.id) === truckSel.value);
  if (!truck) return;

  // Solo mostrar posiciones vacías
  truck.positions.forEach(p => {
    const isEmpty = !p.tireCode || p.state === 'empty';
    const opt = document.createElement('option');
    opt.value = p.code;
    opt.textContent = p.code + (isEmpty ? '' : ' (ocupada)');
    opt.disabled = !isEmpty;
    posSel.appendChild(opt);
  });
}

async function transferFromBodega(code) {
  const safeId = code.replace(/[^a-z0-9]/gi,'_');
  const truckSel = document.getElementById('bodega_truck_'+safeId);
  const posSel   = document.getElementById('bodega_pos_'+safeId);
  if (!truckSel?.value) { showToast('Selecciona un camión.'); return; }
  if (!posSel?.value)   { showToast('Selecciona una posición.'); return; }

  const truck = trucks.find(t=>String(t.id)===truckSel.value);
  const posCode = posSel.value;
  if (!truck) { showToast('Camión no encontrado.'); return; }

  const pos = truck.positions.find(p=>p.code===posCode);
  if (!pos) { showToast('Posición no encontrada.'); return; }
  if (pos.tireCode) { showToast('⚠ Esa posición ya tiene un neumático asignado.'); return; }

  currentTruckId = truck.id;
  currentSelectedPosCode = posCode;

  const [r1, r2] = await Promise.all([
    sb.from('inventory').update({status:'installed',truck_num:truck.num,pos_code:posCode,updated_at:new Date().toISOString()}).eq('code',code),
    sb.from('positions').update({tire_code:code,state:'ok',notes:'Asignado desde Bodega Los Lagos',updated_at:new Date().toISOString()}).eq('truck_id',truck.id).eq('code',posCode)
  ]);
  if (r1.error||r2.error) { showToast('❌ Error al transferir.'); return; }

  await addHistory('asignar', `Bodega → ${truck.num}/${posCode}: ${code}`);
  await addTireHistory(code, 'instalacion', {
    truckNum: truck.num, posCode: posCode, faena: truck.faena,
    notes: 'Instalado desde Bodega Los Lagos'
  });
  await loadAllData();
  renderFleet(); syncKpiBar(); syncInvCounts();
  renderBodega();
  if (currentTruckId) selectTruck(currentTruckId);
  showToast(code + ' transferido a ' + truck.num + ' / ' + posCode);
}
