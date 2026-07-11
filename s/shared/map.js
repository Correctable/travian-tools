/* ── CONFIG ──────────────────────────────────────────────── */
if (!window.SERVER_CONFIG) {
  throw new Error('Map not found: server configuration not available.');
}

const {
  apiKey: SERVER,
  slug: SERVER_SLUG,
  basePath: BASE_PATH,
  apiBase: API_BASE,
} = window.SERVER_CONFIG;

/* ── TIER LIMITS ─────────────────────────────────────────── */
const FILTER_LIMITS = {
  free: { alliances: 5, players: 10 },
  plus: { alliances: Infinity, players: Infinity },
  pro:  { alliances: Infinity, players: Infinity },
};

/* ── AUTH STATE ──────────────────────────────────────────── */
let currentUser = null;
let userRole    = 'free';
let isPlus      = false;
let filterLimit = FILTER_LIMITS.free;

/* ── PALETTES ─────────────────────────────────────────────── */
const PALETTES = ['#e11d48','#2563eb','#f59e0b','#8b5cf6','#059669','#f97316','#06b6d4','#84cc16','#ec4899','#0ea5e9'];
const TRIBE_C  = {1:'#3b82f6',2:'#ef4444',3:'#10b981',4:'#f59e0b',5:'#8b5cf6',6:'#06b6d4'};
const TRIBE_N  = {1:'Roman',2:'Teuton',3:'Gaul',4:'Egyptian',5:'Hun',6:'Spartan'};

/* ── STATE ────────────────────────────────────────────────── */
let subjects   = [];
const isFocusMode = () => subjects.length > 0;
let allData    = [];
let dotMode    = 'flat';
let tribeFilter= 0;
let colorMode  = 'tribe';

/* ── INIT AUTH ───────────────────────────────────────────── */
function waitForSupabase(cb, tries = 0) {
  if (typeof window.getUser === 'function') { cb(); return; }
  if (tries > 20) { cb(); return; } // fallback: lanjut tanpa auth
  setTimeout(() => waitForSupabase(cb, tries + 1), 100);
}

async function initAuth() {
  // Update breadcrumb
  const bcServer = document.getElementById('bc-server');
  if (bcServer) {
    bcServer.textContent = SERVER_SLUG;
    bcServer.href = `/s/${SERVER_SLUG}/map/`;
  }

  currentUser = await window.getUser().catch(() => null);
  if (currentUser) {
    userRole    = currentUser.user_metadata?.role || 'free';
    isPlus      = userRole === 'plus' || userRole === 'pro';
    filterLimit = FILTER_LIMITS[userRole] || FILTER_LIMITS.free;
  }

  // Update quota badge
  updateQuotaBadge();

  // Render topbar right (upgrade link jika free)
  const topbarRight = document.getElementById('topbar-right');
  if (!isPlus && topbarRight) {
    topbarRight.innerHTML = `<a href="/pricing/" style="
      font-size:0.75rem;font-weight:600;color:var(--blue2);text-decoration:none;
      padding:5px 12px;border-radius:7px;border:1px solid var(--border2);
      background:var(--blue-glow);transition:all .15s;
    ">⬆ Upgrade for unlimited filters</a>`;
  }
}

function updateQuotaBadge() {
  const badge = document.getElementById('quota-badge');
  if (!badge) return;
  if (isPlus) {
    badge.style.display = 'none';
    return;
  }
  const alliUsed   = subjects.filter(s => s.kind === 'alliance').length;
  const playerUsed = subjects.filter(s => s.kind === 'player').length;
  const alliLimit  = filterLimit.alliances;
  const plLimit    = filterLimit.players;
  if (alliUsed > 0 || playerUsed > 0) {
    badge.style.display = 'inline-flex';
    badge.textContent   = `${alliUsed}/${alliLimit} alliances · ${playerUsed}/${plLimit} players`;
  } else {
    badge.style.display = 'none';
  }
}

/* ── API HELPER ───────────────────────────────────────────── */
async function apiGet(endpoint, params={}) {
  const url = new URL(`${API_BASE}/api/${endpoint}`);
  Object.entries(params).forEach(([k,v]) => { if(v !== null && v !== undefined) url.searchParams.set(k, v); });

  const headers = {};
  try {
    const session = await window.getSession();
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  } catch {}

  const res = await fetch(url.toString(), { headers });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'API error');
  return json;
}

