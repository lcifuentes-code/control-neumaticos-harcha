// ============================================================
// NEUMATRACK · Exportar Excel
// ============================================================

function _fmtD(iso){if(!iso)return'';try{return new Date(iso).toLocaleDateString('es-CL');}catch(e){return String(iso||'');}}
function _fmtDT(iso){if(!iso)return'';try{var d=new Date(iso);return d.toLocaleDateString('es-CL')+' '+d.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});}catch(e){return String(iso||'');}}
function _st(s){return s==='ok'?'Buen Estado':s==='warn'?'Desgaste':s==='crit'?'Crítico':'Sin Neumático';}
function _cond(v){return v==='new'?'Nuevo':v==='used'?'Usado':v==='retread'?'Recauchado':'';}
function _statLabel(v){return{stock:'En Stock',installed:'Instalado',retired:'Retirado',repair:'En Reparación',retread:'En Recauchaje'}[v]||'';}
function _lado(code){return['P01','P03','P04','P07','P08','P11','P13'].includes(code)?'IZQ':'DER';}
function _tipo(code){return['P01','P02'].includes(code)?'Simple':['P03','P06','P07','P10','P11','P12','P13','P14'].includes(code)?'Ext.':'Int.';}
function _ht(t){return{mov:'Movimiento',ok:'Registro',crit:'Crítico',alta:'Alta',baja:'Baja',editar:'Edición',asignar:'Asignación',sistema:'Sistema',posicion:'Posición',camion:'Camión',reparacion:'Reparación',inspeccion:'Inspección',recauchaje:'Recauchaje',transferencia:'Transferencia'}[t]||t||'';}

function _xlsxDownload(sheets, filename) {
  if (typeof XLSX==='undefined'){showToast('❌ Librería Excel no disponible.');return;}
  var wb=XLSX.utils.book_new();
  sheets.forEach(function(s){var ws=XLSX.utils.aoa_to_sheet(s.rows);if(s.cols)ws['!cols']=s.cols.map(function(w){return{wch:w};});XLSX.utils.book_append_sheet(wb,ws,s.name);});
  XLSX.writeFile(wb,filename);
  showToast('✅ Descargado: '+filename);
}

// ── Excel General ──────────────────────────────────────────
function exportExcel() {
  closeMenu(); showToast('Generando Excel…');
  var date=new Date().toISOString().slice(0,10);
  try {
    if(typeof XLSX==='undefined'){showToast('❌ Recarga la página.');return;}
    var invRows=[['Código','Marca','Medida','Condición','Estado','Fecha Ingreso','Km Ingreso','Notas','Camión','Posición','Razón Retiro','Km Retiro','Autoriza Retiro']];
    inventory.forEach(function(i){invRows.push([i.code||'',i.brand||'',i.size||'',_cond(i.condition),_statLabel(i.status),_fmtD(i.entryDate),i.entryKm||0,i.notes||'',i.truckNum||'',i.posCode||'',i.retReason||'',i.retKm||'',i.retAuth||'']);});

    var estRows=[['Camión','Patente','Faena','Posición','Descripción','Código Neumático','Marca','Medida','Estado','Km','Notas']];
    trucks.forEach(function(t){t.positions.forEach(function(p){var iv=inventory.find(function(i){return i.code===p.tireCode;});estRows.push([t.num,t.plate,t.faena,p.code,p.label,p.tireCode||'',iv?iv.brand:'',iv?iv.size:'',_st(p.state),iv?iv.entryKm:0,p.notes||'']);});});

    var histRows=[['Fecha','Tipo','Descripción','Usuario']];
    historyLog.forEach(function(h){histRows.push([_fmtDT(h.ts),_ht(h.type),h.text||'',h.user||'']);});
    if(!historyLog.length) histRows.push(['Sin registros','','','']);

    _xlsxDownload([
      {name:'Inventario',rows:invRows,cols:[10,12,10,10,12,14,10,20,8,8,14,10,14]},
      {name:'Estado Camiones',rows:estRows,cols:[8,10,16,8,24,14,10,8,14,10,20]},
      {name:'Historial',rows:histRows,cols:[22,14,64,16]}
    ],'NEUMATICOS_HARCHA_'+date+'.xlsx');
  } catch(e){console.error(e);showToast('❌ Error: '+e.message);}
}

