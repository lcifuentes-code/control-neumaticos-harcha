// ============================================================
// NEUMATRACK · Búsqueda de Neumáticos
// ============================================================

function openTireSearch() {
  closeMenu();
  document.getElementById('tireSearchInput').value = '';
  document.getElementById('tireSearchResults').innerHTML = '<div style="color:#64748b;text-align:center;padding:40px 0;">Escribe un código para buscar</div>';
  document.getElementById('tireSearchBackdrop').style.display = 'flex';
  setTimeout(() => document.getElementById('tireSearchInput').focus(), 100);
}

function closeTireSearch(ev) {
  if (ev && ev.target.id !== 'tireSearchBackdrop') return;
  document.getElementById('tireSearchBackdrop').style.display = 'none';
}

function doTireSearch() {
  const q = (document.getElementById('tireSearchInput').value||'').trim().toLowerCase();
  const container = document.getElementById('tireSearchResults');
  if (!q) {
    container.innerHTML = '<div style="color:#64748b;text-align:center;padding:40px 0;">Escribe un código para buscar</div>';
    return;
  }

  // Buscar en inventario
  const matches = inventory.filter(i =>
    i.code.toLowerCase().includes(q) ||
    (i.brand||'').toLowerCase().includes(q)
  ).slice(0, 20);

  if (!matches.length) {
    container.innerHTML = '<div style="color:#64748b;text-align:center;padding:40px 0;">Sin resultados para "' + q + '"</div>';
    return;
  }

  container.innerHTML = matches.map(i => {
    const loc = getTireLocation(i.code);
    const condName = i.condition==='new'?'Nuevo':i.condition==='used'?'Usado':'Recauchado';
    const eventCount = (tireHistory[i.code]||[]).length;
    return `
    <div style="background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:14px;cursor:pointer;" onclick="showTireDetail('${i.code}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
        <div>
          <div style="color:#93c5fd;font-size:17px;font-weight:700;letter-spacing:.08em;">${i.code}</div>
          <div style="color:#9ca3af;font-size:12px;margin-top:3px;">${i.brand||'—'} · ${i.size||'—'} · ${condName}</div>
        </div>
        <div style="text-align:right;">
          <div style="color:${loc.color};font-size:13px;font-weight:600;">${loc.icon} ${loc.text}</div>
          <div style="color:#64748b;font-size:11px;margin-top:2px;">${eventCount} eventos registrados</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function showTireDetail(code) {
  const inv = inventory.find(i=>i.code===code);
  if (!inv) return;
  const loc = getTireLocation(code);
  const condName = inv.condition==='new'?'Nuevo':inv.condition==='used'?'Usado':'Recauchado';
  const events = tireHistory[code]||[];

  // Stats
  const instEvents = events.filter(e=>e.event_type==='instalacion');
  const repairEvents = events.filter(e=>e.event_type==='reparacion');
  const inspEvents = events.filter(e=>e.event_type==='inspeccion');
  const lastInsp = inspEvents.length ? inspEvents[inspEvents.length-1] : null;

  const container = document.getElementById('tireSearchResults');
  container.innerHTML = `
    <div>
      <button style="background:none;border:none;color:#93c5fd;cursor:pointer;font-size:13px;margin-bottom:12px;" onclick="doTireSearch()">← Volver a resultados</button>

      <!-- CABECERA -->
      <div style="background:#0b1220;border:1px solid #1f2937;border-radius:14px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
          <div>
            <div style="color:#93c5fd;font-size:22px;font-weight:800;letter-spacing:.1em;">${code}</div>
            <div style="color:#9ca3af;font-size:13px;margin-top:4px;">${inv.brand||'—'} · ${inv.size||'—'} · ${condName}</div>
          </div>
          <div style="background:${loc.color}18;border:1px solid ${loc.color}40;border-radius:12px;padding:10px 14px;text-align:center;">
            <div style="font-size:22px;">${loc.icon}</div>
            <div style="color:${loc.color};font-size:12px;font-weight:700;margin-top:4px;">${loc.text}</div>
          </div>
        </div>
      </div>

      <!-- STATS -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
        <div style="background:#0b1120;border-radius:10px;padding:10px;text-align:center;">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em;">Instalaciones</div>
          <div style="color:#3b82f6;font-size:18px;font-weight:700;margin-top:2px;">${instEvents.length}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;text-align:center;">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em;">Reparaciones</div>
          <div style="color:#f59e0b;font-size:18px;font-weight:700;margin-top:2px;">${repairEvents.length}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;text-align:center;">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em;">Inspecciones</div>
          <div style="color:#8b5cf6;font-size:18px;font-weight:700;margin-top:2px;">${inspEvents.length}</div>
        </div>
        <div style="background:#0b1120;border-radius:10px;padding:10px;text-align:center;">
          <div style="color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em;">Últ. Prof.</div>
          <div style="color:#e5e7eb;font-size:18px;font-weight:700;margin-top:2px;">${lastInsp&&lastInsp.depth_mm ? lastInsp.depth_mm+'mm' : '—'}</div>
        </div>
      </div>

      <!-- ACCIONES -->
      ${role!=='guest' ? `
      <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">
        <button class="btn-save" style="font-size:11px;padding:7px 12px;" onclick="openEventForm('${code}','reparacion')">🔧 Reparación</button>
        <button class="btn-save" style="font-size:11px;padding:7px 12px;background:#8b5cf6;" onclick="openEventForm('${code}','inspeccion')">🔍 Inspección</button>
        <button class="btn-save" style="font-size:11px;padding:7px 12px;background:#10b981;" onclick="openEventForm('${code}','recauchaje')">♻️ Recauchaje</button>
        <button class="btn-save" style="font-size:11px;padding:7px 12px;background:#0ea5e9;" onclick="openEventForm('${code}','transferencia')">🚚 Transferencia</button>
        <button class="btn-cancel" style="font-size:11px;padding:7px 12px;" onclick="exportTireLife('${code}')">📥 Exportar Reporte</button>
      </div>` : ''}

      <!-- TIMELINE -->
      <div style="background:#020617;border-radius:14px;padding:14px;max-height:400px;overflow-y:auto;">
        <div style="color:#9ca3af;font-size:10px;text-transform:uppercase;letter-spacing:.12em;margin-bottom:10px;">HISTORIAL DE VIDA</div>
        ${buildTireLifeHTML(code)}
      </div>
    </div>
  `;
}