/* ── SEARCH ───────────────────────────────────────────────── */
let searchTimer = null;
const searchInput = document.getElementById('searchInput');
const searchDd    = document.getElementById('searchDd');
let _searchResults = [];

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const q = searchInput.value.trim();
  if(q.length < 1) { hideDd(); return; }
  searchTimer = setTimeout(() => doSearch(q), 300);
});
searchInput.addEventListener('keydown', e => {
  if(e.key === 'Escape') { hideDd(); searchInput.blur(); }
  if(e.key === 'Enter')  { e.preventDefault(); }
});
document.addEventListener('click', e => {
  if(!e.target.closest('.search-wrap')) hideDd();
});
function hideDd() { searchDd.classList.remove('show'); }

async function doSearch(q) {
  const kind = document.getElementById('searchType').value;
  _searchResults = [];
  searchDd.innerHTML = '<div class="search-empty"><span class="spinner"></span> Searching…</div>';
  searchDd.classList.add('show');
  try {
    const data = await apiGet('search', { server: SERVER, q, type: kind });
    const rows = data.rows || [];
    if(!rows.length) { searchDd.innerHTML = `<div class="search-empty">No ${kind === 'alliance' ? 'alliances' : 'players'} found for "${esc(q)}"</div>`; return; }

    if(kind === 'alliance') {
      _searchResults = rows.map(a => ({
        kind:'alliance', key:a.alliance_tag, label:a.alliance_tag,
        member_count:parseInt(a.member_count)||0,
        village_count:parseInt(a.village_count)||0,
        population:parseInt(a.population)||0,
      }));
      searchDd.innerHTML = _searchResults.map((r,i) => `
        <div class="sri" data-idx="${i}">
          <span class="sri-icon">🛡️</span>
          <div style="flex:1;min-width:0">
            <div class="sri-name">[${esc(r.key)}]</div>
            <div class="sri-sub">${r.member_count} members · ${r.village_count} villages · ${fmt(r.population)} pop</div>
          </div>
          <span class="sri-badge alli">Alliance</span>
        </div>`).join('');
    } else {
      _searchResults = rows.map(p => ({
        kind:'player', key:p.player_name, label:p.player_name,
        member_count:0,
        village_count:parseInt(p.village_count)||0,
        population:parseInt(p.population)||0,
        tribe:p.tribe, alliance_tag:p.alliance_tag,
      }));
      searchDd.innerHTML = _searchResults.map((r,i) => `
        <div class="sri" data-idx="${i}">
          <span class="sri-icon">👤</span>
          <div style="flex:1;min-width:0">
            <div class="sri-name">${esc(r.key)}</div>
            <div class="sri-sub">${r.alliance_tag?'['+esc(r.alliance_tag)+'] · ':''}${TRIBE_N[r.tribe]||''} · ${r.village_count} villages · ${fmt(r.population)} pop</div>
          </div>
          <span class="sri-badge player">Player</span>
        </div>`).join('');
    }
    searchDd.querySelectorAll('.sri[data-idx]').forEach(el => {
      el.addEventListener('click', () => {
        const r = _searchResults[parseInt(el.dataset.idx)];
        if(r) addSubject(r.kind, r.key, r.label, r.member_count, r.village_count, r.population);
      });
    });
  } catch(e) {
    searchDd.innerHTML = `<div class="search-empty" style="color:var(--red)">Error: ${esc(e.message)}</div>`;
  }
}

/* ── SUBJECTS ─────────────────────────────────────────────── */
function addSubject(kind, key, label, memberCount, villageCount, population) {
  if(subjects.find(s => s.kind===kind && s.key===key)) { hideDd(); searchInput.value=''; return; }

  // ── FILTER LIMIT CHECK ──
  const currentCount = subjects.filter(s => s.kind === kind).length;
  const limit = kind === 'alliance' ? filterLimit.alliances : filterLimit.players;
  if (currentCount >= limit) {
    showLimitToast(kind, limit);
    hideDd(); searchInput.value = '';
    return;
  }

  const color = PALETTES[subjects.length % PALETTES.length];
  subjects.push({ kind, key, label, color, info: { member_count: memberCount, village_count: villageCount, population } });
  hideDd();
  searchInput.value = '';
  renderSubjects();
  updateLegend();
  updateQuotaBadge();
}

