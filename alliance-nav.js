/**
 * alliance-nav.js — Shared vertical sidebar navigation for all /alliance/* pages
 *
 * Usage (setiap halaman alliance):
 *   HTML wajib:
 *     <div id="navbar-root"></div>
 *     <div id="alliance-layout">
 *       <div id="alliance-nav-root"></div>
 *       <main id="alliance-main"> ... </main>
 *     </div>
 *   Load order:
 *     supabase.js → servers.js → navbar.js → alliance-nav.js
 *
 * Sidebar hanya muncul jika ada workspace aktif di sessionStorage.
 * Jika tidak ada, #alliance-nav-root tetap kosong (tidak render sidebar).
 */

(function () {
  'use strict';

  // ── NAVIGATION TREE ──────────────────────────────────────────────
  const NAV_ITEMS = [
    {
      id:        'overview',
      label:     'Overview',
      icon:      '<img src="/cdn/icons/building/embassy.png" alt="Overview" width="20" align="absmiddle"/>',
      href:      '/alliance/workspace/',
      coordOnly: false,
    },
    {
      id:        'settings',
      label:     'Settings',
      icon:      '⚙️',
      href:      '/alliance/workspace/?page=settings',
      coordOnly: true,
      indent:    true,
    },
    { type: 'divider' },
    {
      id:        'troops',
      label:     'Troop Summary',
      icon:      '<img src="/cdn/icons/building/rally_point.png" alt="Troop Summary" width="20" align="absmiddle"/>',
      href:      '/alliance/troop-summary/',
      coordOnly: false,
      sub: [
        {
          id:        'alliance-troops',
          label:     'Alliance Troops',
          icon:      '👥',
          href:      '/alliance/troop-summary/?view=alliance',
          coordOnly: true,
        },
      ],
    },
    {
      id:        'attack',
      label:     'Attack Plan',
      icon:      '<img src="/cdn/icons/combat/offence_medium.png" alt="Attack Plan" width="20" align="absmiddle"/>',
      href:      '/alliance/coordinate-attack/',
      coordOnly: false,
      sub: [
        {
          id:        'create-attack',
          label:     'Create Attack Plan',
          icon:      '<img src="/cdn/icons/combat/troopCount_small.png" alt="Defense Tracker" width="15" align="absmiddle"/>',
          href:      '/alliance/coordinate-attack/?action=create',
          coordOnly: true,
        },
      ],
    },
    {
      id:        'defense',
      label:     'Defense Plan',
      icon:      '<img src="/cdn/icons/combat/defence_medium.png" alt="Defense Plan" width="20" align="absmiddle"/>',
      href:      '/alliance/coordinate-defense/',
      coordOnly: false,
      sub: [
        {
          id:        'create-defense',
          label:     'Create Defense Plan',
          icon:      '<img src="/cdn/icons/combat/troopCount_small.png" alt="Defense Tracker" width="15" align="absmiddle"/>',
          href:      '/alliance/coordinate-defense/?action=create',
          coordOnly: true,
        },
      ],
    },
    {
      id:        'artifact',
      label:     'Artifact Plan',
      icon:      '<img src="/cdn/icons/building/treasury.png" alt="Artifact Plan" width="20" align="absmiddle"/>',
      href:      '/alliance/artifact-tracker/',
      coordOnly: false,
    },
    { type: 'divider' },
    {
      id:        'ww',
      label:     'World Wonder',
      icon:      '<img src="/cdn/icons/building/wonder_of_the_world.png" alt="World Wonder" width="20" align="absmiddle"/>',
      href:      '/alliance/world-wonder/',
      coordOnly: false,
      sub: [
        {
          id:        'call-resource',
          label:     'Call for Resource',
          icon:      '<img src="/cdn/icons/resource/resources_medium.png" alt="Call for Resource" width="20" align="absmiddle"/>',
          href:      '/alliance/world-wonder/?action=call-resource',
          coordOnly: true,
        },
        {
          id:        'def-tracker',
          label:     'Defense Tracker',
          icon:      '<img src="/cdn/icons/combat/troopCount_small.png" alt="Defense Tracker" width="15" align="absmiddle"/>',
          href:      '/alliance/world-wonder/?action=def-tracker',
          coordOnly: true,
        },
      ],
    },
  ];

  // ── CSS ──────────────────────────────────────────────────────────
  const CSS = `
    #alliance-layout {
      display: flex;
      min-height: calc(100vh - 64px);
    }
    #alliance-main {
      flex: 1;
      min-width: 0;
      overflow-x: hidden;
    }

    /* ── SIDEBAR ── */
    #alliance-sidenav {
      width: 220px;
      flex-shrink: 0;
      border-right: 1px solid var(--border);
      background: var(--surface2);
      display: flex;
      flex-direction: column;
      transition: width 0.22s cubic-bezier(0.4,0,0.2,1);
      overflow: hidden;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
    }
    #alliance-sidenav.an-collapsed {
      width: 52px;
    }

    /* Header */
    .an-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 10px 10px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
      min-height: 56px;
      gap: 6px;
    }

    /* Workspace switcher button */
    .an-ws-btn {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      background: none;
      border: none;
      cursor: pointer;
      text-align: left;
      padding: 4px 6px;
      border-radius: 7px;
      transition: background 0.13s;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .an-ws-btn:hover {
      background: var(--border);
    }
    .an-ws-btn:hover .an-ws-name::after {
      content: ' ↗';
      font-size: 0.65rem;
      opacity: 0.6;
    }
    .an-header-label {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text3);
      white-space: nowrap;
      overflow: hidden;
      display: block;
    }
    .an-ws-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--navy);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: block;
    }
    #alliance-sidenav.an-collapsed .an-ws-btn {
      opacity: 0;
      pointer-events: none;
      width: 0;
      padding: 0;
      flex: 0;
    }

    .an-collapse-btn {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: transparent;
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--text3);
      font-size: 0.75rem;
      transition: all 0.14s;
      flex-shrink: 0;
    }
    .an-collapse-btn:hover {
      background: var(--surface);
      color: var(--navy);
      border-color: var(--border2);
    }
    #alliance-sidenav.an-collapsed .an-header {
      justify-content: center;
    }
    #alliance-sidenav.an-collapsed .an-collapse-btn {
      margin: 0;
    }

    /* Body */
    .an-body {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 0 16px;
    }
    .an-body::-webkit-scrollbar { width: 3px; }
    .an-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    /* Nav items */
    .an-item {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 8px 11px;
      margin: 1px 6px;
      border-radius: 9px;
      cursor: pointer;
      text-decoration: none;
      color: var(--text2);
      font-size: 0.84rem;
      font-weight: 500;
      transition: background 0.13s, color 0.13s;
      white-space: nowrap;
      overflow: hidden;
      position: relative;
    }
    .an-item:hover { background: var(--surface); color: var(--navy); }
    .an-item.an-active { background: var(--green-bg); color: var(--green); }
    .an-item.an-active .an-item-icon { opacity: 1; }

    .an-item-icon {
      font-size: 1rem;
      flex-shrink: 0;
      width: 20px;
      text-align: center;
      opacity: 0.8;
    }
    .an-item-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: opacity 0.15s, width 0.15s;
    }
    #alliance-sidenav.an-collapsed .an-item-label {
      opacity: 0;
      width: 0;
      pointer-events: none;
    }
    #alliance-sidenav.an-collapsed .an-item {
      justify-content: center;
      padding: 9px 6px;
      margin: 1px 4px;
    }

    /* Sub-items */
    .an-sub .an-item {
      padding-left: 36px;
      font-size: 0.8rem;
      color: var(--text3);
    }
    #alliance-sidenav.an-collapsed .an-sub .an-item { padding-left: 6px; }
    .an-sub .an-item:hover { color: var(--text2); }
    .an-sub .an-item.an-active { background: var(--green-bg); color: var(--green); }

    /* Divider */
    .an-divider { height: 1px; background: var(--border); margin: 6px 12px; }

    /* Tooltip saat collapsed */
    #alliance-sidenav.an-collapsed .an-item[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      left: calc(100% + 10px);
      top: 50%;
      transform: translateY(-50%);
      background: var(--navy);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 7px;
      white-space: nowrap;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 4px 12px rgba(15,33,83,0.2);
    }

    /* Mobile */
    @media (max-width: 768px) {
      #alliance-sidenav { display: none; }
      .an-mobile-bar { display: flex !important; }
    }
    .an-mobile-bar {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--surface2);
      overflow-x: auto;
    }
    .an-mobile-bar::-webkit-scrollbar { display: none; }
    .an-mobile-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--text2);
      text-decoration: none;
      white-space: nowrap;
      border: 1px solid transparent;
      transition: all 0.14s;
      flex-shrink: 0;
    }
    .an-mobile-item:hover { background: var(--surface); color: var(--navy); border-color: var(--border); }
    .an-mobile-item.an-active { background: var(--green-bg); color: var(--green); border-color: rgba(5,150,105,0.2); }
  `;

  // ── HELPERS ──────────────────────────────────────────────────────
  function injectCSS() {
    if (document.getElementById('alliance-nav-css')) return;
    const style = document.createElement('style');
    style.id = 'alliance-nav-css';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function getWorkspace() {
    try {
      const raw = sessionStorage.getItem('tt_active_workspace');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function isCoordinator(ws) {
    if (!ws) return false;
    return ws.role === 'founder' || ws.role === 'coordinator';
  }

  function getActiveId() {
    const path   = window.location.pathname.replace(/\/$/, '');
    const params = new URLSearchParams(window.location.search);
    const view   = params.get('view');
    const action = params.get('action');
    const page   = params.get('page');

    if (path.endsWith('/alliance/workspace')) {
      if (page === 'settings') return 'settings';
      return 'overview';
    }
    if (path.endsWith('/alliance/troop-summary')) {
      if (view === 'alliance') return 'alliance-troops';
      return 'troops';
    }
    if (path.endsWith('/alliance/coordinate-attack')) {
      if (action === 'create') return 'create-attack';
      return 'attack';
    }
    if (path.endsWith('/alliance/coordinate-defense')) {
      if (action === 'create') return 'create-defense';
      return 'defense';
    }
    if (path.endsWith('/alliance/artifact-tracker')) return 'artifact';
    if (path.endsWith('/alliance/world-wonder')) {
      if (action === 'call-resource') return 'call-resource';
      if (action === 'def-tracker')   return 'def-tracker';
      return 'ww';
    }
    return 'overview';
  }

  // ── BUILD HTML ───────────────────────────────────────────────────
  function buildSidebarHTML(ws, isCoord, activeId) {
    const wsName = ws ? ws.name : '—';

    let itemsHTML = '';
    NAV_ITEMS.forEach(item => {
      if (item.type === 'divider') {
        itemsHTML += '<div class="an-divider"></div>';
        return;
      }
      if (item.coordOnly && item.indent) return; // settings dirender manual setelah overview
      if (item.coordOnly && !isCoord) return;

      const active = activeId === item.id ? ' an-active' : '';
      itemsHTML += `<a class="an-item${active}" href="${item.href}" data-tooltip="${item.label}">
        <span class="an-item-icon">${item.icon}</span>
        <span class="an-item-label">${item.label}</span>
      </a>`;

      // Settings indent di bawah overview
      if (item.id === 'overview' && isCoord) {
        const s = NAV_ITEMS.find(i => i.id === 'settings');
        if (s) {
          const sa = activeId === 'settings' ? ' an-active' : '';
          itemsHTML += `<div class="an-sub"><a class="an-item${sa}" href="${s.href}" data-tooltip="${s.label}">
            <span class="an-item-icon">${s.icon}</span>
            <span class="an-item-label">${s.label}</span>
          </a></div>`;
        }
      }

      // Sub-items
      if (item.sub && item.sub.length) {
        const visibleSubs = item.sub.filter(s => !s.coordOnly || isCoord);
        if (visibleSubs.length) {
          itemsHTML += '<div class="an-sub">';
          visibleSubs.forEach(s => {
            const sa = activeId === s.id ? ' an-active' : '';
            itemsHTML += `<a class="an-item${sa}" href="${s.href}" data-tooltip="${s.label}">
              <span class="an-item-icon">${s.icon}</span>
              <span class="an-item-label">${s.label}</span>
            </a>`;
          });
          itemsHTML += '</div>';
        }
      }
    });

    return `
      <nav id="alliance-sidenav" aria-label="Alliance navigation">
        <div class="an-header">
          <button class="an-ws-btn" id="anWsBtn" title="Switch workspace" aria-label="Switch workspace">
            <span class="an-header-label">Alliance</span>
            <span class="an-ws-name">${wsName}</span>
          </button>
          <button class="an-collapse-btn" id="anCollapseBtn" title="Collapse sidebar" aria-label="Collapse sidebar">◀</button>
        </div>
        <div class="an-body">
          ${itemsHTML}
        </div>
      </nav>`;
  }

  function buildMobileBarHTML(ws, isCoord, activeId) {
    let html = '<div class="an-mobile-bar" id="allianceMobileBar">';
    NAV_ITEMS.forEach(item => {
      if (item.type === 'divider') return;
      if (item.coordOnly && item.indent) return;
      if (item.coordOnly && !isCoord) return;
      const active = activeId === item.id ? ' an-active' : '';
      html += `<a class="an-mobile-item${active}" href="${item.href}">${item.icon} ${item.label}</a>`;
    });
    html += '</div>';
    return html;
  }

  // ── COLLAPSE PERSISTENCE ─────────────────────────────────────────
  function loadCollapsed() {
    try { return localStorage.getItem('tt_alliance_nav_collapsed') === '1'; } catch { return false; }
  }
  function saveCollapsed(val) {
    try { localStorage.setItem('tt_alliance_nav_collapsed', val ? '1' : '0'); } catch {}
  }

  // ── INIT ─────────────────────────────────────────────────────────
  function init() {
    injectCSS();

    const root = document.getElementById('alliance-nav-root');
    if (!root) return;

    const ws       = getWorkspace();
    const coord    = isCoordinator(ws);
    const activeId = getActiveId();

    // ── FIX 1: Jika tidak ada workspace aktif, jangan render sidebar ──
    // Halaman workspace akan handle tampilan selector/form sendiri.
    if (!ws) {
      root.innerHTML = '';
      return;
    }

    // Render sidebar
    root.innerHTML = buildSidebarHTML(ws, coord, activeId);

    // Render mobile bar
    const layout = document.getElementById('alliance-layout');
    const main   = document.getElementById('alliance-main');
    if (layout && main && !document.getElementById('allianceMobileBar')) {
      const tmp = document.createElement('div');
      tmp.innerHTML = buildMobileBarHTML(ws, coord, activeId);
      layout.insertBefore(tmp.firstElementChild, main);
    }

    // Collapse state
    const collapsed = loadCollapsed();
    const sidenav   = document.getElementById('alliance-sidenav');
    const collapseBtn = document.getElementById('anCollapseBtn');

    if (collapsed && sidenav) sidenav.classList.add('an-collapsed');
    if (collapsed && collapseBtn) collapseBtn.textContent = '▶';

    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        const isNow = sidenav.classList.toggle('an-collapsed');
        collapseBtn.textContent = isNow ? '▶' : '◀';
        saveCollapsed(isNow);
      });
    }

    // ── FIX 2: Workspace switcher button ──
    // Klik nama workspace → clear sessionStorage → redirect ke /alliance/workspace/
    // sehingga user kembali ke halaman selector workspace.
    const wsBtn = document.getElementById('anWsBtn');
    if (wsBtn) {
      wsBtn.addEventListener('click', () => {
        try { sessionStorage.removeItem('tt_active_workspace'); } catch(e) {}
        window.location.href = '/alliance/workspace/';
      });
    }
  }

  // ── EXPOSE ───────────────────────────────────────────────────────
  window.AllianceNav = { init };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();