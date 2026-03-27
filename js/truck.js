// ============================================================
// NEUMATRACK · Gestión de Camiones y Posiciones
// ============================================================

function selectTruck(id) {
  currentTruckId = id;
  currentSelectedPosCode = null;
  document.querySelectorAll('.truck-item').forEach((el, idx) => {
    if (filteredTrucks[idx]) el.classList.toggle('active', filteredTrucks[idx].id === id);
  });

  const truck = trucks.find(t=>t.id===id);
  if (!truck) return;

  document.getElementById('truckTitle').textContent = truck.num;
  document.getElementById('truckSub').textContent   = 'PATENTE: ' + truck.plate + ' · ' + truck.model;
  document.getElementById('truckFaenaChip').innerHTML = '📍 ' + truck.faena;

  const grid = document.getElementById('positionsGrid');
  grid.innerHTML = '';
  truck.positions.forEach(pos => {
    const card = document.createElement('div');
    card.className = 'pos-card';
    card.onclick = () => selectPosition(pos);

    const sc = pos.state==='ok'?'#22c55e':pos.state==='warn'?'#fbbf24':pos.state==='crit'?'#ef4444':'#94a3b8';
    card.innerHTML = `
      <div class="pos-label">${pos.label}</div>
      <div class="pos-code" style="color:${sc}">${pos.code} · ${stateLabel(pos.state)}</div>
      <div class="pos-notes">${pos.tireCode ? 'Neumático: '+pos.tireCode : 'Sin neumático'}</div>
    `;
    grid.appendChild(card);
  });

  clearSelectionUI();
  setRightTab('detalle');
  renderAlerts(truck);
  renderDiagram(truck);
}

function clearSelectionUI() {
  currentSelectedPosCode = null;
  document.querySelectorAll('.hotspot').forEach(h=>h.classList.remove('active'));
  document.querySelectorAll('.pos-card').forEach(c=>c.classList.remove('active'));
  document.getElementById('infoPos').textContent   = 'Seleccione una rueda del diagrama';
  document.getElementById('infoCode').textContent  = '—';
  document.getElementById('infoState').textContent = '—';
  document.getElementById('infoNotes').textContent = '—';
  document.getElementById('editPosForm').style.display = 'none';
  document.getElementById('btnEditPos').style.display  = 'none';
}

function selectPosition(pos) {
  currentSelectedPosCode = pos.code;
  const truck = trucks.find(t=>t.id===currentTruckId);
  const idx = truck ? truck.positions.findIndex(p=>p.code===pos.code) : -1;

  document.querySelectorAll('.pos-card').forEach((c,i)=>c.classList.toggle('active', i===idx));
  document.querySelectorAll('.hotspot').forEach(h=>h.classList.remove('active'));
  const hs = document.querySelector('.hs-' + pos.code.toLowerCase());
  if (hs) hs.classList.add('active');

  document.getElementById('infoPos').textContent   = pos.label + ' (' + pos.code + ')';
  document.getElementById('infoCode').textContent  = pos.tireCode || '—';
  document.getElementById('infoState').textContent = stateLabel(pos.state);
  document.getElementById('infoNotes').textContent = pos.notes || '—';

  const canEdit = role !== 'guest';
  document.getElementById('btnEditPos').style.display = canEdit ? 'block' : 'none';
  document.getElementById('editPosForm').style.display = 'none';

  if (document.getElementById('invBackdrop').style.display !== 'none') renderInventory();
}

function selectPosByCode(code) {
  const truck = trucks.find(t=>t.id===currentTruckId);
  if (!truck) return;
  const pos = truck.positions.find(p=>p.code===code);
  if (!pos) return;

  currentSelectedPosCode = code;
  renderDiagram(truck);
  openTireClick(pos, truck);
}

