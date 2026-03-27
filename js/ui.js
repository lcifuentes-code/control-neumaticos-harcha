// ============================================================
// NEUMATRACK · Utilidades UI
// ============================================================

function stateLabel(state) {
  if (state==='ok')   return 'Buen estado';
  if (state==='warn') return 'Desgaste';
  if (state==='crit') return 'Crítico';
  return 'Sin neumático';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { console.log('Toast:', msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 3000);
}

function toggleUserMenu() {
  var m = document.getElementById('userMenu');
  if (!m) return;
  m.style.display = (m.style.display === 'none' || m.style.display === '') ? 'block' : 'none';
}

function closeMenu() {
  var m = document.getElementById('userMenu');
  if (m) m.style.display = 'none';
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(e) {
  var menu = document.getElementById('userMenu');
  var btn  = document.getElementById('kebabBtn');
  if (!menu || !btn) return;
  if (menu.style.display === 'none') return;
  if (!menu.contains(e.target) && !btn.contains(e.target)) menu.style.display = 'none';
});

// Preview de foto en modal de baja
document.addEventListener('change', function(e) {
  if (e.target && e.target.id === 'retPhoto') {
    var file = e.target.files[0];
    var preview = document.getElementById('retPhotoPreview');
    var img     = document.getElementById('retPhotoImg');
    if (file && preview && img) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        img.src = ev.target.result;
        preview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  }
});

// ---- PESTAÑAS DERECHA ----
function setRightTab(tab) {
  ['tabDetalle','tabHist','tabAlert'].forEach(id=>document.getElementById(id).classList.remove('active'));
  ['rightDetalle','rightHist','rightAlert'].forEach(id=>document.getElementById(id).style.display='none');

  if (tab==='detalle') {
    document.getElementById('tabDetalle').classList.add('active');
    document.getElementById('rightDetalle').style.display='block';
  } else if (tab==='historial') {
    document.getElementById('tabHist').classList.add('active');
    document.getElementById('rightHist').style.display='block';
    renderHistoryPanel();
  } else {
    document.getElementById('tabAlert').classList.add('active');
    document.getElementById('rightAlert').style.display='block';
  }
}
