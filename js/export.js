// ============================================================
// NEUMATRACK · Exportar Excel
// BUG FIX: Funciones duplicadas eliminadas — ahora una sola copia
// ============================================================

function _fmtD(iso){ if(!iso)return''; try{return new Date(iso).toLocaleDateString('es-CL');}catch(e){return String(iso||'');} }
function _fmtDT(iso){ if(!iso)return''; try{var d=new Date(iso);return d.toLocaleDateString('es-CL')+' '+d.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});}catch(e){return String(iso||'');} }
function _st(s){ return s==='ok'?'Buen Estado':s==='warn'?'Desgaste':s==='crit'?'Crítico':'Sin Neumático'; }
function _cond(v){ return v==='new'?'Nuevo':v==='used'?'Usado':v==='retread'?'Recauchado':''; }
function _status(v){ return v==='stock'?'En Stock':v==='installed'?'Instalado':v==='retired'?'Retirado':''; }
function _lado(code){ return ['P01','P03','P04','P07','P08','P11','P13'].includes(code)?'IZQ':'DER'; }
function _tipo(code){ return ['P01','P02'].includes(code)?'Simple':['P03','P06','P07','P10','P11','P12','P13','P14'].includes(code)?'Ext.':'Int.'; }
function _ht(t){ var m={mov:'Movimiento',ok:'Registro',crit:'Crítico',alta:'Alta',baja:'Baja',editar:'Edición',asignar:'Asignación',sistema:'Sistema',posicion:'Posición',camion:'Camión'}; return (t&&m[t])?m[t]:(t||''); }

function _xlsxDownload(sheets, filename) {
  if (typeof XLSX === 'undefined') {
    showToast('❌ Librería Excel no disponible. Recarga la página.');
    return;
  }
  var wb = XLSX.utils.book_new();
  sheets.forEach(function(s) {
    var ws = XLSX.utils.aoa_to_sheet(s.rows);
    if (s.cols) ws['!cols'] = s.cols.map(function(w){ return {wch:w}; });
    XLSX.utils.book_append_sheet(wb, ws, s.name);
  });
  XLSX.writeFile(wb, filename);
  showToast('✅ Descargado: ' + filename);
}

// ── Exportar Excel General ─────────────────────────────────
function exportExcel() {
  closeMenu();
  showToast('Generando Excel…');
  var date = new Date().toISOString().slice(0,10);
  try {
    if (typeof XLSX === 'undefined') { showToast('❌ Recarga la página e intenta de nuevo.'); return; }

    // INVENTARIO
    var invRows = [[
      'Código','Marca','Medida','Condición','Estado',
      'Fecha Ingreso','Km Ingreso','Notas Ingreso',
      'Camión','Posición','Fecha Instalación','Km Instalación',
      'Fecha Retiro','Km/Hr Retiro','Duración Km',
      'Razón Retiro','Notas Retiro','Autoriza Retiro'
    ]];
    inventory.forEach(function(i){
      invRows.push([
        i.code||'', i.brand||'', i.size||'', _cond(i.condition), _status(i.status),
        _fmtD(i.entryDate), i.entryKm||0, i.notes||'',
        i.truckNum||'', i.posCode||'', '', '',
        i.retKm ? _fmtD(new Date().toISOString()) : '', i.retKm||'', '',
        i.retReason||'', i.retNotes||'', i.retAuth||''
      ]);
    });

    // ESTADO CAMIONES
    var estRows = [[
      'Camión','Patente','Detalle','Faena','Posición','Descripción',
      'Lado','Tipo','Código Neumático','Marca','Medida','Estado','Kilómetros','Notas'
    ]];
    trucks.forEach(function(t){
      t.positions.forEach(function(p){
        var iv = inventory.find(function(i){ return i.code===p.tireCode; });
        estRows.push([
          t.num, t.plate, t.model, t.faena, p.code, p.label,
          _lado(p.code), _tipo(p.code), p.tireCode||'',
          iv ? iv.brand||'' : '', iv ? iv.size||'' : '',
          _st(p.state), iv ? iv.entryKm||0 : 0, p.notes||''
        ]);
      });
    });

    // HISTORIAL
    var histRows = [['Fecha','Tipo','Descripción','Usuario']];
    if (historyLog.length) {
      historyLog.forEach(function(h){ histRows.push([_fmtDT(h.ts), _ht(h.type), h.text||'', h.user||'']); });
    } else {
      histRows.push(['Sin registros','','','']);
    }

    // ALERTAS
    var hasCrits = false;
    var alertRows = [['Camión','Patente','Faena','Posición','Descripción','Código Neumático','Marca','Medida','Notas']];
    trucks.forEach(function(t){
      t.positions.forEach(function(p){
        if (p.state==='crit') {
          hasCrits = true;
          var iv = inventory.find(function(i){ return i.code===p.tireCode; });
          alertRows.push([t.num,t.plate,t.faena,p.code,p.label,p.tireCode||'',iv?iv.brand||'':'',iv?iv.size||'':'',p.notes||'']);
        }
      });
    });
    if (!hasCrits) alertRows = [['Sin alertas']];

    _xlsxDownload([
      { name:'Inventario',      rows:invRows,  cols:[10,12,10,10,10,14,10,20,8,8,16,12,14,12,12,16,18,14] },
      { name:'Estado Camiones', rows:estRows,  cols:[8,10,30,16,8,24,6,8,14,10,8,14,10,20] },
      { name:'Historial',       rows:histRows, cols:[22,12,64,16] },
      { name:'Alertas',         rows:alertRows,cols:[8,10,16,8,22,14,10,8,20] }
    ], 'NEUMATICOS_HARCHA_'+date+'.xlsx');

  } catch(e) {
    console.error('exportExcel:', e);
    showToast('❌ Error: ' + e.message);
  }
}