// ── Modal click en neumático ───────────────────────────────
function openTireClick(pos, truck) {
  const inv = inventory.find(i=>i.code===pos.tireCode);
  const stateColors = {ok:'#22c55e',warn:'#fbbf24',crit:'#ef4444',empty:'#94a3b8'};
  const stateNames  = {ok:'✅ Buen estado',warn:'⚠️ Desgaste',crit:'🔴 Crítico',empty:'⬜ Sin neumático'};
  const col = stateColors[pos.state]||'#94a3b8';

  document.getElementById('tireClickTitle').innerHTML =
    `<span style="color:${col}">●</span> ${pos.code} — ${pos.label}`;

  let body = '';

  if (!pos.tireCode || pos.state==='empty') {
    const stockItems = inventory.filter(i=>i.status==='stock');
    const opts = stockItems.map(i=>
      `<option value="${i.code}">${i.code} — ${i.brand||'—'} ${i.size||''} (${i.condition==='new'?'Nuevo':i.condition==='used'?'Usado':'Recauchado'})</option>`
    ).join('');

    body = `
      <div style="color:#94a3b8;font-size:12px;margin-bottom:14px;">Esta posición no tiene neumático asignado.</div>
      ${role!=='guest' ? `
      <div class="f wide" style="margin-bottom:12px;">
        <label style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9ca3af;margin-bottom:6px;display:block;">SELECCIONAR NEUMÁTICO EN STOCK</label>
        <select id="tirePickSelect" style="width:100%;border-radius:10px;border:1px solid #1f2937;background:#020b1a;padding:9px 10px;color:#e5e7eb;font-size:12px;">
          <option value="">— Elegir neumático —</option>
          ${opts}
        </select>
        <div style="margin-top:6px;font-size:11px;color:#64748b;">
          ¿No está en la lista?
          <button type="button" onclick="closeTireClick();openInventory();" style="background:none;border:none;color:#3b82f6;cursor:pointer;font-size:11px;padding:0;">Ir a inventario para crear uno</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
        <button class="btn-cancel" type="button" onclick="closeTireClick()">Cancelar</button>
        <button class="btn-save" type="button" onclick="assignFromClick('${pos.code}')">Asignar</button>
      </div>` : '<div style="color:#9ca3af;font-size:11px;">Inicia sesión como Editor o Admin para asignar.</div>'}
    `;
  } else if (inv && inv.status==='retired') {
    body = `
      <div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:12px;margin-bottom:12px;">
        <div style="color:#fca5a5;font-weight:700;font-size:13px;margin-bottom:8px;">🗑️ Neumático dado de baja</div>
        <div style="color:#e5e7eb;font-size:12px;line-height:1.8;">
          <b>Código:</b> ${inv.code}<br>
          <b>Motivo:</b> ${inv.retReason||'—'}<br>
          <b>Km/Hr retiro:</b> ${inv.retKm||'—'}<br>
          <b>Autorizado por:</b> ${inv.retAuth||'—'}<br>
          <b>Notas:</b> ${inv.retNotes||'—'}
        </div>
        ${inv.retPhoto ? `<img src="${inv.retPhoto}" style="margin-top:10px;max-width:100%;max-height:200px;border-radius:10px;border:1px solid #374151;" />` : ''}
      </div>
      <div style="display:flex;justify-content:flex-end;">
        <button class="btn-cancel" type="button" onclick="closeTireClick()">Cerrar</button>
      </div>
    `;
  } else if (inv) {
    const condName = inv.condition==='new'?'Nuevo':inv.condition==='used'?'Usado':'Recauchado';
    body = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Código</div>
          <div style="color:#93c5fd;font-size:15px;font-weight:700;margin-top:2px;">${inv.code}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Estado</div>
          <div style="color:${col};font-size:13px;font-weight:600;margin-top:2px;">${stateNames[pos.state]}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Marca / Medida</div>
          <div style="color:#e5e7eb;font-size:13px;margin-top:2px;">${inv.brand||'—'} ${inv.size||''}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Condición</div>
          <div style="color:#e5e7eb;font-size:13px;margin-top:2px;">${condName}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Km Ingreso</div>
          <div style="color:#e5e7eb;font-size:13px;margin-top:2px;">${inv.entryKm||0}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;">
          <div style="color:#64748b;font-size:10px;letter-spacing:.1em;text-transform:uppercase;">Profundidad</div>
          <div style="color:#e5e7eb;font-size:13px;margin-top:2px;">${inv.depth||'—'} mm</div>
        </div>
      </div>
      ${pos.notes ? `<div style="color:#9ca3af;font-size:12px;margin-bottom:12px;"><b>Notas:</b> ${pos.notes}</div>` : ''}
      <details style="margin-bottom:12px;">
        <summary style="color:#6366f1;font-size:11px;cursor:pointer;letter-spacing:.08em;font-weight:600;">📋 VER HISTORIAL DE ESTE NEUMÁTICO</summary>
        <div style="margin-top:10px;padding:10px;background:#020b1a;border-radius:10px;max-height:250px;overflow-y:auto;">
          ${buildTireLifeHTML(inv.code)}
        </div>
      </details>
      ${role!=='guest' ? `
      <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
        <button class="btn-cancel" type="button" onclick="closeTireClick()">Cerrar</button>
        <button class="btn-cancel" style="border-color:#0369a1;color:#7dd3fc;" type="button"
          onclick="openReturnBodega('${inv.code}')">🔄 Devolver a Bodega</button>
        <button class="btn-cancel" style="border-color:#7f1d1d;color:#fca5a5;" type="button"
          onclick="closeTireClick();openRetireForm('${inv.code}')">🗑 Dar de baja</button>
        <button class="btn-save" type="button" onclick="openEditFromClick('${pos.code}')">✏️ Editar posición</button>
      </div>` : `<div style="display:flex;justify-content:flex-end;"><button class="btn-cancel" type="button" onclick="closeTireClick()">Cerrar</button></div>`}
    `;
  } else {
    body = `<div style="color:#9ca3af;font-size:12px;">Sin información del neumático.</div>
      <div style="display:flex;justify-content:flex-end;margin-top:12px;">
        <button class="btn-cancel" type="button" onclick="closeTireClick()">Cerrar</button>
      </div>`;
  }

  document.getElementById('tireClickBody').innerHTML = body;
  document.getElementById('tireClickBackdrop').style.display = 'flex';
}

function closeTireClick(ev) {
  if (ev && ev.target.id !== 'tireClickBackdrop') return;
  document.getElementById('tireClickBackdrop').style.display = 'none';
}

function assignFromClick(posCode) {
  const sel = document.getElementById('tirePickSelect');
  if (!sel || !sel.value) { showToast('Selecciona un neumático primero.'); return; }
  currentSelectedPosCode = posCode;
  closeTireClick();
  assignInventory(sel.value);
}

function openEditFromClick(posCode) {
  currentSelectedPosCode = posCode;
  closeTireClick();
  showEditPosForm();
}

// ── Editar posición ────────────────────────────────────────
function showEditPosForm() {
  const truck = trucks.find(t=>t.id===currentTruckId);
  if (!truck) return;
  const pos = truck.positions.find(p=>p.code===currentSelectedPosCode);
  if (!pos) return;

  document.getElementById('editPosCode').textContent = pos.code;
  document.getElementById('editPosState').value = pos.state;
  document.getElementById('editPosTireCode').value = pos.tireCode||'';
  document.getElementById('editPosNotes').value = pos.notes||'';
  document.getElementById('editPosForm').style.display = 'block';
  document.getElementById('btnEditPos').style.display = 'none';
}

function cancelEditPos() {
  document.getElementById('editPosForm').style.display = 'none';
  document.getElementById('btnEditPos').style.display = role!=='guest' ? 'block' : 'none';
}

async function savePosition() {
  if (role==='guest') return;
  const truck = trucks.find(t=>t.id===currentTruckId);
  if (!truck) return;
  const pos = truck.positions.find(p=>p.code===currentSelectedPosCode);
  if (!pos) return;

  const state    = document.getElementById('editPosState').value;
  const tireCode = document.getElementById('editPosTireCode').value.trim();
  const notes    = document.getElementById('editPosNotes').value.trim();

  const btn = document.querySelector('#editPosForm .btn-save');
  btn.disabled = true; btn.textContent = 'Guardando...';

  const { error } = await sb.from('positions')
    .update({ state, tire_code: tireCode, notes, updated_at: new Date().toISOString() })
    .eq('truck_id', currentTruckId)
    .eq('code', pos.code);

  btn.disabled = false; btn.textContent = 'Guardar';

  if (error) { showToast('Error: ' + error.message); return; }

  pos.state    = state;
  pos.tireCode = tireCode;
  pos.notes    = notes;

  await addHistory('posicion', `Posición ${pos.code} de ${truck.num} actualizada → ${stateLabel(state)}`);

  selectTruck(currentTruckId);
  selectPosByCode(pos.code);
  syncKpiBar();
  cancelEditPos();
  showToast('Posición actualizada correctamente.');
}

// ── Historial y alertas ────────────────────────────────────
function renderHistoryPanel() {
  const c = document.getElementById('historyList');
  if (!c) return;
  if (!historyLog.length) { c.innerHTML='<div class="right-muted">Sin movimientos registrados.</div>'; return; }
  c.innerHTML = '';
  historyLog.slice(0,50).forEach(h => {
    const row = document.createElement('div');
    row.className = 'right-row';
    row.innerHTML = `<strong>${h.ts.slice(0,16).replace('T',' ')} · ${h.type}</strong><div class="right-muted">${h.text}</div>`;
    c.appendChild(row);
  });
}

function renderAlerts(truck) {
  const c = document.getElementById('alertsList');
  if (!c) return;
  const crits = (truck?.positions||[]).filter(p=>p.state==='crit');
  const warns = (truck?.positions||[]).filter(p=>p.state==='warn');
  if (!crits.length && !warns.length) { c.innerHTML='<div class="right-muted">Sin alertas activas.</div>'; return; }
  c.innerHTML='';
  crits.forEach(p=>{
    c.innerHTML+=`<div class="right-row"><strong style="color:#ef4444">🔴 CRÍTICO ${p.code}</strong><div class="right-muted">${p.notes}</div></div>`;
  });
  warns.forEach(p=>{
    c.innerHTML+=`<div class="right-row"><strong style="color:#fbbf24">🟡 DESGASTE ${p.code}</strong><div class="right-muted">${p.notes}</div></div>`;
  });
}

// ── CRUD Camión ────────────────────────────────────────────
function handleEdit() {
  if (role==='guest') return;
  const truck = trucks.find(t=>t.id===currentTruckId);
  if (!truck) { alert('No hay camión seleccionado.'); return; }

  window.__editingTruckId = truck.id;
  window.__truckModel = truck.model_key||'M1';
  document.getElementById('truckModalTitle').textContent = 'EDITAR CAMIÓN';
  document.getElementById('btnDeleteTruck').style.display = role==='admin' ? 'block' : 'none';
  document.getElementById('tNum').value   = truck.num;
  document.getElementById('tPlate').value = truck.plate;
  document.getElementById('tFaena').value = truck.faena;
  document.getElementById('tModel').value = truck.model;
  document.getElementById('tNotes').value = truck.notes||'';
  markTruckModelActive(window.__truckModel);
  document.getElementById('truckBackdrop').style.display='flex';
}

function openNewTruckModal() {
  if (role==='guest') return;
  window.__editingTruckId = null;
  window.__truckModel = 'M1';
  document.getElementById('truckModalTitle').textContent = 'NUEVO CAMIÓN';
  document.getElementById('btnDeleteTruck').style.display = 'none';
  ['tNum','tPlate','tFaena','tModel','tNotes'].forEach(id=>{document.getElementById(id).value='';});
  markTruckModelActive('M1');
  document.getElementById('truckBackdrop').style.display='flex';
}

function closeTruckModal(ev) {
  if (ev && ev.target && ev.target.id!=='truckBackdrop') return;
  document.getElementById('truckBackdrop').style.display='none';
  window.__editingTruckId = null;
}

function markTruckModelActive(key) {
  document.querySelectorAll('.truck-model-card').forEach(btn=>{
    btn.classList.toggle('active', btn.getAttribute('data-model')===key);
  });
}

function selectTruckModel(key) {
  window.__truckModel = key;
  markTruckModelActive(key);
}

async function saveTruck() {
  if (role==='guest') return;
  const num   = (document.getElementById('tNum').value||'').trim();
  const plate = (document.getElementById('tPlate').value||'').trim();
  const faena = (document.getElementById('tFaena').value||'').trim();
  const model = (document.getElementById('tModel').value||'').trim();
  const notes = (document.getElementById('tNotes').value||'').trim();
  if (!num) { alert('El número/código del camión es obligatorio.'); return; }

  const modelKey = window.__truckModel||'M1';
  const posCount = modelKey==='M1'?10:modelKey==='M2'?12:modelKey==='M3'?12:14;
  const fullModel = model + ' · ' + posCount + ' POS. · MODELO '+modelKey.replace('M','');

  const payload = { num, plate, faena, model:fullModel, model_key:modelKey, notes, updated_at:new Date().toISOString() };

  const btn = document.getElementById('btnSaveTruck');
  btn.disabled=true; btn.textContent='Guardando...';

  let error;
  if (window.__editingTruckId) {
    ({error} = await sb.from('trucks').update(payload).eq('id', window.__editingTruckId));
    if (!error) await addHistory('camion', `Edición camión ${num}`);
  } else {
    const {data:newTruck, error:e} = await sb.from('trucks').insert(payload).select().single();
    error = e;
    if (!error && newTruck) {
      // BUG FIX: Crear posiciones según el modelo seleccionado
      await sb.from('positions').insert(defaultPositions(newTruck.id, modelKey));
      await addHistory('camion', `Nuevo camión ${num}`);
    }
  }

  btn.disabled=false; btn.textContent='Guardar';

  if (error) { showToast('Error: '+error.message); return; }

  await loadAllData();
  filteredTrucks = [...trucks];
  renderFleet(); syncKpiBar();
  const updated = trucks.find(t=>t.num===num);
  if (updated) selectTruck(updated.id);
  closeTruckModal();
  showToast('Camión guardado correctamente.');
}

async function deleteTruck() {
  if (role!=='admin') { alert('Solo los admins pueden eliminar camiones.'); return; }
  const truck = trucks.find(t=>t.id===window.__editingTruckId);
  if (!truck) return;
  if (!confirm(`¿Eliminar camión ${truck.num}? Esta acción no se puede deshacer.`)) return;

  const {error} = await sb.from('trucks').update({active:false, updated_at:new Date().toISOString()}).eq('id', truck.id);
  if (error) { showToast('Error: '+error.message); return; }

  await addHistory('camion', `Eliminado camión ${truck.num}`);
  closeTruckModal();
  await loadAllData();
  filteredTrucks = [...trucks];
  renderFleet(); syncKpiBar();
  if (trucks.length>0) selectTruck(trucks[0].id);
  showToast('Camión eliminado.');
}