function showLimitToast(kind, limit) {
  const existing = document.getElementById('limit-toast');
  if (existing) existing.remove();

  const isAllianceKind = kind === 'alliance';
  const toast = document.createElement('div');
  toast.id = 'limit-toast';
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
    background:var(--navy);color:#fff;padding:12px 20px;border-radius:10px;
    font-size:0.8rem;font-weight:500;z-index:9999;
    box-shadow:0 8px 28px rgba(15,33,83,.25);
    display:flex;align-items:center;gap:12px;
  `;
  toast.innerHTML = `
    <span>Free plan: max ${limit} ${isAllianceKind ? 'alliances' : 'players'} per map</span>
    <a href="/pricing/" style="color:var(--blue-light);font-weight:700;text-decoration:none;white-space:nowrap;">Upgrade →</a>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:1rem;line-height:1;padding:0;margin-left:4px;">✕</button>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 4000);
}

function removeSubject(kind, key) {
  subjects = subjects.filter(s => !(s.kind===kind && s.key===key));
  subjects.forEach((s,i) => s.color = PALETTES[i % PALETTES.length]);
  renderSubjects();
  updateLegend();
  updateQuotaBadge();
}

function renderSubjects() {
  const listEl   = document.getElementById('subjectList');
  const bannerEl = document.getElementById('modeBanner');
  if(subjects.length === 0) {
    bannerEl.textContent = 'Show all villages. Add a player/alliance above to focus on them.';
    bannerEl.className   = 'mode-banner all-mode';
    listEl.style.display = 'none';
    listEl.innerHTML     = '';
    return;
  }
  const names = subjects.map(s => (s.kind==='alliance'?'[':'')+s.label+(s.kind==='alliance'?']':'')).join(', ');
  bannerEl.textContent = `Focus mode: showing villages of ${names}`;
  bannerEl.className   = 'mode-banner';
  listEl.style.display = 'flex';
  listEl.innerHTML = subjects.map(s => {
    const icon     = s.kind==='alliance' ? '🛡️' : '👤';
    const dispName = s.kind==='alliance' ? `[${esc(s.label)}]` : esc(s.label);
    const sub      = s.kind==='alliance'
      ? `${s.info.member_count} members · ${s.info.village_count} villages`
      : `${s.info.village_count} villages · ${fmt(s.info.population)} pop`;
    return `<div class="subject-item" style="border-color:${s.color}22;background:${s.color}08"
        data-skind="${esc(s.kind)}" data-skey="${esc(s.key)}">
      <span class="subject-dot" style="background:${s.color}"></span>
      <div style="flex:1;min-width:0">
        <div class="subject-label">${icon} ${dispName}</div>
        <div class="subject-sub">${sub}</div>
      </div>
      <button class="subject-remove" title="Remove">✕</button>
    </div>`;
  }).join('');
  listEl.querySelectorAll('.subject-item').forEach(el => {
    el.querySelector('.subject-remove').addEventListener('click', e => {
      e.stopPropagation();
      removeSubject(el.dataset.skind, el.dataset.skey);
    });
  });
}

/* ── SIDEBAR CONTROLS ─────────────────────────────────────── */
function setTribe(el) {
  document.querySelectorAll('#tribeChips .chip').forEach(c=>c.classList.remove('on'));
  el.classList.add('on');
  tribeFilter = parseInt(el.dataset.t);
}
function setDotMode(m, el) {
  dotMode = m;
  ['rFlat','rPop','rDensity'].forEach(id=>document.getElementById(id).classList.remove('on'));
  el.classList.add('on');
}
function setColorMode(m, el) {
  colorMode = m;
  ['rColorTribe','rColorSubject'].forEach(id=>document.getElementById(id).classList.remove('on'));
  el.classList.add('on');
}
function syncSl(el, vid, isRange) {
  document.getElementById(vid).textContent = isRange ? '±'+el.value : el.value;
}