// ── Reporte por Camión ─────────────────────────────────────
function openReporte() {
  if (!currentTruckId) { showToast('Selecciona un camión primero.'); return; }
  var truck = trucks.find(function(t){ return t.id===currentTruckId; });
  if (!truck) { showToast('Camión no encontrado.'); return; }
  showToast('Generando reporte…');
  var date = new Date().toISOString().slice(0,10);
  try {
    var ok=[],warn=[],crit=[],empty=[];
    truck.positions.forEach(function(p){
      if(p.state==='ok')ok.push(p.code);
      else if(p.state==='warn')warn.push(p.code);
      else if(p.state==='crit')crit.push(p.code);
      else empty.push(p.code);
    });

    // Resumen
    var resRows = [
      ['REPORTE DE NEUMÁTICOS — '+truck.num,'','','','',''],
      ['Camión:',truck.num,'Patente:',truck.plate,'Faena:',truck.faena],
      ['Modelo:',truck.model,'Fecha:',new Date().toLocaleDateString('es-CL'),'',''],
      ['','','','','',''],
      ['RESUMEN','','','','',''],
      ['Total posiciones:',truck.positions.length,'OK:',ok.length,'Desgaste:',warn.length],
      ['Crítico:',crit.length,'Vacío:',empty.length,'',''],
      crit.length ? ['⚠ CRÍTICOS:',crit.join(', '),'','','',''] : ['','','','','',''],
      ['','','','','',''],
      ['POSICIÓN','DESCRIPCIÓN','LADO','TIPO','CÓDIGO NEUMÁTICO','MARCA','MEDIDA','CONDICIÓN','ESTADO','PROF.(MM)','FECHA INGRESO','KM INGRESO','NOTAS']
    ];
    truck.positions.forEach(function(p){
      var iv = inventory.find(function(i){ return i.code===p.tireCode; });
      resRows.push([p.code,p.label,_lado(p.code),_tipo(p.code),p.tireCode||'Sin asignar',iv?iv.brand||'':'',iv?iv.size||'':'',iv?_cond(iv.condition):'',_st(p.state),iv?iv.depth||'':'',_fmtD(iv?iv.entryDate:''),iv?iv.entryKm||0:'',p.notes||'']);
    });

    // Posiciones detalle
    var detRows = [['Posición','Descripción','Lado','Tipo','Código Neumático','Marca','Medida','Condición','Estado','Prof. mm','Fecha Ingreso','Km Ingreso','Notas']];
    truck.positions.forEach(function(p){
      var iv = inventory.find(function(i){ return i.code===p.tireCode; });
      detRows.push([p.code,p.label,_lado(p.code),_tipo(p.code),p.tireCode||'Sin asignar',iv?iv.brand||'':'',iv?iv.size||'':'',iv?_cond(iv.condition):'',_st(p.state),iv?iv.depth||'':'',_fmtD(iv?iv.entryDate:''),iv?iv.entryKm||0:'',p.notes||'']);
    });

    // Historial del camión
    var histRows = [['Fecha','Tipo','Descripción','Usuario']];
    var truckHist = historyLog.filter(function(h){ return h.text&&(h.text.indexOf(truck.num)>=0||h.text.indexOf(truck.plate)>=0); });
    if (truckHist.length) {
      truckHist.forEach(function(h){ histRows.push([_fmtDT(h.ts),_ht(h.type),h.text||'',h.user||'']); });
    } else {
      histRows.push(['Sin historial registrado para este camión','','','']);
    }

    // Neumáticos retirados
    var retRows = [['Código','Marca','Medida','Condición','Posición','Razón Retiro','Km/Hr Retiro','Autorizado Por','Notas']];
    var retList = inventory.filter(function(i){ return i.status==='retired'&&i.truckNum===truck.num; });
    if (retList.length) {
      retList.forEach(function(i){ retRows.push([i.code,i.brand||'',i.size||'',_cond(i.condition),i.posCode||'',i.retReason||'',i.retKm||'',i.retAuth||'',i.retNotes||'']); });
    } else {
      retRows.push(['Sin neumáticos retirados de este camión','','','','','','','','']);
    }

    _xlsxDownload([
      { name:'Resumen '+truck.num, rows:resRows, cols:[10,24,6,8,16,10,8,10,12,10,14,10,22] },
      { name:'Posiciones',         rows:detRows, cols:[8,24,6,8,16,10,8,10,12,10,14,10,22] },
      { name:'Historial',          rows:histRows,cols:[20,12,60,16] },
      { name:'Retirados',          rows:retRows, cols:[10,12,10,10,10,14,12,14,22] }
    ], 'REPORTE_'+truck.num+'_'+truck.plate+'_'+date+'.xlsx');

  } catch(e) {
    console.error('openReporte:', e);
    showToast('❌ Error: ' + e.message);
  }
}