// ── Reporte por Camión ─────────────────────────────────────
function openReporte() {
  if(!currentTruckId){showToast('Selecciona un camión primero.');return;}
  var truck=trucks.find(function(t){return t.id===currentTruckId;});
  if(!truck){showToast('Camión no encontrado.');return;}
  showToast('Generando reporte…');
  var date=new Date().toISOString().slice(0,10);
  try {
    var detRows=[['Posición','Descripción','Lado','Tipo','Código Neumático','Marca','Medida','Condición','Estado','Prof. mm','Km Ingreso','Notas']];
    truck.positions.forEach(function(p){var iv=inventory.find(function(i){return i.code===p.tireCode;});detRows.push([p.code,p.label,_lado(p.code),_tipo(p.code),p.tireCode||'Sin asignar',iv?iv.brand:'',iv?iv.size:'',iv?_cond(iv.condition):'',_st(p.state),iv?iv.depth:'',iv?iv.entryKm:0,p.notes||'']);});
    var histRows=[['Fecha','Tipo','Descripción','Usuario']];
    var truckHist=historyLog.filter(function(h){return h.text&&(h.text.indexOf(truck.num)>=0);});
    if(truckHist.length){truckHist.forEach(function(h){histRows.push([_fmtDT(h.ts),_ht(h.type),h.text||'',h.user||'']);});}else{histRows.push(['Sin historial','','','']);}
    _xlsxDownload([
      {name:'Posiciones '+truck.num,rows:detRows,cols:[8,24,6,8,16,10,8,10,12,10,10,22]},
      {name:'Historial',rows:histRows,cols:[20,14,60,16]}
    ],'REPORTE_'+truck.num+'_'+date+'.xlsx');
  } catch(e){console.error(e);showToast('❌ Error: '+e.message);}
}

// ══════════════════════════════════════════════════════════
// REPORTE DE VIDA DEL NEUMÁTICO (NUEVO)
// ══════════════════════════════════════════════════════════
function exportTireLife(code) {
  const inv = inventory.find(i=>i.code===code);
  if (!inv) { showToast('Neumático no encontrado.'); return; }
  showToast('Generando reporte de vida…');
  const date = new Date().toISOString().slice(0,10);
  const events = tireHistory[code] || [];
  const loc = getTireLocation(code);

  try {
    // Pestaña 1: Ficha
    var fichaRows = [
      ['REPORTE DE VIDA — NEUMÁTICO ' + code, '', '', ''],
      ['', '', '', ''],
      ['Código:', code, 'Marca:', inv.brand||'—'],
      ['Medida:', inv.size||'—', 'Condición:', _cond(inv.condition)],
      ['Estado actual:', _statLabel(inv.status), 'Ubicación:', loc.text],
      ['Fecha ingreso:', _fmtD(inv.entryDate), 'Km ingreso:', inv.entryKm||0],
      ['Fecha reporte:', new Date().toLocaleDateString('es-CL'), '', ''],
      ['', '', '', ''],
      ['RESUMEN', '', '', ''],
      ['Total eventos:', events.length, '', ''],
      ['Instalaciones:', events.filter(e=>e.event_type==='instalacion').length, '', ''],
      ['Reparaciones:', events.filter(e=>e.event_type==='reparacion').length, '', ''],
      ['Inspecciones:', events.filter(e=>e.event_type==='inspeccion').length, '', ''],
      ['Recauchajes:', events.filter(e=>e.event_type==='recauchaje').length, '', ''],
      ['Transferencias:', events.filter(e=>e.event_type==='transferencia').length, '', ''],
    ];

    // Pestaña 2: Timeline completo
    var timeRows = [['Fecha', 'Evento', 'Camión', 'Posición', 'Faena', 'Km', 'Responsable', 'Tipo Reparación', 'Proveedor', 'Prof. mm', 'Presión PSI', 'Estado Visual', 'Destino', 'Notas', 'Usuario']];
    events.forEach(function(e) {
      timeRows.push([
        _fmtDT(e.created_at), _ht(e.event_type), e.truck_num||'', e.pos_code||'',
        e.faena||'', e.km||'', e.responsible||'', e.repair_type||'',
        e.provider||'', e.depth_mm||'', e.pressure_psi||'',
        e.visual_state||'', e.destination||'', e.notes||'', e.user_email||''
      ]);
    });
    if (!events.length) timeRows.push(['Sin eventos registrados','','','','','','','','','','','','','','']);

    // Pestaña 3: Inspecciones
    var inspRows = [['Fecha', 'Profundidad mm', 'Presión PSI', 'Estado Visual', 'Km', 'Responsable', 'Notas']];
    events.filter(e=>e.event_type==='inspeccion').forEach(function(e) {
      inspRows.push([_fmtDT(e.created_at), e.depth_mm||'', e.pressure_psi||'', e.visual_state||'', e.km||'', e.responsible||'', e.notes||'']);
    });
    if (inspRows.length===1) inspRows.push(['Sin inspecciones','','','','','','']);

    _xlsxDownload([
      {name:'Ficha '+code, rows:fichaRows, cols:[18,14,18,14]},
      {name:'Timeline', rows:timeRows, cols:[20,14,10,8,14,10,14,14,14,10,10,14,14,24,16]},
      {name:'Inspecciones', rows:inspRows, cols:[20,14,12,16,10,14,24]}
    ], 'VIDA_NEUMATICO_'+code+'_'+date+'.xlsx');
  } catch(e) {
    console.error(e); showToast('❌ Error: '+e.message);
  }
}
