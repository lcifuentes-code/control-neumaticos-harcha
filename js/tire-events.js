// ============================================================
// NEUMATRACK · Registro de Eventos del Neumático
// ============================================================

function openEventForm(tireCode, eventType) {
  currentEventTireCode = tireCode;
  const inv = inventory.find(i=>i.code===tireCode);
  const loc = getTireLocation(tireCode);

  document.getElementById('evtTireCode').textContent = tireCode;
  document.getElementById('evtTireInfo').textContent = (inv?.brand||'—')+' · '+(inv?.size||'—')+' · '+loc.text;

  // Reset form
  ['evtResponsible','evtKm','evtNotes','evtProvider','evtRepairType','evtDestination','evtReturnDate','evtDepth','evtPressure','evtVisual'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });

  // Show/hide fields by type
  const titles = {reparacion:'🔧 REGISTRAR REPARACIÓN', inspeccion:'🔍 REGISTRAR INSPECCIÓN', recauchaje:'♻️ REGISTRAR RECAUCHAJE', transferencia:'🚚 REGISTRAR TRANSFERENCIA'};
  document.getElementById('evtModalTitle').textContent = titles[eventType]||'REGISTRAR EVENTO';
  document.getElementById('evtType').value = eventType;

  document.getElementById('evtRepairFields').style.display = eventType==='reparacion' ? 'contents' : 'none';
  document.getElementById('evtInspFields').style.display = eventType==='inspeccion' ? 'contents' : 'none';
  document.getElementById('evtRetreadFields').style.display = eventType==='recauchaje' ? 'contents' : 'none';
  document.getElementById('evtTransferFields').style.display = eventType==='transferencia' ? 'contents' : 'none';

  document.getElementById('evtBackdrop').style.display = 'flex';
}

function closeEventForm(ev) {
  if (ev && ev.target.id !== 'evtBackdrop') return;
  document.getElementById('evtBackdrop').style.display = 'none';
  currentEventTireCode = null;
}

