// ============================================================
// NEUMATRACK · Autenticación y Roles
// Este archivo se carga último porque ejecuta init()
// ============================================================

function applyRoleUI() {
  const isGuest = role === 'guest';
  const btn = document.getElementById('btnEdit');
  const btnNew = document.getElementById('btnNewTruck');
  const banner = document.getElementById('roleBanner');
  const notice = document.getElementById('roleNotice');
  const menuUsers = document.getElementById('menuUsers');

  if (btn)      btn.disabled = isGuest;
  if (btnNew)   btnNew.disabled = isGuest;
  if (banner)   banner.style.display = isGuest ? 'block' : 'none';
  if (notice)   notice.textContent = isGuest ? 'Modo solo lectura.' : '';
  if (menuUsers) menuUsers.style.display = role === 'admin' ? 'flex' : 'none';

  const circle = document.getElementById('userCircle');
  const name   = document.getElementById('userName');
  const sub    = document.getElementById('userRoleSub');
  const badge  = document.getElementById('userBadge');

  const email  = currentUser?.email || '—';
  const shortName = email.split('@')[0];

  if (role === 'admin') {
    circle.textContent = 'A'; name.textContent = shortName; sub.textContent = 'Administrador';
    badge.textContent = 'ADMIN'; badge.style.background='#7f1d1d'; badge.style.borderColor='#991b1b';
  } else if (role === 'editor') {
    circle.textContent = 'E'; name.textContent = shortName; sub.textContent = 'Editor';
    badge.textContent = 'EDITOR'; badge.style.background='#064e3b'; badge.style.borderColor='#065f46';
  } else {
    circle.textContent = 'I'; name.textContent = 'Invitado'; sub.textContent = 'Solo lectura';
    badge.textContent = 'INVITADO'; badge.style.background='#111827'; badge.style.borderColor='#1f2937';
  }
}

async function goLogout() {
  await sb.auth.signOut();
  window.location.href = 'index.html';
}

function openHistory() {
  document.getElementById('userMenu').style.display='none';
  setRightTab('historial');
}

function openUsers() {
  if (role!=='admin') return;
  document.getElementById('userMenu').style.display='none';
  alert('Para gestionar usuarios ve a tu proyecto en Supabase → Authentication → Users.\nDesde ahí puedes crear usuarios y luego cambiar su rol con:\nUPDATE profiles SET role = \'editor\' WHERE email = \'usuario@empresa.com\';');
}

// ── INIT — Se ejecuta al cargar ────────────────────────────
(async function init() {
  try {
    const urlRole = new URLSearchParams(window.location.search).get('role') || '';

    if (urlRole === 'guest') {
      role = 'guest';
      currentUser = null;
      await loadAllData();
      applyRoleUI();
      renderFleet();
      syncKpiBar();
      if (trucks.length > 0) selectTruck(trucks[0].id);
      return;
    }

    const { data: { session } } = await sb.auth.getSession();
    if (!session) { window.location.href = 'index.html'; return; }
    currentUser = session.user;

    const { data: profile } = await sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
    role = profile?.role || urlRole || 'guest';

    await loadAllData();
    applyRoleUI();
    renderFleet();
    syncKpiBar();
    if (trucks.length > 0) selectTruck(trucks[0].id);

  } catch(e) {
    console.error('Init error:', e);
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1e293b;color:#fca5a5;padding:20px 28px;border-radius:14px;border:1px solid #ef4444;font-size:13px;text-align:center;z-index:999;max-width:400px;';
    msg.innerHTML = '<div style="font-size:16px;margin-bottom:8px;">⚠️ Error al cargar</div><div style="color:#9ca3af;">' + (e.message||String(e)) + '</div><br><button onclick="location.reload()" style="background:#2563eb;color:white;border:none;border-radius:8px;padding:8px 16px;cursor:pointer;">Recargar</button>';
    document.body.appendChild(msg);
  } finally {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }
})();