function updateLegend() {
  let html = '';
  if(subjects.length > 0 && colorMode === 'subject') {
    html = subjects.map(s => {
      const icon = s.kind==='alliance' ? '🛡️' : '👤';
      const name = s.kind==='alliance' ? `[${esc(s.label)}]` : esc(s.label);
      return `<div class="leg"><span class="leg-sw" style="background:${s.color}"></span>${icon} ${name}</div>`;
    }).join('');
  } else {
    const tribes = tribeFilter > 0 ? [[tribeFilter, TRIBE_C[tribeFilter]]] : Object.entries(TRIBE_C);
    html  = tribes.map(([t,c]) => `<div class="leg"><span class="leg-sw" style="background:${c}"></span>${TRIBE_N[t]||'?'}</div>`).join('');
    html += `<div class="leg"><span class="leg-sw" style="background:#d97706"></span>Natar</div>`;
  }
  document.getElementById('legend').innerHTML = html;
}

/* ── FETCH DATA ───────────────────────────────────────────── */
async function fetchData() {
  const range    = parseInt(document.getElementById('slRange').value);
  const minPop   = parseInt(document.getElementById('slPop').value) || 0;
  const focusMode      = isFocusMode();
  const playerSubjects = subjects.filter(s=>s.kind==='player').map(s=>s.key);
  const alliSubjects   = subjects.filter(s=>s.kind==='alliance').map(s=>s.key);

  setProgress(40, 'Fetching village data…');

  const params = { server: SERVER };
  if(focusMode) {
    if(playerSubjects.length)  params.players   = playerSubjects.join(',');
    if(alliSubjects.length)    params.alliances  = alliSubjects.join(',');
  } else {
    params.range  = range;
    params.minPop = minPop;
    params.tribe  = tribeFilter;
  }

  const data = await apiGet('map', params);
  return (data.rows || []).map(o => ({
    x:         parseInt(o.x)||0,
    y:         parseInt(o.y)||0,
    tribe:     parseInt(o.tribe)||0,
    name:      o.village_name||'',
    owner:     o.player_name||'',
    alliance:  o.alliance_tag||'',
    pop:       parseInt(o.population)||0,
    isCapital: parseInt(o.is_capital)===1,
    playerId:  parseInt(o.player_id)||0,
  }));
}

/* ── DOT COLOR ────────────────────────────────────────────── */
function getDotColor(d) {
  if(isFocusMode() && colorMode === 'subject') {
    for(const s of subjects) {
      if(s.kind==='player'   && d.owner    === s.key) return s.color;
      if(s.kind==='alliance' && d.alliance === s.key) return s.color;
    }
    return '#94a3b8';
  }
  if(d.playerId === 0 || !d.owner) return '#d97706';
  return TRIBE_C[d.tribe] || '#2563eb';
}

/* ── BUILD MAP ────────────────────────────────────────────── */
async function buildMap() {
  const btn = document.getElementById('showMapBtn');
  btn.disabled = true; btn.textContent = 'Loading…';
  setProgress(10, 'Connecting…');
  try {
    allData = await fetchData();
    setProgress(70, 'Rendering SVG…');
    await new Promise(r => setTimeout(r, 12));
    renderSVG();
    const n = allData.length;
    setProgress(100, `✓ ${n.toLocaleString()} villages rendered`);
    document.getElementById('saveSvgBtn').disabled = false;
    setTimeout(() => setProgress(0, `${n.toLocaleString()} villages loaded`), 900);
  } catch(e) {
    setProgress(0, '❌ ' + e.message);
    console.error(e);
  }
  btn.disabled = false; btn.textContent = 'Show Map';
}

