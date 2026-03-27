// ============================================================
// NEUMATRACK · Diagrama SVG del Camión
// ============================================================

function stateColor(state) {
  if (state==='ok')   return '#22c55e';
  if (state==='warn') return '#fbbf24';
  if (state==='crit') return '#ef4444';
  return '#7090a4';
}

function renderDiagram(truck) {
  const svg = document.getElementById('truckSVG');
  if (!svg) return;
  const posMap = {};
  (truck.positions||[]).forEach(p => posMap[p.code] = p);

  function tire(code, x, y) {
    const pos = posMap[code];
    const fill  = pos ? stateColor(pos.state) : '#7090a4';
    const fillLight = pos ? (pos.state==='ok'?'#90d494':pos.state==='warn'?'#f7d060':pos.state==='crit'?'#f08080':'#aabbc8') : '#aabbc8';
    const isActive  = code === currentSelectedPosCode;
    const outerStr  = isActive ? '#ffffff' : '#2a3d50';
    const outerSW   = isActive ? 2.5 : 2;
    const critFilter = (pos && pos.state==='crit') ? 'filter="url(#dfc)"' : '';
    const critBorder = (pos && pos.state==='crit') ? '#ef4444' : outerStr;
    const critSW     = (pos && pos.state==='crit') ? 2.5 : outerSW;
    const dashArr    = (!pos || pos.state==='empty') ? 'stroke-dasharray="5,3"' : '';
    let grooves = '';
    const grC = pos ? (pos.state==='ok'?'#155220':pos.state==='warn'?'#7a4a00':pos.state==='crit'?'#7a1010':'#3a5060') : '#3a5060';
    const grOp = (!pos || pos.state==='empty') ? '.4' : '.5';
    for (let i=0; i<7; i++) {
      const gy = y+10+(i*10);
      grooves += `<line x1="${x+5}" y1="${gy}" x2="${x+25}" y2="${gy}" stroke="${grC}" stroke-width="1.3" opacity="${grOp}"/>`;
    }
    return `<g class="wheel-g" data-code="${code}" onclick="selectPosByCode('${code}')" style="cursor:pointer" ${critFilter}>
      <rect x="${x}" y="${y}" width="30" height="80" rx="13" fill="#1e2d3c" stroke="${critBorder}" stroke-width="${critSW}" ${dashArr}/>
      <rect x="${x+5}" y="${y+5}" width="20" height="70" rx="10" fill="${fill}"/>
      ${grooves}
    </g>`;
  }

  const defs = `<defs>
    <linearGradient id="dGrOut" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#5a6878"/><stop offset="12%"  stop-color="#7a8e9e"/>
      <stop offset="50%"  stop-color="#8ea0ae"/><stop offset="88%"  stop-color="#7a8e9e"/>
      <stop offset="100%" stop-color="#5a6878"/>
    </linearGradient>
    <linearGradient id="dGrIn" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#3a4a56"/><stop offset="20%"  stop-color="#5a6e7e"/>
      <stop offset="50%"  stop-color="#6a8090"/><stop offset="80%"  stop-color="#5a6e7e"/>
      <stop offset="100%" stop-color="#3a4a56"/>
    </linearGradient>
    <linearGradient id="dGrFloor" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#4a5a68"/><stop offset="30%"  stop-color="#6a7e8e"/>
      <stop offset="50%"  stop-color="#7a8e9e"/><stop offset="70%"  stop-color="#6a7e8e"/>
      <stop offset="100%" stop-color="#4a5a68"/>
    </linearGradient>
    <linearGradient id="dCabBlue" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#1a5fa8"/><stop offset="30%"  stop-color="#2e7dd4"/>
      <stop offset="50%"  stop-color="#3a8fe0"/><stop offset="70%"  stop-color="#2e7dd4"/>
      <stop offset="100%" stop-color="#1a5fa8"/>
    </linearGradient>
    <linearGradient id="dCabTop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#5ba8e8"/><stop offset="100%" stop-color="#1e5fa8"/>
    </linearGradient>
    <linearGradient id="dWind" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#d0e8f8"/><stop offset="50%"  stop-color="#90c4e8"/>
      <stop offset="100%" stop-color="#5090c0"/>
    </linearGradient>
    <linearGradient id="dHood" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#2e7dd4"/><stop offset="100%" stop-color="#1a4a90"/>
    </linearGradient>
    <linearGradient id="dAxle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#94a8bc"/><stop offset="100%" stop-color="#607080"/>
    </linearGradient>
    <linearGradient id="dBumper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#8090a0"/><stop offset="100%" stop-color="#4a5560"/>
    </linearGradient>
    <filter id="dfs"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#00000030"/></filter>
    <filter id="dfc"><feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#dd333355"/></filter>
    <filter id="dfcab"><feDropShadow dx="1" dy="3" stdDeviation="4" flood-color="#00000035"/></filter>
  </defs>`;

  const body = `
    <!-- TOLVA -->
    <rect x="104" y="154" width="136" height="422" rx="6" fill="#00000016"/>
    <rect x="100" y="150" width="140" height="420" rx="6" fill="url(#dGrOut)" stroke="#3a4a58" stroke-width="2" filter="url(#dfs)"/>
    <rect x="114" y="162" width="112" height="396" rx="3" fill="url(#dGrFloor)"/>
    <rect x="114" y="162" width="112" height="6"   rx="2" fill="#3a4a54" opacity=".5"/>
    <rect x="114" y="552" width="112" height="6"   rx="2" fill="#3a4a54" opacity=".5"/>
    <rect x="114" y="162" width="8"   height="396" rx="2" fill="url(#dGrIn)" opacity=".7"/>
    <rect x="218" y="162" width="8"   height="396" rx="2" fill="url(#dGrIn)" opacity=".7"/>
    <rect x="100" y="218" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="283" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="348" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="413" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="478" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="543" width="140" height="5" rx="0" fill="#50606e" opacity=".6"/>
    <rect x="100" y="150" width="6"   height="420" rx="2" fill="#3a4a58" opacity=".8"/>
    <rect x="234" y="150" width="6"   height="420" rx="2" fill="#3a4a58" opacity=".8"/>
    <rect x="126" y="150" width="4"   height="420" fill="#50606e" opacity=".45"/>
    <rect x="152" y="150" width="4"   height="420" fill="#50606e" opacity=".45"/>
    <rect x="178" y="150" width="4"   height="420" fill="#50606e" opacity=".45"/>
    <rect x="204" y="150" width="4"   height="420" fill="#50606e" opacity=".45"/>
    <rect x="100" y="558" width="140" height="14" rx="4" fill="#3a4a58" stroke="#2e3e50" stroke-width="1.2"/>
    <rect x="158" y="559" width="24"  height="10" rx="4" fill="#1e2d3c" stroke="#3a4a54" stroke-width=".8"/>
    <circle cx="110" cy="565" r="5" fill="#1e2d3c" stroke="#3a4a58" stroke-width="1.2"/>
    <circle cx="230" cy="565" r="5" fill="#1e2d3c" stroke="#3a4a58" stroke-width="1.2"/>
    <rect x="114" y="148" width="112" height="6" rx="2" fill="#2a3a48"/>
    <rect x="100" y="563" width="14"  height="9"  rx="3" fill="#dc2626" stroke="#991b1b" stroke-width=".8"/>
    <rect x="226" y="563" width="14"  height="9"  rx="3" fill="#dc2626" stroke="#991b1b" stroke-width=".8"/>
    <circle cx="106" cy="156" r="3" fill="#1e2d3c" stroke="#50606e" stroke-width=".8"/>
    <circle cx="234" cy="156" r="3" fill="#1e2d3c" stroke="#50606e" stroke-width=".8"/>
    <circle cx="106" cy="564" r="3" fill="#1e2d3c" stroke="#50606e" stroke-width=".8"/>
    <circle cx="234" cy="564" r="3" fill="#1e2d3c" stroke="#50606e" stroke-width=".8"/>

    <!-- CABINA -->
    <rect x="116" y="72"  width="108" height="80"  rx="5" fill="url(#dHood)" stroke="#1a4a90" stroke-width="1.2"/>
    <line x1="126" y1="78"  x2="126" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="135" y1="78"  x2="135" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="144" y1="78"  x2="144" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="153" y1="78"  x2="153" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="162" y1="78"  x2="162" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="171" y1="78"  x2="171" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="180" y1="78"  x2="180" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="189" y1="78"  x2="189" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="198" y1="78"  x2="198" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="207" y1="78"  x2="207" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <line x1="216" y1="78"  x2="216" y2="148" stroke="#1640a0" stroke-width="1.4" opacity=".4"/>
    <rect x="116" y="144" width="108" height="7" rx="0" fill="#1a3a80" opacity=".8"/>
    <rect x="96"  y="36"  width="148" height="112" rx="10" fill="url(#dCabBlue)" stroke="#1a5fa8" stroke-width="2" filter="url(#dfcab)"/>
    <rect x="102" y="36"  width="136" height="28"  rx="8"  fill="url(#dCabTop)" stroke="#5ba8e8" stroke-width="1"/>
    <path d="M108,46 L232,46 L228,106 L112,106 Z" fill="url(#dWind)" stroke="#90c8f0" stroke-width="1.8"/>
    <path d="M112,48 L144,48 L140,74 L112,74 Z"   fill="white" opacity=".14"/>
    <rect x="165" y="46"  width="9"   height="60"  rx="3" fill="#1a5fa8"/>
    <rect x="96"  y="104" width="148" height="9"   rx="0" fill="#1a3a80"/>
    <rect x="96"  y="44"  width="14"  height="64"  rx="4" fill="url(#dCabBlue)" stroke="#1a5fa8" stroke-width=".8"/>
    <rect x="234" y="44"  width="14"  height="64"  rx="4" fill="url(#dCabBlue)" stroke="#1a5fa8" stroke-width=".8"/>
    <ellipse cx="74"  cy="70" rx="14" ry="9" fill="#2563a8" stroke="#1a4a90" stroke-width="1.2"/>
    <ellipse cx="74"  cy="70" rx="10" ry="6" fill="#3a7ad4" opacity=".8"/>
    <rect x="89"  y="64"  width="7"   height="28"  rx="3" fill="#1a3a80"/>
    <ellipse cx="266" cy="70" rx="14" ry="9" fill="#2563a8" stroke="#1a4a90" stroke-width="1.2"/>
    <ellipse cx="266" cy="70" rx="10" ry="6" fill="#3a7ad4" opacity=".8"/>
    <rect x="244" y="64"  width="7"   height="28"  rx="3" fill="#1a3a80"/>
    <path d="M96,22 L116,22 L122,36 L96,36 Z"   fill="#fde68a" stroke="#ca8a04" stroke-width="1.2"/>
    <path d="M100,24 L115,24 L120,32 L100,32 Z"  fill="white" opacity=".4"/>
    <path d="M224,22 L244,22 L240,36 L218,36 Z"  fill="#fde68a" stroke="#ca8a04" stroke-width="1.2"/>
    <path d="M226,24 L242,24 L238,32 L220,32 Z"  fill="white" opacity=".4"/>
    <rect x="96"  y="37"  width="26"  height="4"   rx="2" fill="#fde047" opacity=".85"/>
    <rect x="218" y="37"  width="26"  height="4"   rx="2" fill="#fde047" opacity=".85"/>
    <rect x="88"  y="10"  width="164" height="14"  rx="4" fill="url(#dBumper)" stroke="#5a6570" stroke-width="1.2"/>
    <rect x="94"  y="12"  width="54"  height="10"  rx="3" fill="#1a3050"/>
    <rect x="192" y="12"  width="54"  height="10"  rx="3" fill="#1a3050"/>
    <ellipse cx="108" cy="17" rx="9"  ry="4.5" fill="#fef3c7" stroke="#d4a017" stroke-width=".8"/>
    <ellipse cx="108" cy="17" rx="5.5" ry="2.5" fill="white" opacity=".5"/>
    <ellipse cx="232" cy="17" rx="9"  ry="4.5" fill="#fef3c7" stroke="#d4a017" stroke-width=".8"/>
    <ellipse cx="232" cy="17" rx="5.5" ry="2.5" fill="white" opacity=".5"/>
    <rect x="144" y="12"  width="52"  height="10"  rx="2" fill="#f8f0d0" stroke="#b8980a" stroke-width=".8"/>
    <text x="170" y="20.5" text-anchor="middle" font-size="6" fill="#5a4000" font-family="'Courier New',monospace" font-weight="bold" letter-spacing="1">${truck.plate||truck.num}</text>
    <text x="170" y="6"   text-anchor="middle" font-size="9" fill="#94a3b8" font-family="system-ui" font-weight="700" letter-spacing="2">FRENTE ▲</text>

    <!-- EJES -->
    <rect x="76"  y="196" width="188" height="10" rx="5" fill="url(#dAxle)" stroke="#8aaabb" stroke-width=".8"/>
    <circle cx="76"  cy="201" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <circle cx="264" cy="201" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <text x="170" y="205" text-anchor="middle" font-size="8" fill="white" font-family="system-ui" font-weight="700" letter-spacing="1.5">Eje 1</text>
    <rect x="54"  y="336" width="232" height="10" rx="5" fill="url(#dAxle)" stroke="#8aaabb" stroke-width=".8"/>
    <circle cx="54"  cy="341" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <circle cx="286" cy="341" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <text x="170" y="345" text-anchor="middle" font-size="8" fill="white" font-family="system-ui" font-weight="700" letter-spacing="1.5">Eje 2</text>
    <rect x="50"  y="466" width="240" height="10" rx="5" fill="url(#dAxle)" stroke="#8aaabb" stroke-width=".8"/>
    <circle cx="50"  cy="471" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <circle cx="290" cy="471" r="6" fill="#4a6070" stroke="#7a9aaa" stroke-width="1.2"/>
    <text x="170" y="475" text-anchor="middle" font-size="8" fill="white" font-family="system-ui" font-weight="700" letter-spacing="1.5">Eje 3</text>

    <!-- LABELS LAT -->
    <text x="10" y="390" text-anchor="middle" font-size="8" fill="#b0bec8" font-family="system-ui" font-weight="600" transform="rotate(-90,10,390)" letter-spacing="1">IZQUIERDO</text>
    <text x="330" y="390" text-anchor="middle" font-size="8" fill="#b0bec8" font-family="system-ui" font-weight="600" transform="rotate(90,330,390)" letter-spacing="1">DERECHO</text>
  `;

  // Neumáticos estándar M1 (10 posiciones)
  const tires =
    tire('P01', 78, 161) + tire('P02', 232, 161) +
    tire('P03', 46, 301) + tire('P04', 78, 301) +
    tire('P05', 232, 301) + tire('P06', 264, 301) +
    tire('P07', 42, 431) + tire('P08', 74, 431) +
    tire('P09', 236, 431) + tire('P10', 268, 431);

  // Neumáticos extra para modelos M2/M3/M4
  let extraTires = '';
  const mk = truck.model_key || 'M1';
  if (mk === 'M2' || mk === 'M4') {
    // Eje 1 extra (delanteros externos)
    extraTires += tire('P11', 46, 161) + tire('P12', 264, 161);
  }
  if (mk === 'M3') {
    // Eje 4 extra (traseros simples)
    extraTires += tire('P11', 42, 551) + tire('P12', 268, 551);
  }
  if (mk === 'M4') {
    // Eje 4 extra (traseros simples)
    extraTires += tire('P13', 42, 551) + tire('P14', 268, 551);
  }

  svg.innerHTML = defs + body + tires + extraTires;
}