async function saveEvent() {
  if (role==='guest' || !currentEventTireCode) return;
  const code = currentEventTireCode;
  const eventType = document.getElementById('evtType').value;
  const responsible = document.getElementById('evtResponsible').value.trim();
  const km = document.getElementById('evtKm').value;
  const notes = document.getElementById('evtNotes').value.trim();
  const inv = inventory.find(i=>i.code===code);

  const opts = {
    responsible, km, notes,
    truckNum: inv?.truckNum||'', posCode: inv?.posCode||'',
    faena: inv?.truckNum ? (trucks.find(t=>t.num===inv.truckNum)?.faena||'') : '',
  };

  // Campos específicos
  if (eventType === 'reparacion') {
    opts.repairType = document.getElementById('evtRepairType').value;
    opts.provider = document.getElementById('evtProvider').value.trim();
    opts.returnDate = document.getElementById('evtReturnDate').value || null;
    if (!opts.repairType) { showToast('Selecciona el tipo de reparación.'); return; }
  }
  if (eventType === 'inspeccion') {
    opts.depthMm = document.getElementById('evtDepth').value;
    opts.pressurePsi = document.getElementById('evtPressure').value;
    opts.visualState = document.getElementById('evtVisual').value;
  }
  if (eventType === 'recauchaje') {
    opts.provider = document.getElementById('evtProvider').value.trim();
    opts.returnDate = document.getElementById('evtReturnDate').value || null;
    if (!opts.provider) { showToast('Ingresa la recauchadora.'); return; }
  }
  if (eventType === 'transferencia') {
    opts.destination = document.getElementById('evtDestination').value.trim();
    if (!opts.destination) { showToast('Ingresa la faena de destino.'); return; }
  }

  // Foto (opcional)
  const photoFile = document.getElementById('evtPhoto')?.files?.[0];
  if (photoFile) {
    showToast('Subiendo foto…');
    const ext = photoFile.name.split('.').pop();
    const path = `eventos/${code}_${eventType}_${Date.now()}.${ext}`;
    const res = await sb.storage.from('neumaticos-fotos').upload(path, photoFile, {upsert:true});
    if (!res.error) {
      const { data } = sb.storage.from('neumaticos-fotos').getPublicUrl(path);
      opts.photoUrl = data.publicUrl;
    }
  }

  const btn = document.querySelector('#evtBackdrop .btn-save');
  btn.disabled = true; btn.textContent = 'Guardando...';

  // Registrar evento
  const { error } = await addTireHistory(code, eventType, opts);
  if (error) { showToast('Error: '+error.message); btn.disabled=false; btn.textContent='Guardar'; return; }

  // Cambiar estado del inventario según evento
  if (eventType === 'reparacion' && inv) {
    await sb.from('inventory').update({status:'repair', truck_num:'', pos_code:'', updated_at:new Date().toISOString()}).eq('code', code);
    if (inv.status==='installed' && inv.truckNum && inv.posCode) {
      const truck = trucks.find(t=>t.num===inv.truckNum);
      if (truck) await sb.from('positions').update({state:'empty', tire_code:'', notes:'Neumático en reparación', updated_at:new Date().toISOString()}).eq('truck_id',truck.id).eq('code',inv.posCode);
    }
  }
  if (eventType === 'recauchaje' && inv) {
    await sb.from('inventory').update({status:'retread', truck_num:'', pos_code:'', updated_at:new Date().toISOString()}).eq('code', code);
    if (inv.status==='installed' && inv.truckNum && inv.posCode) {
      const truck = trucks.find(t=>t.num===inv.truckNum);
      if (truck) await sb.from('positions').update({state:'empty', tire_code:'', notes:'Neumático en recauchaje', updated_at:new Date().toISOString()}).eq('truck_id',truck.id).eq('code',inv.posCode);
    }
  }

  const typeLabels = {reparacion:'Reparación',inspeccion:'Inspección',recauchaje:'Recauchaje',transferencia:'Transferencia'};
  await addHistory(eventType, `${typeLabels[eventType]} neumático ${code}${opts.responsible?' · '+opts.responsible:''}`);

  btn.disabled = false; btn.textContent = 'Guardar';
  closeEventForm();
  await loadAllData();
  renderFleet(); syncKpiBar();
  if (currentTruckId) selectTruck(currentTruckId);

  // Refrescar vista si estamos en búsqueda
  if (document.getElementById('tireSearchBackdrop').style.display === 'flex') {
    showTireDetail(code);
  }

  showToast('✅ ' + typeLabels[eventType] + ' registrada para ' + code);
}

// ── Retorno de reparación / recauchaje ─────────────────────
function openReturnFromRepair(code) {
  const inv = inventory.find(i=>i.code===code);
  if (!inv) return;
  if (confirm(`¿Confirmar retorno de ${code} desde ${inv.status==='repair'?'reparación':'recauchaje'}?\nVolverá a estado "En Stock" en Bodega.`)) {
    doReturnFromRepair(code, inv);
  }
}

async function doReturnFromRepair(code, inv) {
  const newCondition = inv.status==='retread' ? 'retread' : inv.condition;
  await sb.from('inventory').update({
    status:'stock', condition:newCondition, location:'Bodega Los Lagos',
    truck_num:'', pos_code:'', updated_at:new Date().toISOString()
  }).eq('code', code);

  const eventType = inv.status==='repair' ? 'devolucion' : 'devolucion';
  await addTireHistory(code, 'devolucion', {
    notes: `Retorno de ${inv.status==='repair'?'reparación':'recauchaje'} a Bodega Los Lagos`
  });
  await addHistory('mov', `Retorno ${code} de ${inv.status==='repair'?'reparación':'recauchaje'} → Bodega`);

  await loadAllData();
  renderFleet(); syncKpiBar();
  if (document.getElementById('tireSearchBackdrop').style.display==='flex') showTireDetail(code);
  showToast(`✅ ${code} retornó a stock`);
}