/* ── SVG RENDERER ─────────────────────────────────────────── */
function renderSVG() {
  const S      = parseInt(document.getElementById('svgSize').value);
  const baseR  = parseFloat(document.getElementById('slDot').value);
  const PAD    = 48;
  const focusMode = isFocusMode();

  let viewMinX, viewMaxX, viewMinY, viewMaxY;
  if(focusMode && allData.length > 0) {
    const xs = allData.map(d=>d.x), ys = allData.map(d=>d.y);
    let dMinX=Math.min(...xs), dMaxX=Math.max(...xs);
    let dMinY=Math.min(...ys), dMaxY=Math.max(...ys);
    const margin = 25;
    viewMinX = Math.floor((dMinX-margin)/25)*25;
    viewMaxX = Math.ceil ((dMaxX+margin)/25)*25;
    viewMinY = Math.floor((dMinY-margin)/25)*25;
    viewMaxY = Math.ceil ((dMaxY+margin)/25)*25;
    const span = Math.max(viewMaxX-viewMinX, viewMaxY-viewMinY);
    const midX = (viewMinX+viewMaxX)/2, midY = (viewMinY+viewMaxY)/2;
    viewMinX=midX-span/2; viewMaxX=midX+span/2;
    viewMinY=midY-span/2; viewMaxY=midY+span/2;
  } else {
    const range = parseInt(document.getElementById('slRange').value);
    viewMinX=-range; viewMaxX=range; viewMinY=-range; viewMaxY=range;
  }

  const spanW = viewMaxX - viewMinX;
  const scale = (S - PAD*2) / spanW;
  const wx2s  = wx => PAD + (wx - viewMinX) * scale;
  const wy2s  = wy => PAD + (viewMaxY - wy) * scale;
  const maxPop = Math.max(1, ...allData.map(d=>d.pop));

  const GN = 72;
  let dGrid = null;
  if(dotMode === 'density') {
    dGrid = new Float32Array(GN*GN);
    const cs = spanW/GN;
    for(const d of allData) {
      const gx=Math.floor((d.x-viewMinX)/cs), gy=Math.floor((d.y-viewMinY)/cs);
      if(gx>=0&&gx<GN&&gy>=0&&gy<GN) dGrid[gy*GN+gx]++;
    }
  }

  let p = [];
  p.push(`<rect width="${S}" height="${S}" fill="#f0f4fb"/>`);

  const gS25X = Math.ceil(viewMinX/25)*25, gS25Y = Math.ceil(viewMinY/25)*25;
  p.push(`<g stroke="rgba(37,99,235,0.08)" stroke-width="0.5">`);
  for(let v=gS25X; v<=viewMaxX; v+=25){ p.push(`<line x1="${wx2s(v).toFixed(1)}" y1="${PAD}" x2="${wx2s(v).toFixed(1)}" y2="${S-PAD}"/>`); }
  for(let v=gS25Y; v<=viewMaxY; v+=25){ p.push(`<line x1="${PAD}" y1="${wy2s(v).toFixed(1)}" x2="${S-PAD}" y2="${wy2s(v).toFixed(1)}"/>`); }
  p.push(`</g>`);
  const gS100X=Math.ceil(viewMinX/100)*100, gS100Y=Math.ceil(viewMinY/100)*100;
  p.push(`<g stroke="rgba(37,99,235,0.16)" stroke-width="0.8">`);
  for(let v=gS100X; v<=viewMaxX; v+=100){ p.push(`<line x1="${wx2s(v).toFixed(1)}" y1="${PAD}" x2="${wx2s(v).toFixed(1)}" y2="${S-PAD}"/>`); }
  for(let v=gS100Y; v<=viewMaxY; v+=100){ p.push(`<line x1="${PAD}" y1="${wy2s(v).toFixed(1)}" x2="${S-PAD}" y2="${wy2s(v).toFixed(1)}"/>`); }
  p.push(`</g>`);

  if(viewMinX<=0&&viewMaxX>=0) p.push(`<line x1="${wx2s(0).toFixed(1)}" y1="${PAD}" x2="${wx2s(0).toFixed(1)}" y2="${S-PAD}" stroke="rgba(37,99,235,0.30)" stroke-width="1.2"/>`);
  if(viewMinY<=0&&viewMaxY>=0) p.push(`<line x1="${PAD}" y1="${wy2s(0).toFixed(1)}" x2="${S-PAD}" y2="${wy2s(0).toFixed(1)}" stroke="rgba(37,99,235,0.30)" stroke-width="1.2"/>`);

  const fs = Math.max(7, Math.min(10, Math.round(S/120)));
  const lS50X=Math.ceil(viewMinX/50)*50, lS50Y=Math.ceil(viewMinY/50)*50;
  p.push(`<g font-family="'Space Grotesk',sans-serif" font-size="${fs}" fill="rgba(37,99,235,0.36)" text-anchor="middle">`);
  for(let v=lS50X; v<=viewMaxX; v+=50) p.push(`<text x="${wx2s(v).toFixed(1)}" y="${S-PAD+14}">${v}</text>`);
  for(let v=lS50Y; v<=viewMaxY; v+=50) p.push(`<text x="${PAD-6}" y="${(parseFloat(wy2s(v).toFixed(1))+3).toFixed(1)}" text-anchor="end">${v}</text>`);
  p.push(`</g>`);

  if(dotMode==='density' && dGrid) {
    const cs=spanW/GN, ps=(S-PAD*2)/spanW*cs, mxD=Math.max(1,...dGrid);
    p.push(`<g>`);
    for(let gy=0;gy<GN;gy++) for(let gx=0;gx<GN;gx++){
      const v=dGrid[gy*GN+gx]; if(!v) continue;
      const t=v/mxD, r2=Math.round(t*230), g2=Math.round((1-t)*80), b2=Math.round((1-t)*120);
      const wx=viewMinX+gx*cs, wy=viewMinY+(GN-1-gy)*cs;
      p.push(`<rect x="${wx2s(wx).toFixed(1)}" y="${wy2s(wy+cs).toFixed(1)}" width="${ps.toFixed(1)}" height="${ps.toFixed(1)}" fill="rgb(${r2},${g2},${b2})" opacity="${(0.15+t*0.78).toFixed(2)}" rx="1"/>`);
    }
    p.push(`</g>`);
  }

  function getR(d) {
    if(dotMode==='flat'||dotMode==='density') return baseR;
    if(!d.pop) return baseR*0.45;
    return Math.max(1.5, Math.min(baseR*5, baseR*Math.sqrt(d.pop/maxPop)*4));
  }

  if(focusMode && colorMode==='subject') {
    for(const s of subjects) {
      const sData = allData.filter(d => s.kind==='player' ? d.owner===s.key : d.alliance===s.key);
      p.push(`<g opacity="0.92">`);
      for(const d of sData) {
        const sx=wx2s(d.x).toFixed(1), sy=wy2s(d.y).toFixed(1), r=getR(d).toFixed(1);
        const tt=`${esc(d.name)} | ${esc(d.owner)} | [${esc(d.alliance)}] | pop:${d.pop} | (${d.x},${d.y})`;
        if(d.isCapital) p.push(`<circle cx="${sx}" cy="${sy}" r="${(parseFloat(r)+1.5).toFixed(1)}" fill="${s.color}" opacity="0.25"/>`);
        p.push(`<circle cx="${sx}" cy="${sy}" r="${r}" fill="${s.color}"><title>${tt}</title></circle>`);
      }
      p.push(`</g>`);
    }
  } else {
    p.push(`<g opacity="0.85">`);
    for(const d of allData) {
      const sx=wx2s(d.x).toFixed(1), sy=wy2s(d.y).toFixed(1), r=getR(d).toFixed(1), c=getDotColor(d);
      const tt=`${esc(d.name)} | ${esc(d.owner)} | [${esc(d.alliance)}] | pop:${d.pop} | (${d.x},${d.y})`;
      if(d.isCapital) p.push(`<circle cx="${sx}" cy="${sy}" r="${(parseFloat(r)+1.5).toFixed(1)}" fill="${c}" opacity="0.25"/>`);
      p.push(`<circle cx="${sx}" cy="${sy}" r="${r}" fill="${c}"><title>${tt}</title></circle>`);
    }
    p.push(`</g>`);
  }

  p.push(`<rect x="${PAD}" y="${PAD}" width="${S-PAD*2}" height="${S-PAD*2}" fill="none" stroke="rgba(37,99,235,0.12)" stroke-width="1" rx="2"/>`);
  p.push(buildKeyBox(S, baseR));

  const svg = document.getElementById('mapSvg');
  svg.setAttribute('width', S); svg.setAttribute('height', S);
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  svg.innerHTML = p.join('');
  svg.style.display = 'block';
  document.getElementById('placeholder').style.display = 'none';

  const totalPop  = allData.reduce((a,d)=>a+d.pop,0);
  const uniquePl  = new Set(allData.map(d=>d.owner).filter(Boolean)).size;
  const uniqueAll = new Set(allData.map(d=>d.alliance).filter(Boolean)).size;
  document.getElementById('sTotal').textContent     = allData.length.toLocaleString();
  document.getElementById('sPlayers').textContent   = uniquePl.toLocaleString();
  document.getElementById('sPop').textContent       = fmt(totalPop);
  document.getElementById('sAlliances').textContent = uniqueAll.toLocaleString();
}

