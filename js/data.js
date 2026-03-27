// ============================================================
// NEUMATRACK · Carga de Datos e Historial
// ============================================================

// ── Posiciones por modelo ──────────────────────────────────
// BUG FIX: Ahora genera posiciones según el modelo del camión
function defaultPositions(truckId, modelKey) {
  const base = [
    {truck_id:truckId, code:'P01', label:'EJE 1 — DELANTERO IZQ.',     state:'empty', tire_code:'', notes:'Sin neumático'},
    {truck_id:truckId, code:'P02', label:'EJE 1 — DELANTERO DER.',     state:'empty', tire_code:'', notes:'Sin neumático'},
  ];

  // Ejes traseros comunes a todos los modelos
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

  if (modelKey === 'M2') {
    // 2 pares delanteros + 8 traseros = 12
    return [
      ...base,
      {truck_id:truckId, code:'P11', label:'EJE 1 — DELANTERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      {truck_id:truckId, code:'P12', label:'EJE 1 — DELANTERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      ...eje2, ...eje3
    ];
  }

  if (modelKey === 'M3') {
    // 2 delanteros + 10 traseros = 12 (eje 4 extra)
    return [
      ...base, ...eje2, ...eje3,
      {truck_id:truckId, code:'P11', label:'EJE 4 — TRASERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      {truck_id:truckId, code:'P12', label:'EJE 4 — TRASERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    ];
  }

  if (modelKey === 'M4') {
    // 2 pares delanteros + 10 traseros = 14
    return [
      ...base,
      {truck_id:truckId, code:'P11', label:'EJE 1 — DELANTERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      {truck_id:truckId, code:'P12', label:'EJE 1 — DELANTERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      ...eje2, ...eje3,
      {truck_id:truckId, code:'P13', label:'EJE 4 — TRASERO IZQ. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
      {truck_id:truckId, code:'P14', label:'EJE 4 — TRASERO DER. EXT.', state:'empty', tire_code:'', notes:'Sin neumático'},
    ];
  }

  // M1 por defecto: 1 par del. + 8 tras. = 10
  return [...base, ...eje2, ...eje3];
}

// ── Carga completa de datos ────────────────────────────────
async function loadAllData() {
  // BUG FIX: Filtrar camiones eliminados (active !== false)
  const [tRes, invRes, hRes] = await Promise.all([
    sb.from('trucks').select('*, positions(*)').not('active', 'is', false).order('num'),
    sb.from('inventory').select('*').order('code'),
    sb.from('history').select('*').order('created_at', {ascending:false}).limit(200)
  ]);
  if (tRes.error)   throw tRes.error;
  if (invRes.error) throw invRes.error;
  if (hRes.error)   console.warn('History error:', hRes.error.message);

  // Cargar tire_history (opcional)
  tireHistory = {};
  try {
    const thRes = await sb.from('tire_history').select('*').order('created_at', {ascending:true});
    if (!thRes.error) {
      (thRes.data||[]).forEach(h => {
        if (!tireHistory[h.tire_code]) tireHistory[h.tire_code] = [];
        tireHistory[h.tire_code].push(h);
      });
    }
  } catch(e) { /* tabla tire_history aún no creada */ }

  trucks = (tRes.data || []).map(t => ({
    ...t,
    positions: (t.positions||[]).sort((a,b)=>a.code.localeCompare(b.code)).map(p=>({
      ...p,
      tireCode: p.tire_code||'',
    }))
  }));
  filteredTrucks = [...trucks];

  inventory = (invRes.data||[]).map(i=>({
    _id:       i.id,
    code:      i.code,
    brand:     i.brand||'',
    size:      i.size||'',
    condition: i.condition||'new',
    status:    i.status||'stock',
    depth:     i.depth||'',
    location:  i.location||'',
    entryDate: i.entry_date||'',
    entryKm:   i.entry_km??0,
    truckNum:  i.truck_num||'',
    posCode:   i.pos_code||'',
    retReason: i.ret_reason||'',
    retAuth:   i.ret_auth||'',
    retKm:     i.ret_km,
    retNotes:  i.ret_notes||'',
    retPhoto:  i.ret_photo||'',
    notes:     i.notes||'',
  }));

  if (!hRes.error) {
    historyLog = (hRes.data||[]).map(h=>({ts:h.created_at, type:h.type, text:h.text||h.description||'', user:h.user_email||''}));
  } else {
    historyLog = [];
  }
}

// ── Registrar evento en historial de neumático ─────────────
async function addTireHistory(tireCode, eventType, opts={}) {
  const row = {
    tire_code:  tireCode,
    event_type: eventType,
    truck_num:  opts.truckNum  || '',
    pos_code:   opts.posCode   || '',
    faena:      opts.faena     || '',
    km:         opts.km        ? Number(opts.km) : null,
    notes:      opts.notes     || '',
    user_email: currentUser?.email || 'sistema'
  };
  const { error } = await sb.from('tire_history').insert(row);
  if (!error) {
    if (!tireHistory[tireCode]) tireHistory[tireCode] = [];
    tireHistory[tireCode].push({...row, created_at: new Date().toISOString()});
  }
}

async function addHistory(type, text) {
  historyLog.unshift({ts:new Date().toISOString(), type, text});
  if (role !== 'guest') {
    await sb.from('history').insert({type, text:text, user_email: currentUser?.email||''});
  }
}

// ── Timeline de vida del neumático ─────────────────────────
function buildTireLifeHTML(code) {
  var events = tireHistory[code] || [];
  if (!events.length) return '<div style="color:#64748b;font-size:12px;padding:8px 0;">Sin historial registrado.</div>';

  var icons = {
    alta:        {icon:'🆕', color:'#22c55e', label:'Alta / Creacion'},
    instalacion: {icon:'🔧', color:'#3b82f6', label:'Instalacion'},
    devolucion:  {icon:'🔄', color:'#a78bfa', label:'Devolucion a Bodega'},
    baja:        {icon:'🗑', color:'#ef4444', label:'Baja'},
    edicion:     {icon:'✏', color:'#fbbf24', label:'Edicion'},
    rotacion:    {icon:'🔃', color:'#06b6d4', label:'Rotacion'}
  };

  var html = '';
  events.forEach(function(e, i) {
    var ev     = icons[e.event_type] || {icon:'📋', color:'#9ca3af', label: e.event_type};
    var d      = new Date(e.created_at);
    var dt     = d.toLocaleDateString('es-CL') + ' ' + d.toLocaleTimeString('es-CL', {hour:'2-digit', minute:'2-digit'});
    var isLast = i === events.length - 1;
    var line   = isLast ? '' : '<div style="position:absolute;left:13px;top:26px;bottom:0;width:2px;background:#1f2937;"></div>';
    var truck  = e.truck_num ? '<div style="color:#e5e7eb;font-size:12px;margin-top:1px;">📍 ' + e.truck_num + (e.pos_code ? ' / ' + e.pos_code : '') + (e.faena ? ' · ' + e.faena : '') + '</div>' : '';
    var km     = e.km        ? '<div style="color:#9ca3af;font-size:11px;">Km: ' + Number(e.km).toLocaleString() + '</div>' : '';
    var notes  = e.notes     ? '<div style="color:#64748b;font-size:11px;">' + e.notes + '</div>' : '';
    var icon   = '<div style="flex-shrink:0;width:26px;height:26px;border-radius:50%;background:' + ev.color + '22;border:2px solid ' + ev.color + ';display:flex;align-items:center;justify-content:center;font-size:12px;z-index:1;">' + ev.icon + '</div>';
    var label  = '<div style="color:' + ev.color + ';font-size:11px;font-weight:700;letter-spacing:.05em;">' + ev.label.toUpperCase() + '</div>';
    var user   = '<div style="color:#374151;font-size:10px;margin-top:2px;">' + dt + (e.user_email ? ' · ' + e.user_email : '') + '</div>';
    var pb     = isLast ? '0' : '12px';
    html += '<div style="display:flex;gap:10px;padding-bottom:' + pb + ';position:relative;">' + line + icon + '<div style="flex:1;padding-top:2px;">' + label + truck + km + notes + user + '</div></div>';
  });
  return html;
}
