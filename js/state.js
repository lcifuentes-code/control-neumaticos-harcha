// ============================================================
// NEUMATRACK · Estado Global
// ============================================================
let role               = 'guest';
let currentUser        = null;
let currentTruckId     = null;
let currentSelectedPosCode = null;
let trucks             = [];
let inventory          = [];
let historyLog         = [];
let tireHistory        = {};
let invTab             = 'stock';
let filteredTrucks     = [];
let retireCode         = null;
let returnBodegaCode   = null;
window.__editingCode   = null;
window.__editingTruckId = null;
window.__truckModel    = 'M1';