/* ── KEY BOX ──────────────────────────────────────────────── */
function buildKeyBox(S, baseR) {
  const r = Math.min(4.5, Math.max(2.5, baseR));
  const focusMode = isFocusMode();
  let entries = [];
  if(focusMode && colorMode==='subject') {
    entries = subjects.map(s => ({ c:s.color, label: s.kind==='alliance'?`[${s.label}]`:s.label }));
  } else {
    const tribes = tribeFilter>0 ? [[tribeFilter,TRIBE_C[tribeFilter]]] : Object.entries(TRIBE_C);
    entries = tribes.map(([t,c])=>({c, label:TRIBE_N[t]||'?'}));
    entries.push({c:'#d97706', label:'Natar'});
  }
  const LH=13,PX=9,PY=7, BW=126, BH=PY*2+entries.length*LH;
  const BX=S-BW-12, BY=12;
  let s=`<g><rect x="${BX}" y="${BY}" width="${BW}" height="${BH}" rx="7" fill="rgba(255,255,255,0.93)" stroke="rgba(37,99,235,0.1)" stroke-width="1"/>`;
  entries.forEach((e,i)=>{
    const ey=BY+PY+i*LH+5;
    s+=`<circle cx="${BX+PX+4.5}" cy="${ey}" r="${r}" fill="${e.c}"/>`;
    s+=`<text x="${BX+PX+14}" y="${ey+3.5}" font-family="'DM Sans',sans-serif" font-size="9" fill="#0f2153">${esc(e.label)}</text>`;
  });
  return s+`</g>`;
}

