/**
 * TravianTools — Shared Navbar Component (Server-Aware)
 *
 * CARA PAKAI:
 * 1. Taruh <div id="navbar-root"></div> di awal <body>
 * 2. Load servers.js SEBELUM navbar.js
 * 3. <script src="/servers.js"></script>
 *    <script src="/navbar.js"></script>
 * 4. Selesai!
 *
 * NAVBAR STATE:
 * Belum login : [Tools▾][Statistics▾][Explore▾][Simulators▾]  [Log In][Sign Up Free]
 * Login       : [Tools▾][Statistics▾][Explore▾][Simulators▾]  [●TS5▾][My Stuff▾][Alliance▾][avatar▾]
 */

(function () {

  // ─── DETECT SERVER AKTIF DARI URL ─────────────────────────────────────────
  const STATIC_ROOTS_FB = [
    'tools','simulators','statistics','village-finder','map',
    'select-server','login','register','data','images','scripts','reports','r','account',
  ];
  const STATIC_ROOTS_REF = (typeof STATIC_ROOTS !== 'undefined') ? STATIC_ROOTS : STATIC_ROOTS_FB;
  const SERVER_BASED_TOOLS_REF = (typeof SERVER_BASED_TOOLS !== 'undefined')
    ? SERVER_BASED_TOOLS
    : ['statistics', 'village-finder', 'map'];
  const SERVERS_REF = (typeof SERVERS !== 'undefined') ? SERVERS : [];

  function detectActiveServer() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    if (parts[0] !== 's') return null;
    const slug = parts[1];
    if (!slug || slug.includes('.html')) return null;
    if (SERVERS_REF.length) {
      return SERVERS_REF.find(s => s.slug === slug) ? slug : null;
    }
    return slug;
  }

  function getActiveToolFromURL() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 3 && parts[0] === 's' && activeServer && parts[1] === activeServer) {
      return parts[2];
    }
    return null;
  }

  function resolveServerToolHref(toolSlug) {
    if (activeServer) return `/s/${activeServer}/${toolSlug}/`;
    return `/s/?redirect=${toolSlug}`;
  }

  const activeServer      = detectActiveServer();
  const activeTool        = getActiveToolFromURL();
  const activeServerData  = SERVERS_REF.find(s => s.slug === activeServer) || null;
  const activeServerLabel = activeServerData ? activeServerData.label : (activeServer || '');

  // ─── KONFIGURASI NAVBAR (menu statis — tampil untuk semua user) ────────────
  const NAVBAR_CONFIG = {
    logo: { icon: '<img src="/cdn/icons/building/academy.png" alt="TravianTools" width="30" align="absmiddle"/>', name: 'TravianTools', href: '/' },

    menuItems: [
      {
        label: 'Tools',
        dropdown: [
          { icon: '⚔️', title: 'Battle Report',    desc: 'Parse & share battle reports',       badge: 'FREE', href: '/reports/',                      serverBased: false },
          { icon: '🏰', title: 'Building Cost',    desc: 'Construction cost per level',        badge: 'FREE', href: '/tools/building-costs/',          serverBased: false },
          { icon: '🕵️', title: 'Spy Productivity', desc: 'Estimate resource production',       badge: 'FREE', href: '/tools/spy-on-productivity/',     serverBased: false },
          { icon: '⚔️', title: 'Attack Planner',   desc: 'Plan multi-wave attacks',            badge: 'FREE', href: '/tools/attack-planner/',          serverBased: false },
          { icon: '🏘️', title: 'Village Tree',     desc: 'Visualize your expansion tree',      badge: 'FREE', href: '/tools/village-tree/',            serverBased: false },
        ],
      },
      {
        label: 'Statistics',
        dropdown: [
          { icon: '📈', title: 'Server Statistics', desc: 'Track player & alliance growth',    badge: 'FREE', serverTool: 'statistics',                 serverBased: true  },
          { icon: '💤', title: 'Inactive Search',   desc: 'Find inactive players & villages',  badge: 'FREE', serverTool: 'statistics/inactive-search', serverBased: true  },
        ],
      },
      {
        label: 'Explore',
        dropdown: [
          { icon: '🗺️', title: 'Interactive Map',  desc: 'Explore the live server map',       badge: 'FREE', serverTool: 'map',                        serverBased: true  },
          { icon: '🌿', title: 'Village Finder',   desc: 'Search best village for settler',   badge: 'PLUS', serverTool: 'village-finder',             serverBased: true  },
          { icon: '🌿', title: 'Oasis Database',   desc: 'All oasis for your farming needs',  badge: 'PLUS', serverTool: 'oasis-data',                 serverBased: true  },
        ],
      },
      {
        label: 'Simulators',
        dropdown: [
          { icon: '🌾', title: 'Field Production', desc: 'Simulate resource output per hour', badge: 'FREE', href: '/simulators/field-production/',    serverBased: false },
          { icon: '🏘️', title: 'Village Planner',  desc: 'Plan buildings & upgrade path',    badge: 'FREE', href: '/simulators/village-planner/',     serverBased: false },
          { icon: '⚔️', title: 'Combat Simulator', desc: 'Simulate attack vs defense',       badge: 'SOON', href: '#',                               serverBased: false },
          { icon: '⏱️', title: 'Troop Training',   desc: 'Time & cost to build an army',     badge: 'SOON', href: '#',                               serverBased: false },
          { icon: '🌾', title: 'Crop Balance',     desc: 'Net crop after troop consumption', badge: 'SOON', href: '#',                               serverBased: false },
        ],
      },
    ],

    // Menu login-only — dirender oleh updateAuthState()
    myStuffItems: [
      { icon: '👁', title: 'Intelligence',           desc: 'Your personal data',         badge: 'FREE', href: '/account/intelligence/'     },
      { icon: '⚔️', title: 'Archive',  desc: 'Saved report history',               badge: 'PRO',  href: '/account/saved-reports/'   },
    ],

    allianceItems: [
      { icon: '🏰', title: 'Workspace',       desc: 'Alliance dashboard & overview',      badge: 'FREE', href: '/alliance/workspace/'           },
      { icon: '💂', title: 'Troop Summary',   desc: 'Aggregate member troops',            badge: 'FREE',  href: '/alliance/troop-summary/'    },
      { icon: '🗡️', title: 'Attack Plan',     desc: 'Coordinate multi-target attacks',    badge: 'FREE',  href: '/alliance/coordinate-attack/'    },
      { icon: '🛡️', title: 'Defense Plan',    desc: 'Organize defensive assignments',     badge: 'FREE',  href: '/alliance/coordinate-defense/'   },
      { icon: '🏺', title: 'Artifact Tracker',desc: 'Track alliance artifacts',           badge: 'SOON',  href: '#' },
      { icon: '🌟', title: 'World Wonder',    desc: 'WW build progress tracker',          badge: 'SOON',  href: '#'        },
    ],

    cta: {
      login:  { label: 'Log In',       href: '/login/'    },
      signup: { label: 'Sign Up Free', href: '/register/' },
    },
  };

  // ─── RESOLVE HREF ──────────────────────────────────────────────────────────
  function resolveHref(item) {
    if (item.serverBased && item.serverTool) return resolveServerToolHref(item.serverTool);
    return item.href || '#';
  }

  // ─── BADGE STYLES ──────────────────────────────────────────────────────────
  const BADGE_STYLES = {
    FREE:  'background:rgba(5,150,105,0.10);color:#059669;',
    PRO:   'background:rgba(217,119,6,0.08);color:#d97706;',
    PLUS:  'background:rgba(124,58,237,0.08);color:#7c3aed;',
    SOON:  'background:rgba(120,140,170,0.10);color:#7a93bc;',
    NEW:   'background:rgba(217,119,6,0.08);color:#d97706;',
  };
  function getBadgeStyle(badge) { return BADGE_STYLES[badge] || BADGE_STYLES.SOON; }

  // ─── DETECT ACTIVE PAGE ────────────────────────────────────────────────────
  function isActive(href) {
    if (!href || href === '#') return false;
    const path = window.location.pathname;
    const normalize = h => h.replace(/\/index\.html$/, '/').replace(/\/$/, '') || '/';
    return normalize(path) === normalize(href);
  }
  function isItemActive(item) {
    if (item.serverBased && item.serverTool) {
      // Handle sub-path tools like statistics/inactive-search
      const toolPath = item.serverTool;
      return window.location.pathname.includes(toolPath);
    }
    return isActive(item.href || '');
  }
  function isMenuActive(menuItem) {
    if (menuItem.href) return isActive(menuItem.href);
    if (menuItem.dropdown) return menuItem.dropdown.some(d => isItemActive(d));
    return false;
  }

  // ─── BUILD DROPDOWN (generic) ──────────────────────────────────────────────
  function buildDropdown(items, opts = {}) {
    return `<div class="tt-nav-dropdown">${items.map(item => {
      const href   = opts.resolveHref ? resolveHref(item) : (item.href || '#');
      const active = isItemActive(item);
      const isServer = item.serverBased && item.serverTool;
      return `
      <a href="${href}" class="tt-nav-dd-item${active ? ' tt-nav-dd-item--active' : ''}">
        <span class="tt-nav-dd-icon">${item.icon}</span>
        <span class="tt-nav-dd-text">
          <span class="tt-nav-dd-title">${item.title}${isServer && activeServer ? ` <span class="tt-nav-dd-server-tag">${activeServerLabel}</span>` : ''}</span>
          <span class="tt-nav-dd-desc">${item.desc}</span>
        </span>
        <span class="tt-nav-badge" style="${getBadgeStyle(item.badge)}">${item.badge}</span>
      </a>`;
    }).join('')}</div>`;
  }

  // ─── BUILD STATIC MENU ITEMS ───────────────────────────────────────────────
  function buildMenuItems() {
    return NAVBAR_CONFIG.menuItems.map(item => {
      const active = isMenuActive(item);
      if (item.dropdown) {
        return `
        <div class="tt-nav-item tt-nav-item--has-dd${active ? ' tt-nav-item--active' : ''}">
          <button class="tt-nav-link tt-nav-link--dd" aria-expanded="false" aria-haspopup="true">
            ${item.label}
            <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          ${buildDropdown(item.dropdown, { resolveHref: true })}
        </div>`;
      }
      const href = item.href || '#';
      return `<a href="${href}" class="tt-nav-link${isActive(href) ? ' tt-nav-link--active' : ''}">${item.label}</a>`;
    }).join('');
  }

  // ─── BUILD SERVER SWITCHER ─────────────────────────────────────────────────
  function buildServerSwitcher() {
    if (!activeServer) return '';
    const serverItems = SERVERS_REF.map(s => {
      const isCurrent  = s.slug === activeServer;
      const isActive   = s.active;
      const newPath    = window.location.pathname.replace(
        new RegExp(`^/s/${activeServer}/`), `/s/${s.slug}/`
      );
      const href = isActive ? newPath : '/s/';
      const label = s.isNew ? `${s.label} <span style="font-size:0.55rem;font-weight:700;background:rgba(217,119,6,0.12);color:#d97706;padding:1px 5px;border-radius:4px;vertical-align:middle">NEW</span>` : s.label;
      return `
      <a href="${href}" class="tt-sw-item${isCurrent ? ' tt-sw-item--current' : ''}">
        <span class="tt-sw-item-label">${label}</span>
        <span class="tt-sw-item-meta">${s.speed}× · ${s.region}${!isActive ? ' · <span style="color:#d97706">Soon</span>' : ''}</span>
        ${isCurrent ? '<span class="tt-sw-check">✓</span>' : ''}
      </a>`;
    }).join('');
    return `
    <div class="tt-nav-item tt-nav-item--has-dd tt-nav-item--switcher">
      <button class="tt-nav-link tt-nav-link--dd tt-nav-link--server" aria-expanded="false" aria-haspopup="true">
        <span class="tt-sw-dot"></span>
        ${activeServerLabel}
        <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="tt-nav-dropdown tt-sw-dropdown">
        <div class="tt-sw-header">Switch Server</div>
        ${serverItems}
        <a href="/s/" class="tt-sw-footer">
          <span>View all servers</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>`;
  }

  // ─── BUILD MY STUFF DROPDOWN ───────────────────────────────────────────────
  function buildMyStuffDropdown() {
    return `
    <div class="tt-nav-item tt-nav-item--has-dd">
      <button class="tt-nav-link tt-nav-link--dd tt-nav-link--mystuff" aria-expanded="false" aria-haspopup="true">
        My Stuff
        <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      ${buildDropdown(NAVBAR_CONFIG.myStuffItems)}
    </div>`;
  }

  // ─── BUILD ALLIANCE DROPDOWN ───────────────────────────────────────────────
  function buildAllianceDropdown() {
    return `
    <div class="tt-nav-item tt-nav-item--has-dd">
      <button class="tt-nav-link tt-nav-link--dd tt-nav-link--alliance" aria-expanded="false" aria-haspopup="true">
        Alliance
        <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      ${buildDropdown(NAVBAR_CONFIG.allianceItems)}
    </div>`;
  }

  // ─── UPDATE AUTH STATE ─────────────────────────────────────────────────────
  async function updateAuthState() {
    if (typeof window._supabase === 'undefined') return;

    const session    = await window.getSession();
    const actionsEl  = document.getElementById('tt-nav-actions');
    const mobileCtaEl= document.getElementById('tt-mobile-cta');
    const menuEl     = document.getElementById('tt-nav-menu');
    if (!actionsEl) return;

    const serverSwitcher = buildServerSwitcher();
    const sep = serverSwitcher ? '<div class="tt-nav-actions-sep"></div>' : '';

    // ── Belum login ──
    if (!session) {
      actionsEl.innerHTML = `
        ${serverSwitcher}${sep}
        <a href="https://discord.gg/kwkWZxgYXy" target="_blank" rel="noopener" class="tt-btn tt-btn-ghost" title="Join our Discord" style="padding:7px 10px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
        </a>
        <a href="/login/"    class="tt-btn tt-btn-ghost">Log In</a>
        <a href="/register/" class="tt-btn tt-btn-primary">Sign Up Free</a>
      `;
      if (mobileCtaEl) mobileCtaEl.innerHTML = `
        <a href="https://discord.gg/kwkWZxgYXy" target="_blank" rel="noopener" class="tt-btn tt-btn-ghost" style="width:100%;justify-content:center;gap:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
          Discord
        </a>
        <a href="/login/"    class="tt-btn tt-btn-ghost"   style="width:100%;justify-content:center;">Log In</a>
        <a href="/register/" class="tt-btn tt-btn-primary" style="width:100%;justify-content:center;">Sign Up Free</a>
      `;
      return;
    }

    // ── Sudah login ──
    const user     = session.user;
    const isPro    = user.user_metadata?.role === 'pro';
    const username = user.user_metadata?.username || user.email.split('@')[0];
    const initial  = username.charAt(0).toUpperCase();
    const proStar  = isPro ? '<span class="tt-avatar-star">⭐</span>' : '';

    // Inject My Stuff + Alliance ke desktop menu
    if (menuEl && !menuEl.querySelector('#tt-my-stuff')) {
      const myStuff  = document.createElement('div');
      myStuff.id     = 'tt-my-stuff';
      myStuff.innerHTML = buildMyStuffDropdown();
      menuEl.appendChild(myStuff.firstElementChild);

      const alliance = document.createElement('div');
      alliance.id    = 'tt-alliance';
      alliance.innerHTML = buildAllianceDropdown();
      menuEl.appendChild(alliance.firstElementChild);
    }

    // Avatar dropdown
    const avatarDropdown = `
    <div class="tt-nav-item tt-nav-item--has-dd tt-nav-item--avatar">
      <button class="tt-nav-link tt-nav-link--dd tt-nav-link--avatar" aria-expanded="false" aria-haspopup="true">
        ${proStar}
        <span class="tt-avatar">${initial}</span>
        <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="tt-nav-dropdown tt-avatar-dropdown">
        <div class="tt-avatar-header">
          <div class="tt-avatar tt-avatar--lg">${initial}</div>
          <div>
            <div class="tt-avatar-name">${username}</div>
            <div class="tt-avatar-email">${user.email}</div>
            ${isPro ? '<div class="tt-avatar-pro-badge">⭐ Pro</div>' : ''}
          </div>
        </div>
        <div class="tt-avatar-divider"></div>
        <a href="/account/settings/" class="tt-nav-dd-item">
          <span class="tt-nav-dd-icon">⚙️</span>
          <span class="tt-nav-dd-text"><span class="tt-nav-dd-title">Settings</span></span>
        </a>
        <button onclick="window.signOut()" class="tt-nav-dd-item tt-nav-dd-item--logout">
          <span class="tt-nav-dd-icon">🚪</span>
          <span class="tt-nav-dd-text"><span class="tt-nav-dd-title">Log Out</span></span>
        </button>
      </div>
    </div>`;

    actionsEl.innerHTML = `${serverSwitcher}${sep}
      <a href="https://discord.gg/kwkWZxgYXy" target="_blank" rel="noopener" class="tt-btn tt-btn-ghost" title="Join our Discord" style="padding:7px 10px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .<PASSWORD> .< PASSWORD >"/></svg>
      </a>
      ${!isPro ? `<a href="/pricing/" class="tt-btn tt-btn-ghost" style="color:#d97706;border-color:rgba(217,119,6,0.3);font-size:0.8rem;padding:6px 12px;">Upgrade</a>` : ''}
      ${avatarDropdown}`;

    // Mobile: tambah Discord + Upgrade + My Stuff + Alliance + logout
    if (mobileCtaEl) {
      mobileCtaEl.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:4px;">
          <a href="https://discord.gg/kwkWZxgYXy" target="_blank" rel="noopener" class="tt-btn tt-btn-ghost" style="flex:1;justify-content:center;gap:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.032.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Discord
          </a>
          ${!isPro ? `<a href="/pricing/" class="tt-btn tt-btn-ghost" style="flex:1;justify-content:center;color:#d97706;border-color:rgba(217,119,6,0.3);">Upgrade</a>` : ''}
        </div>
        <div class="tt-mob-group">
          <div class="tt-mob-label">My Stuff</div>
          ${NAVBAR_CONFIG.myStuffItems.map(i => `
          <a href="${i.href}" class="tt-mob-sub">
            <span>${i.icon} ${i.title}</span>
            <span class="tt-nav-badge" style="${getBadgeStyle(i.badge)}">${i.badge}</span>
          </a>`).join('')}
        </div>
        <div class="tt-mob-group">
          <div class="tt-mob-label">Alliance</div>
          ${NAVBAR_CONFIG.allianceItems.map(i => `
          <a href="${i.href}" class="tt-mob-sub">
            <span>${i.icon} ${i.title}</span>
            <span class="tt-nav-badge" style="${getBadgeStyle(i.badge)}">${i.badge}</span>
          </a>`).join('')}
        </div>
        <div style="padding-top:8px;border-top:1px solid #e2e8f3;margin-top:4px;">
          <button onclick="window.signOut()" class="tt-btn tt-btn-ghost" style="width:100%;justify-content:center;color:#dc2626;border-color:rgba(220,38,38,0.2);">🚪 Log Out</button>
        </div>
      `;
    }
  }

  // ─── BUILD FULL NAVBAR HTML ────────────────────────────────────────────────
  function buildNavbarHTML() {
    return `
    <nav class="tt-navbar" role="navigation" aria-label="Main navigation">
      <div class="tt-navbar-inner">
        <a href="${NAVBAR_CONFIG.logo.href}" class="tt-nav-logo">
          <span class="tt-nav-logo-icon">${NAVBAR_CONFIG.logo.icon}</span>
          <span class="tt-nav-logo-name">${NAVBAR_CONFIG.logo.name}</span>
        </a>
        <div class="tt-nav-menu" id="tt-nav-menu">${buildMenuItems()}</div>
        <div class="tt-nav-actions" id="tt-nav-actions">
          <a href="/login/"    class="tt-btn tt-btn-ghost">Log In</a>
          <a href="/register/" class="tt-btn tt-btn-primary">Sign Up Free</a>
        </div>
        <button class="tt-nav-hamburger" id="tt-hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="tt-nav-mobile" id="tt-mobile-menu" aria-hidden="true">
        <div class="tt-nav-mobile-inner">
          ${buildMobileMenu()}
          <div class="tt-nav-mobile-cta" id="tt-mobile-cta">
            <a href="/login/"    class="tt-btn tt-btn-ghost"   style="width:100%;justify-content:center;">Log In</a>
            <a href="/register/" class="tt-btn tt-btn-primary" style="width:100%;justify-content:center;">Sign Up Free</a>
          </div>
        </div>
      </div>
    </nav>`;
  }

  // ─── BUILD MOBILE MENU (static items only) ─────────────────────────────────
  function buildMobileMenu() {
    let html = '';
    if (activeServer) {
      const switchItems = SERVERS_REF.filter(s => s.active).map(s => {
        const isCurrent = s.slug === activeServer;
        const newPath   = window.location.pathname.replace(
          new RegExp(`^/s/${activeServer}/`), `/s/${s.slug}/`
        );
        return `
        <a href="${newPath}" class="tt-mob-sub${isCurrent ? ' tt-mob-sub--active' : ''}">
          <span>🌐 ${s.label}</span>
          ${isCurrent ? '<span style="font-size:0.7rem;color:var(--green,#059669)">Current</span>' : ''}
        </a>`;
      }).join('');
      html += `
      <div class="tt-mob-group tt-mob-server-group">
        <div class="tt-mob-label" style="color:#2563eb">🌐 Server: ${activeServerLabel}</div>
        ${switchItems}
        <a href="/s/" class="tt-mob-sub" style="color:#7a93bc">All servers →</a>
      </div>`;
    }
    html += NAVBAR_CONFIG.menuItems.map(item => {
      if (item.dropdown) {
        return `
        <div class="tt-mob-group">
          <div class="tt-mob-label">${item.label}</div>
          ${item.dropdown.map(d => `
          <a href="${resolveHref(d)}" class="tt-mob-sub${isItemActive(d) ? ' tt-mob-sub--active' : ''}">
            <span>${d.icon} ${d.title}</span>
            <span class="tt-nav-badge" style="${getBadgeStyle(d.badge)}">${d.badge}</span>
          </a>`).join('')}
        </div>`;
      }
      const href = item.href || '#';
      return `<a href="${href}" class="tt-mob-link${isActive(href) ? ' tt-mob-link--active' : ''}">${item.label}</a>`;
    }).join('');
    return html;
  }

  // ─── INJECT CSS ────────────────────────────────────────────────────────────
  function injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
      .tt-navbar {
        position:sticky; top:0; z-index:1000; height:64px;
        background:rgba(255,255,255,0.92); backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px); border-bottom:1px solid #e2e8f3;
        box-shadow:0 1px 0 rgba(37,99,235,0.06); font-family:'DM Sans',sans-serif;
      }
      .tt-navbar-inner { height:64px; padding:0 40px; display:flex; align-items:center; gap:8px; }
      .tt-nav-logo { display:flex; align-items:center; gap:8px; text-decoration:none; margin-right:24px; flex-shrink:0; }
      .tt-nav-logo-icon { font-size:20px; }
      .tt-nav-logo-name { font-family:'Space Grotesk',sans-serif; font-weight:700; font-size:1rem; color:#0f2153; letter-spacing:-0.02em; }
      .tt-nav-menu { display:flex; align-items:center; gap:2px; flex:1; }
      .tt-nav-item { position:relative; }
      .tt-nav-link {
        display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px;
        font-size:0.875rem; font-weight:500; color:#3d5a8a; text-decoration:none; border:none;
        background:none; cursor:pointer; transition:color 0.18s,background 0.18s; white-space:nowrap;
        font-family:'DM Sans',sans-serif;
      }
      .tt-nav-link:hover { color:#0f2153; background:#f1f5fd; }
      .tt-nav-link--active { color:#2563eb; font-weight:600; }
      .tt-nav-link--server { color:#2563eb; background:rgba(37,99,235,0.06); border:1px solid rgba(37,99,235,0.2); font-weight:600; gap:6px; }
      .tt-nav-link--server:hover { background:rgba(37,99,235,0.1); }
      .tt-nav-link--avatar { gap:6px; padding:4px 8px; }
      .tt-sw-dot { width:7px; height:7px; border-radius:50%; background:#059669; flex-shrink:0; animation:tt-pulse 2s infinite; }
      @keyframes tt-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .tt-nav-chevron { transition:transform 0.2s; opacity:0.6; flex-shrink:0; }
      .tt-nav-item--has-dd:hover .tt-nav-chevron { transform:rotate(180deg); opacity:1; }
      .tt-nav-item--active > .tt-nav-link--dd { color:#2563eb; font-weight:600; }

      .tt-nav-dropdown {
        position:absolute; top:100%; left:50%; transform:translateX(-50%) translateY(-6px);
        background:#ffffff; border:1px solid #e2e8f3; border-radius:14px; padding:18px 8px 8px;
        box-shadow:0 20px 60px rgba(15,33,83,0.12); min-width:260px;
        opacity:0; pointer-events:none; transition:opacity 0.18s,transform 0.18s; z-index:100;
      }
      .tt-nav-item--has-dd::after { content:''; position:absolute; top:100%; left:0; right:0; height:18px; }
      .tt-nav-item--has-dd:hover .tt-nav-dropdown { opacity:1; pointer-events:auto; transform:translateX(-50%) translateY(0); }

      /* Server switcher & avatar — align right */
      .tt-nav-item--switcher { position:relative; }
      .tt-sw-dropdown { left:auto; right:0; transform:translateY(-6px); min-width:240px; padding:8px; }
      .tt-nav-item--switcher:hover .tt-sw-dropdown { transform:translateY(0); opacity:1; pointer-events:auto; }
      .tt-nav-item--avatar { position:relative; }
      .tt-avatar-dropdown { left:auto; right:0; transform:translateY(-6px); min-width:220px; padding:8px; }
      .tt-nav-item--avatar:hover .tt-avatar-dropdown { transform:translateY(0); opacity:1; pointer-events:auto; }

      .tt-sw-header { font-size:0.62rem; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#7a93bc; padding:6px 10px 8px; }
      .tt-sw-item { display:flex; align-items:center; justify-content:space-between; padding:9px 10px; border-radius:10px; text-decoration:none; transition:background 0.15s; gap:8px; }
      .tt-sw-item:hover { background:#f1f5fd; }
      .tt-sw-item--current { background:rgba(37,99,235,0.05); }
      .tt-sw-item-label { font-size:0.825rem; font-weight:600; color:#0f2153; flex:1; }
      .tt-sw-item-meta { font-size:0.68rem; color:#7a93bc; }
      .tt-sw-check { font-size:0.75rem; color:#059669; font-weight:700; }
      .tt-sw-footer { display:flex; align-items:center; justify-content:space-between; padding:8px 10px; margin-top:4px; border-top:1px solid #e2e8f3; font-size:0.75rem; color:#7a93bc; text-decoration:none; transition:color 0.15s,background 0.15s; }
      .tt-sw-footer:hover { color:#2563eb; background:#f1f5fd; }

      .tt-nav-dd-item { display:flex; align-items:center; gap:10px; padding:8px 10px; border-radius:10px; text-decoration:none; transition:background 0.15s; border:none; background:none; cursor:pointer; width:100%; font-family:'DM Sans',sans-serif; }
      .tt-nav-dd-item:hover { background:#f1f5fd; }
      .tt-nav-dd-item--active { background:rgba(37,99,235,0.06); }
      .tt-nav-dd-item--logout:hover { background:rgba(220,38,38,0.06); }
      .tt-nav-dd-item--logout .tt-nav-dd-title { color:#dc2626; }
      .tt-nav-dd-icon { width:32px; height:32px; display:flex; align-items:center; justify-content:center; background:#f8faff; border-radius:8px; font-size:16px; flex-shrink:0; }
      .tt-nav-dd-text { display:flex; flex-direction:column; gap:1px; flex:1; text-align:left; }
      .tt-nav-dd-title { font-size:0.8125rem; font-weight:600; color:#0f2153; line-height:1.3; }
      .tt-nav-dd-desc  { font-size:0.725rem; color:#7a93bc; line-height:1.3; }
      .tt-nav-dd-server-tag { display:inline-block; font-size:0.58rem; font-weight:700; color:#2563eb; background:rgba(37,99,235,0.08); border:1px solid rgba(37,99,235,0.15); padding:1px 5px; border-radius:4px; margin-left:4px; vertical-align:middle; }
      .tt-nav-badge { font-size:0.6rem; font-weight:700; border-radius:100px; padding:2px 6px; white-space:nowrap; flex-shrink:0; letter-spacing:0.03em; }

      /* Avatar */
      .tt-avatar { width:30px; height:30px; border-radius:8px; background:linear-gradient(135deg,#2563eb,#0891b2); color:#fff; font-size:0.825rem; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-family:'Space Grotesk',sans-serif; }
      .tt-avatar--lg { width:38px; height:38px; font-size:1rem; border-radius:10px; }
      .tt-avatar-star { font-size:0.75rem; }
      .tt-avatar-header { display:flex; align-items:center; gap:10px; padding:8px 10px 10px; }
      .tt-avatar-name  { font-size:0.825rem; font-weight:700; color:#0f2153; }
      .tt-avatar-email { font-size:0.7rem; color:#7a93bc; margin-top:1px; }
      .tt-avatar-pro-badge { display:inline-block; margin-top:4px; font-size:0.65rem; font-weight:700; background:rgba(217,119,6,0.08); color:#d97706; border:1px solid rgba(217,119,6,0.2); border-radius:100px; padding:1px 8px; }
      .tt-avatar-divider { height:1px; background:#e2e8f3; margin:4px 0; }

      .tt-nav-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; margin-left:auto; }
      .tt-nav-actions-sep { width:1px; height:20px; background:#e2e8f3; flex-shrink:0; }

      .tt-btn { display:inline-flex; align-items:center; justify-content:center; padding:7px 16px; border-radius:8px; font-size:0.875rem; font-weight:600; font-family:'DM Sans',sans-serif; text-decoration:none; cursor:pointer; transition:all 0.18s; white-space:nowrap; border:none; }
      .tt-btn-primary { background:#2563eb; color:#fff; box-shadow:0 2px 8px rgba(37,99,235,0.25); }
      .tt-btn-primary:hover { background:#1d4ed8; box-shadow:0 4px 14px rgba(37,99,235,0.35); transform:translateY(-1px); }
      .tt-btn-ghost { background:transparent; color:#3d5a8a; border:1px solid #e2e8f3; }
      .tt-btn-ghost:hover { background:#f1f5fd; color:#0f2153; border-color:rgba(37,99,235,0.25); }

      .tt-nav-hamburger { display:none; flex-direction:column; gap:5px; background:none; border:none; cursor:pointer; padding:8px; margin-left:auto; border-radius:8px; transition:background 0.15s; }
      .tt-nav-hamburger:hover { background:#f1f5fd; }
      .tt-nav-hamburger span { display:block; width:22px; height:2px; background:#0f2153; border-radius:2px; transition:all 0.22s; transform-origin:center; }
      .tt-nav-hamburger.tt-open span:nth-child(1) { transform:translateY(7px) rotate(45deg); }
      .tt-nav-hamburger.tt-open span:nth-child(2) { opacity:0; transform:scaleX(0); }
      .tt-nav-hamburger.tt-open span:nth-child(3) { transform:translateY(-7px) rotate(-45deg); }

      .tt-nav-mobile { background:#fff; border-bottom:1px solid #e2e8f3; overflow:hidden; max-height:0; transition:max-height 0.32s cubic-bezier(0.4,0,0.2,1); box-shadow:0 8px 24px rgba(15,33,83,0.08); }
      .tt-nav-mobile.tt-open { max-height:80vh; overflow-y:auto; }
      .tt-nav-mobile-inner { max-width:1060px; margin:0 auto; padding:12px 24px 20px; display:flex; flex-direction:column; gap:4px; }
      .tt-mob-group { margin-bottom:8px; }
      .tt-mob-server-group { background:rgba(37,99,235,0.03); border:1px solid rgba(37,99,235,0.12); border-radius:10px; padding:8px; margin-bottom:12px; }
      .tt-mob-label { font-size:0.7rem; font-weight:700; color:#7a93bc; text-transform:uppercase; letter-spacing:0.08em; padding:8px 10px 4px; }
      .tt-mob-sub, .tt-mob-link { display:flex; align-items:center; justify-content:space-between; padding:9px 10px; border-radius:8px; text-decoration:none; font-size:0.875rem; color:#3d5a8a; font-weight:500; transition:background 0.15s,color 0.15s; }
      .tt-mob-sub:hover, .tt-mob-link:hover { background:#f1f5fd; color:#0f2153; }
      .tt-mob-sub--active, .tt-mob-link--active { color:#2563eb; font-weight:600; }
      .tt-nav-mobile-cta { display:flex; flex-direction:column; gap:8px; margin-top:12px; padding-top:12px; border-top:1px solid #e2e8f3; }

      /* ── Login-only menu colors (bottom indicator) ── */
      .tt-nav-link--mystuff {
        color:#2563eb; font-weight:600;
        box-shadow:inset 0 -3px 0 #2563eb;
        border-radius:8px 8px 0 0;
      }
      .tt-nav-link--mystuff:hover { background:#f1f5fd; color:#1d4ed8; box-shadow:inset 0 -3px 0 #1d4ed8; }
      .tt-nav-link--alliance {
        color:#059669; font-weight:600;
        box-shadow:inset 0 -3px 0 #059669;
        border-radius:8px 8px 0 0;
      }
      .tt-nav-link--alliance:hover { background:rgba(5,150,105,0.06); color:#047857; box-shadow:inset 0 -3px 0 #047857; }

      @media (max-width:768px) {
        .tt-navbar-inner { padding:0 20px; }
        .tt-nav-menu, .tt-nav-actions { display:none; }
        .tt-nav-hamburger { display:flex; }
      }
      @media (max-width:480px) { .tt-nav-logo-name { font-size:0.9rem; } }
    `;
    document.head.appendChild(style);
  }

  // ─── INJECT & BIND ─────────────────────────────────────────────────────────
  function injectNavbar() {
    const root = document.getElementById('navbar-root');
    if (!root) { console.warn('[TravianTools] navbar-root not found'); return; }
    root.innerHTML = buildNavbarHTML();
  }

  function bindEvents() {
    const hamburger  = document.getElementById('tt-hamburger');
    const mobileMenu = document.getElementById('tt-mobile-menu');
    if (!hamburger || !mobileMenu) return;
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('tt-open');
      mobileMenu.classList.toggle('tt-open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      mobileMenu.setAttribute('aria-hidden', !isOpen);
    });
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target) && hamburger.classList.contains('tt-open')) {
        hamburger.classList.remove('tt-open');
        mobileMenu.classList.remove('tt-open');
        hamburger.setAttribute('aria-expanded', false);
        mobileMenu.setAttribute('aria-hidden', true);
      }
    });
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    injectNavbar();
    bindEvents();
    if (typeof window._supabase !== 'undefined') {
      updateAuthState();
    } else {
      window.addEventListener('load', () => updateAuthState());
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();