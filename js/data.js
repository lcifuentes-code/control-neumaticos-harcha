// ============================================================
// NEUMATRACK · Carga de Datos e Historial
// ============================================================

function defaultPositions(truckId, modelKey) {
  const base = [
    {truck_id:truckId, code:'P01', label:'EJE 1 — DELANTERO IZQ.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P02', label:'EJE 1 — DELANTERO DER.', state:'empty', tire_code:'', notes:'Sin neumático'},
  ];
  const eje2 = [
    {truck_id:truckId, code:'P03', label:'EJE 2 — TRASERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P04', label:'EJE 2 — TRASERO IZQ. INT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P05', label:'EJE 2 — TRASERO DER. INT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P06', label:'EJE 2 — TRASERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
  ];
  const eje3 = [
    {truck_id:truckId, code:'P07', label:'EJE 3 — TRASERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P08', label:'EJE 3 — TRASERO IZQ. INT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P09', label:'EJE 3 — TRASERO DER. INT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P10', label:'EJE 3 — TRASERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
  ];
  if (modelKey==='M2') return [...base,{truck_id:truckId,code:'P11',label:'EJE 1 — DEL. IZQ. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},{truck_id:truckId,code:'P12',label:'EJE 1 — DEL. DER. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},...eje2,...eje3];
  if (modelKey==='M3') return [...base,...eje2,...eje3,{truck_id:truckId,code:'P11',label:'EJE 4 — TRAS. IZQ. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},{truck_id:truckId,code:'P12',label:'EJE 4 — TRAS. DER. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'}];
  if (modelKey==='M4') return [...base,{truck_id:truckId,code:'P11',label:'EJE 1 — DEL. IZQ. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},{truck_id:truckId,code:'P12',label:'EJE 1 — DEL. DER. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},...eje2,...eje3,{truck_id:truckId,code:'P13',label:'EJE 4 — TRAS. IZQ. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'},{truck_id:truckId,code:'P14',label:'EJE 4 — TRAS. DER. EXT.',state:'empty',tire_code:'',notes:'Sin neumático'}];
  return [...base,...eje2,...eje3];
}

async function loadAllData() {
  const [tRes, invRes, hRes] = await Promise.all([
    sb.from('trucks').select('*, positions(*)').not('active','is',false).order('num'),
    sb.from('inventory').select('*').order('code'),
    sb.from('history').select('*').order('created_at',{ascending:false}).limit(200)
  ]);
  if (tRes.error) throw tRes.error;
  if (invRes.error) throw invRes.error;
  if (hRes.error) console.warn('History error:', hRes.error.message);

  tireHistory = {};
  try {
    const thRes = await sb.from('tire_history').select('*').order('created_at',{ascending:true});
    if (!thRes.error) (thRes.data||[]).forEach(h => {
      if (!tireHistory[h.tire_code]) tireHistory[h.tire_code] = [];
      tireHistory[h.tire_code].push(h);
    });
  } catch(e) {}

  trucks = (tRes.data||[]).map(t=>({...t, positions:(t.positions||[]).sort((a,b)=>a.code.localeCompare(b.code)).map(p=>({...p, tireCode:p.tire_code||''}))}));
  filteredTrucks = [...trucks];
  inventory = (invRes.data||[]).map(i=>({
    _id:i.id, code:i.code, brand:i.brand||'', size:i.size||'', condition:i.condition||'new',
    status:i.status||'stock', depth:i.depth||'', location:i.location||'',
    entryDate:i.entry_date||'', entryKm:i.entry_km??0, truckNum:i.truck_num||'',
    posCode:i.pos_code||'', retReason:i.ret_reason||'', retAuth:i.ret_auth||'',
    retKm:i.ret_km, retNotes:i.ret_notes||'', retPhoto:i.ret_photo||'', notes:i.notes||'',
  }));
  historyLog = (!hRes.error) ? (hRes.data||[]).map(h=>({ts:h.created_at, type:h.type, text:h.text||h.description||'', user:h.user_email||''})) : [];
}

// ── Registrar evento enriquecido ───────────────────────────
async function addTireHistory(tireCode, eventType, opts={}) {
  const row = {
    tire_code: tireCode, event_type: eventType,
    truck_num: opts.truckNum||'', pos_code: opts.posCode||'', faena: opts.faena||'',
    km: opts.km ? Number(opts.km) : null, notes: opts.notes||'',
    user_email: currentUser?.email||'sistema',
    responsible: opts.responsible||'', photo_url: opts.photoUrl||'',
    depth_mm: opts.depthMm ? Number(opts.depthMm) : null,
    pressure_psi: opts.pressurePsi ? Number(opts.pressurePsi) : null,
    repair_type: opts.repairType||'', provider: opts.provider||'',
    destination: opts.destination||'', return_date: opts.returnDate||null,
    visual_state: opts.visualState||'',
  };
  const { error } = await sb.from('tire_history').insert(row);
  if (!error) {
    if (!tireHistory[tireCode]) tireHistory[tireCode] = [];
    tireHistory[tireCode].push({...row, created_at: new Date().toISOString()});
  }
  return { error };
}

async function addHistory(type, text) {
  historyLog.unshift({ts:new Date().toISOString(), type, text});
  if (role!=='guest') await sb.from('history').insert({type, text, user_email:currentUser?.email||''});
}

// ── Ubicación actual del neumático ─────────────────────────
function getTireLocation(code) {
  const inv = inventory.find(i=>i.code===code);
  if (!inv) return {text:'No registrado', color:'#94a3b8', icon:'❓'};
  if (inv.status==='installed') return {text:`Instalado en ${inv.truckNum} / ${inv.posCode}`, color:'#3b82f6', icon:'🚛'};
  if (inv.status==='stock') return {text:`En Stock — ${inv.location||'Bodega'}`, color:'#22c55e', icon:'📦'};
  if (inv.status==='repair') return {text:'En Reparación', color:'#f59e0b', icon:'🔧'};
  if (inv.status==='retread') return {text:'En Recauchaje', color:'#a78bfa', icon:'♻️'};
  if (inv.status==='retired') return {text:'Dado de Baja', color:'#ef4444', icon:'🗑'};
  return {text:inv.status, color:'#94a3b8', icon:'📋'};
}

function statusLabel(s) {
  return {stock:'En Stock',installed:'Instalado',retired:'Retirado',repair:'En Reparación',retread:'En Recauchaje'}[s]||s;
}

// ── Timeline HTML ──────────────────────────────────────────
function buildTireLifeHTML(code) {
  var events = tireHistory[code]||[];
  if (!events.length) return '<div style="color:#64748b;font-size:12px;padding:8px 0;">Sin historial registrado.</div>';
  var icons = {
    alta:{icon:'🆕',color:'#22c55e',label:'Alta / Ingreso'}, instalacion:{icon:'🔧',color:'#3b82f6',label:'Instalación'},
    devolucion:{icon:'🔄',color:'#a78bfa',label:'Devolución a Bodega'}, baja:{icon:'🗑',color:'#ef4444',label:'Baja'},
    edicion:{icon:'✏',color:'#fbbf24',label:'Edición'}, rotacion:{icon:'🔃',color:'#06b6d4',label:'Rotación'},
    reparacion:{icon:'🔧',color:'#f59e0b',label:'Reparación'}, inspeccion:{icon:'🔍',color:'#8b5cf6',label:'Inspección'},
    recauchaje:{icon:'♻️',color:'#10b981',label:'Recauchaje'}, transferencia:{icon:'🚚',color:'#0ea5e9',label:'Transferencia'},
  };
  var html='';
  events.forEach(function(e,i){
    var ev=icons[e.event_type]||{icon:'📋',color:'#9ca3af',label:e.event_type};
    var d=new Date(e.created_at);
    var dt=d.toLocaleDateString('es-CL')+' '+d.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});
    var isLast=i===events.length-1;
    var line=isLast?'':'<div style="position:absolute;left:13px;top:26px;bottom:0;width:2px;background:#1f2937;"></div>';
    var truck=e.truck_num?'<div style="color:#e5e7eb;font-size:12px;margin-top:1px;">📍 '+e.truck_num+(e.pos_code?' / '+e.pos_code:'')+(e.faena?' · '+e.faena:'')+'</div>':'';
    var km=e.km?'<div style="color:#9ca3af;font-size:11px;">Km: '+Number(e.km).toLocaleString()+'</div>':'';
    var notes=e.notes?'<div style="color:#64748b;font-size:11px;">'+e.notes+'</div>':'';
    var extra='';
    if(e.responsible) extra+='<div style="color:#9ca3af;font-size:11px;">👤 '+e.responsible+'</div>';
    if(e.event_type==='reparacion'&&e.repair_type) extra+='<div style="color:#f59e0b;font-size:11px;">Tipo: '+e.repair_type+(e.provider?' · '+e.provider:'')+'</div>';
    if(e.event_type==='inspeccion'){var insp=[];if(e.depth_mm)insp.push('Prof: '+e.depth_mm+'mm');if(e.pressure_psi)insp.push(e.pressure_psi+' PSI');if(e.visual_state)insp.push(e.visual_state);if(insp.length)extra+='<div style="color:#8b5cf6;font-size:11px;">📏 '+insp.join(' · ')+'</div>';}
    if(e.event_type==='recauchaje'&&e.provider) extra+='<div style="color:#10b981;font-size:11px;">Recauchadora: '+e.provider+'</div>';
    if(e.event_type==='transferencia'&&e.destination) extra+='<div style="color:#0ea5e9;font-size:11px;">→ '+e.destination+'</div>';
    if(e.return_date) extra+='<div style="color:#9ca3af;font-size:11px;">📅 Retorno: '+e.return_date+'</div>';
    if(e.photo_url) extra+='<img src="'+e.photo_url+'" style="margin-top:4px;max-width:120px;max-height:80px;border-radius:6px;border:1px solid #1f2937;" />';
    var icon='<div style="flex-shrink:0;width:26px;height:26px;border-radius:50%;background:'+ev.color+'22;border:2px solid '+ev.color+';display:flex;align-items:center;justify-content:center;font-size:12px;z-index:1;">'+ev.icon+'</div>';
    var label='<div style="color:'+ev.color+';font-size:11px;font-weight:700;letter-spacing:.05em;">'+ev.label.toUpperCase()+'</div>';
    var user='<div style="color:#374151;font-size:10px;margin-top:2px;">'+dt+(e.user_email?' · '+e.user_email:'')+'</div>';
    html+='<div style="display:flex;gap:10px;padding-bottom:'+(isLast?'0':'14px')+';position:relative;">'+line+icon+'<div style="flex:1;padding-top:2px;">'+label+truck+km+extra+notes+user+'</div></div>';
  });
  return html;
}