/* ── SAVE SVG ─────────────────────────────────────────────── */
function saveSvg() {
  const svg = document.getElementById('mapSvg');
  if(!svg||svg.style.display==='none') return;
  const src = '<?xml version="1.0" encoding="utf-8"?>\n' + svg.outerHTML;
  const blob = new Blob([src], {type:'image/svg+xml'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `travian-map-${SERVER_SLUG}-${Date.now()}.svg`;
  a.click();
}

/* ── AUTO-LOAD from URL params ────────────────────────────── */
async function autoLoadFromUrl() {
  const params       = new URLSearchParams(location.search);
  const playerName   = params.get('player');
  const allianceTag  = params.get('alliance');
  if(!playerName && !allianceTag) return;
  setProgress(20, 'Loading from link…');
  if(playerName) {
    try {
      const data = await apiGet('search', { server: SERVER, q: playerName, type: 'player' });
      const p = (data.rows||[]).find(r => r.player_name === playerName);
      if(p) addSubject('player', p.player_name, p.player_name, 0, parseInt(p.village_count)||0, parseInt(p.population)||0);
    } catch(e) { console.error(e); }
  }
  if(allianceTag) {
    try {
      const data = await apiGet('search', { server: SERVER, q: allianceTag, type: 'alliance' });
      const a = (data.rows||[]).find(r => r.alliance_tag === allianceTag);
      if(a) addSubject('alliance', a.alliance_tag, a.alliance_tag, parseInt(a.member_count)||0, parseInt(a.village_count)||0, parseInt(a.population)||0);
    } catch(e) { console.error(e); }
  }
  await buildMap();
}

/* ── UTILS ────────────────────────────────────────────────── */
function setProgress(pct, msg) {
  document.getElementById('progFill').style.width = pct + '%';
  if(msg) document.getElementById('barInfo').textContent = msg;
}
function fmt(n) { return Number(n||0).toLocaleString(); }
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ── BOOT ─────────────────────────────────────────────────── */
waitForSupabase(() => {
  initAuth().then(() => {
    renderSubjects();
    updateLegend();
    autoLoadFromUrl();
  });
});

