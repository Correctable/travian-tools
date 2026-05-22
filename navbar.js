/**
 * TravianTools — Shared Navbar Component
 * 
 * CARA PAKAI:
 * 1. Taruh <div id="navbar-root"></div> di awal <body>
 * 2. <script src="navbar.js"></script> sebelum </body>
 * 3. Selesai! Navbar otomatis muncul di semua halaman.
 *
 * KONFIGURASI:
 * - Edit NAVBAR_CONFIG.menuItems untuk tambah/hapus menu
 * - Edit NAVBAR_CONFIG.currentPage untuk highlight halaman aktif
 *   (otomatis terdeteksi dari window.location.pathname)
 */

(function () {
  // ─── KONFIGURASI NAVBAR ────────────────────────────────────────────────────
  const NAVBAR_CONFIG = {
    logo: {
      icon: "⚔️",
      name: "TravianTools",
      href: "/",
    },

    // Menu utama — edit di sini untuk tambah/hapus/ubah item
    menuItems: [
      {
        label: "Tools",
        dropdown: [
          {
            icon: "🏰",
            title: "Building Cost",
            desc: "Detail about construction",
            badge: "FREE",
            href: "/tools/building-costs",
          },          
          {
            icon: "🌿",
            title: "Oasis Finder",
            desc: "Find oases near your coords",
            badge: "FREE",
            href: "/tools/oasis-finder/",
          },
          {
            icon: "🕵️",
            title: "Spy Productivity",
            desc: "Estimate resource production",
            badge: "FREE",
            href: "/tools/spy-on-productivity/",
          },
          {
            icon: "⚔️",
            title: "Attack Planner",
            desc: "Plan multi-wave attacks",
            badge: "FREE",
            href: "/tools/attack-planner/",
          },
          {
            icon: "🏘️",
            title: "Village Tree",
            desc: "Plan your building queue",
            badge: "FREE",
            href: "/tools/village-tree/",
          },
          {
            icon: "📊",
            title: "Troop Simulator",
            desc: "Simulate battles",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "🗺️",
            title: "Map Scanner",
            desc: "Scan & track map changes",
            badge: "SOON",
            href: "#",
          },
        ],
      },
      {
        label: "Statistics",
        dropdown: [
          {
            icon: "🔭",
            title: "Player Tracker",
            desc: "Track player activity & growth",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "🏰",
            title: "Village Analyzer",
            desc: "Deep dive on enemy villages",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "📈",
            title: "Alliance Stats",
            desc: "Compare alliance performance",
            badge: "SOON",
            href: "#",
          },
        ],
      },
      {
        label: "Simulators",
        dropdown: [
          {
            icon: "🌾",
            title: "Field Production",
            desc: "Simulate resource output per hour",
            badge: "FREE",
            href: "/simulators/field-production/",
          },
          {
            icon: "🏘️",
            title: "Village Planner",
            desc: "Plan buildings & upgrade path",
            badge: "FREE",
            href: "/simulators/village-planner/",
          },
          {
            icon: "⚔️",
            title: "Battle Simulator",
            desc: "Simulate attack vs defense",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "⏱️",
            title: "Troop Training",
            desc: "Time & cost to build an army",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "🌿",
            title: "Crop Balance",
            desc: "Net crop after troop consumption",
            badge: "SOON",
            href: "#",
          },
        ],
      },
      {
        label: "Guides",
        dropdown: [
          {
            icon: "📖",
            title: "Beginner Guide",
            desc: "Start your Travian journey",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "🛡️",
            title: "Defense Guide",
            desc: "Build an impenetrable defense",
            badge: "SOON",
            href: "#",
          },
          {
            icon: "⚔️",
            title: "Raiding Strategy",
            desc: "Maximize your raid income",
            badge: "SOON",
            href: "#",
          },
        ],
      },
      {
        label: "Changelog",
        href: "/changelog.html",
      },
    ],

    cta: {
      login: { label: "Log In", href: "/login" },
      signup: { label: "Sign Up Free", href: "/register" },
    },
  };

  // ─── BADGE STYLES ──────────────────────────────────────────────────────────
  const BADGE_STYLES = {
    FREE: "background:rgba(5,150,105,0.10);color:#059669;",
    "FREE PREVIEW": "background:rgba(5,150,105,0.10);color:#059669;",
    SOON: "background:rgba(120,140,170,0.10);color:#7a93bc;",
    NEW: "background:rgba(217,119,6,0.08);color:#d97706;",
    PRO: "background:rgba(59,130,246,0.10);color:#3b82f6;",
  };

  function getBadgeStyle(badge) {
    return BADGE_STYLES[badge] || BADGE_STYLES["SOON"];
  }

  // ─── DETECT ACTIVE PAGE ────────────────────────────────────────────────────
  function isActive(href) {
    if (!href || href === "#") return false;
    const path = window.location.pathname;
    // Normalize: /index.html and / are both "home"
    const normalize = (h) =>
      h.replace(/\/index\.html$/, "/").replace(/\/$/, "") || "/";
    return normalize(path) === normalize(href);
  }

  function isMenuActive(item) {
    if (item.href) return isActive(item.href);
    if (item.dropdown) return item.dropdown.some((d) => isActive(d.href));
    return false;
  }

  // ─── BUILD DROPDOWN HTML ───────────────────────────────────────────────────
  function buildDropdown(items) {
    const rows = items
      .map(
        (item) => `
      <a href="${item.href}" class="tt-nav-dd-item${isActive(item.href) ? " tt-nav-dd-item--active" : ""}">
        <span class="tt-nav-dd-icon">${item.icon}</span>
        <span class="tt-nav-dd-text">
          <span class="tt-nav-dd-title">${item.title}</span>
          <span class="tt-nav-dd-desc">${item.desc}</span>
        </span>
        <span class="tt-nav-badge" style="${getBadgeStyle(item.badge)}">${item.badge}</span>
      </a>`
      )
      .join("");

    return `<div class="tt-nav-dropdown">${rows}</div>`;
  }

  // ─── BUILD MENU ITEMS HTML ─────────────────────────────────────────────────
  function buildMenuItems() {
    return NAVBAR_CONFIG.menuItems
      .map((item) => {
        const active = isMenuActive(item);
        if (item.dropdown) {
          return `
          <div class="tt-nav-item tt-nav-item--has-dd${active ? " tt-nav-item--active" : ""}">
            <button class="tt-nav-link tt-nav-link--dd" aria-expanded="false" aria-haspopup="true">
              ${item.label}
              <svg class="tt-nav-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            ${buildDropdown(item.dropdown)}
          </div>`;
        } else {
          return `
          <a href="${item.href}" class="tt-nav-link${active ? " tt-nav-link--active" : ""}">
            ${item.label}
          </a>`;
        }
      })
      .join("");
  }

  // ─── BUILD FULL NAVBAR HTML ────────────────────────────────────────────────
  function buildNavbarHTML() {
    return `
    <nav class="tt-navbar" role="navigation" aria-label="Main navigation">
      <div class="tt-navbar-inner">

        <!-- Logo -->
        <a href="${NAVBAR_CONFIG.logo.href}" class="tt-nav-logo">
          <span class="tt-nav-logo-icon">${NAVBAR_CONFIG.logo.icon}</span>
          <span class="tt-nav-logo-name">${NAVBAR_CONFIG.logo.name}</span>
        </a>

        <!-- Desktop Menu -->
        <div class="tt-nav-menu" id="tt-nav-menu">
          ${buildMenuItems()}
        </div>

        <!-- CTA Buttons -->
        <div class="tt-nav-actions">
          <a href="${NAVBAR_CONFIG.cta.login.href}" class="tt-btn tt-btn-ghost">${NAVBAR_CONFIG.cta.login.label}</a>
          <a href="${NAVBAR_CONFIG.cta.signup.href}" class="tt-btn tt-btn-primary">${NAVBAR_CONFIG.cta.signup.label}</a>
        </div>

        <!-- Mobile Hamburger -->
        <button class="tt-nav-hamburger" id="tt-hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>

      </div>

      <!-- Mobile Menu Panel -->
      <div class="tt-nav-mobile" id="tt-mobile-menu" aria-hidden="true">
        <div class="tt-nav-mobile-inner">
          ${buildMobileMenu()}
          <div class="tt-nav-mobile-cta">
            <a href="${NAVBAR_CONFIG.cta.login.href}" class="tt-btn tt-btn-ghost" style="width:100%;justify-content:center;">${NAVBAR_CONFIG.cta.login.label}</a>
            <a href="${NAVBAR_CONFIG.cta.signup.href}" class="tt-btn tt-btn-primary" style="width:100%;justify-content:center;">${NAVBAR_CONFIG.cta.signup.label}</a>
          </div>
        </div>
      </div>
    </nav>`;
  }

  // ─── BUILD MOBILE MENU ─────────────────────────────────────────────────────
  function buildMobileMenu() {
    return NAVBAR_CONFIG.menuItems
      .map((item) => {
        if (item.dropdown) {
          const subItems = item.dropdown
            .map(
              (d) => `
            <a href="${d.href}" class="tt-mob-sub${isActive(d.href) ? " tt-mob-sub--active" : ""}">
              <span>${d.icon} ${d.title}</span>
              <span class="tt-nav-badge" style="${getBadgeStyle(d.badge)}">${d.badge}</span>
            </a>`
            )
            .join("");

          return `
          <div class="tt-mob-group">
            <div class="tt-mob-label">${item.label}</div>
            ${subItems}
          </div>`;
        } else {
          return `<a href="${item.href}" class="tt-mob-link${isActive(item.href) ? " tt-mob-link--active" : ""}">${item.label}</a>`;
        }
      })
      .join("");
  }

  // ─── INJECT CSS ────────────────────────────────────────────────────────────
  function injectCSS() {
    const style = document.createElement("style");
    style.textContent = `
      /* ── TravianTools Navbar ── */
      .tt-navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        height: 64px;
        background: rgba(255,255,255,0.92);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-bottom: 1px solid #e2e8f3;
        box-shadow: 0 1px 0 rgba(37,99,235,0.06);
        font-family: 'DM Sans', sans-serif;
      }

      .tt-navbar-inner {
        height: 64px;
        padding: 0 40px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      /* Logo */
      .tt-nav-logo {
        display: flex;
        align-items: center;
        gap: 8px;
        text-decoration: none;
        margin-right: 24px;
        flex-shrink: 0;
      }
      .tt-nav-logo-icon { font-size: 20px; }
      .tt-nav-logo-name {
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
        font-size: 1rem;
        color: #0f2153;
        letter-spacing: -0.02em;
      }

      /* Desktop Menu */
      .tt-nav-menu {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: 1;
      }

      .tt-nav-item {
        position: relative;
      }

      .tt-nav-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 500;
        color: #3d5a8a;
        text-decoration: none;
        border: none;
        background: none;
        cursor: pointer;
        transition: color 0.18s, background 0.18s;
        white-space: nowrap;
        font-family: 'DM Sans', sans-serif;
      }
      .tt-nav-link:hover,
      .tt-nav-link--dd:hover {
        color: #0f2153;
        background: #f1f5fd;
      }
      .tt-nav-link--active {
        color: #2563eb;
        font-weight: 600;
      }
      .tt-nav-link--dd { line-height: 1; }

      .tt-nav-chevron {
        transition: transform 0.2s;
        opacity: 0.6;
        flex-shrink: 0;
      }
      .tt-nav-item--has-dd:hover .tt-nav-chevron,
      .tt-nav-item--has-dd.tt-open .tt-nav-chevron {
        transform: rotate(180deg);
        opacity: 1;
      }

      .tt-nav-item--active > .tt-nav-link--dd {
        color: #2563eb;
        font-weight: 600;
      }

      /* Dropdown */
      .tt-nav-dropdown {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-6px);
        background: #ffffff;
        border: 1px solid #e2e8f3;
        border-radius: 14px;
        padding: 18px 8px 8px; /* padding-top menutupi gap semu */
        margin-top: 0;
        box-shadow: 0 20px 60px rgba(15,33,83,0.12);
        min-width: 260px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.18s, transform 0.18s;
        z-index: 100;
      }

      /* Jembatan hover: area transparan antara button dan dropdown */
      .tt-nav-item--has-dd::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        height: 18px;
      }

      .tt-nav-item--has-dd:hover .tt-nav-dropdown {
        opacity: 1;
        pointer-events: auto;
        transform: translateX(-50%) translateY(0);
      }

      .tt-nav-dd-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border-radius: 10px;
        text-decoration: none;
        transition: background 0.15s;
      }
      .tt-nav-dd-item:hover { background: #f1f5fd; }
      .tt-nav-dd-item--active { background: rgba(37,99,235,0.06); }

      .tt-nav-dd-icon {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8faff;
        border-radius: 8px;
        font-size: 16px;
        flex-shrink: 0;
      }

      .tt-nav-dd-text {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
      }
      .tt-nav-dd-title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: #0f2153;
        line-height: 1.3;
      }
      .tt-nav-dd-desc {
        font-size: 0.725rem;
        color: #7a93bc;
        line-height: 1.3;
      }

      /* Badge */
      .tt-nav-badge {
        font-size: 0.6rem;
        font-weight: 700;
        border-radius: 100px;
        padding: 2px 6px;
        white-space: nowrap;
        flex-shrink: 0;
        letter-spacing: 0.03em;
      }

      /* CTA Buttons */
      .tt-nav-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
        margin-left: auto;
      }

      .tt-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 16px;
        border-radius: 8px;
        font-size: 0.875rem;
        font-weight: 600;
        font-family: 'DM Sans', sans-serif;
        text-decoration: none;
        cursor: pointer;
        transition: all 0.18s;
        white-space: nowrap;
        border: none;
      }
      .tt-btn-primary {
        background: #2563eb;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(37,99,235,0.25);
      }
      .tt-btn-primary:hover {
        background: #1d4ed8;
        box-shadow: 0 4px 14px rgba(37,99,235,0.35);
        transform: translateY(-1px);
      }
      .tt-btn-ghost {
        background: transparent;
        color: #3d5a8a;
        border: 1px solid #e2e8f3;
      }
      .tt-btn-ghost:hover {
        background: #f1f5fd;
        color: #0f2153;
        border-color: rgba(37,99,235,0.25);
      }

      /* Hamburger */
      .tt-nav-hamburger {
        display: none;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        margin-left: auto;
        border-radius: 8px;
        transition: background 0.15s;
      }
      .tt-nav-hamburger:hover { background: #f1f5fd; }
      .tt-nav-hamburger span {
        display: block;
        width: 22px;
        height: 2px;
        background: #0f2153;
        border-radius: 2px;
        transition: all 0.22s;
        transform-origin: center;
      }
      .tt-nav-hamburger.tt-open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .tt-nav-hamburger.tt-open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
      .tt-nav-hamburger.tt-open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      /* Mobile Menu */
      .tt-nav-mobile {
        background: #ffffff;
        border-bottom: 1px solid #e2e8f3;
        overflow: hidden;
        max-height: 0;
        transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1);
        box-shadow: 0 8px 24px rgba(15,33,83,0.08);
      }
      .tt-nav-mobile.tt-open { max-height: 80vh; overflow-y: auto; }

      .tt-nav-mobile-inner {
        max-width: 1060px;
        margin: 0 auto;
        padding: 12px 24px 20px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .tt-mob-group { margin-bottom: 8px; }
      .tt-mob-label {
        font-size: 0.7rem;
        font-weight: 700;
        color: #7a93bc;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 8px 10px 4px;
      }
      .tt-mob-sub, .tt-mob-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 9px 10px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 0.875rem;
        color: #3d5a8a;
        font-weight: 500;
        transition: background 0.15s, color 0.15s;
      }
      .tt-mob-sub:hover, .tt-mob-link:hover { background: #f1f5fd; color: #0f2153; }
      .tt-mob-sub--active, .tt-mob-link--active { color: #2563eb; font-weight: 600; }

      .tt-nav-mobile-cta {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #e2e8f3;
      }

      /* ── Responsive ── */
      @media (max-width: 768px) {
        .tt-navbar-inner { padding: 0 20px; }
        .tt-nav-menu, .tt-nav-actions { display: none; }
        .tt-nav-hamburger { display: flex; }
      }

      @media (max-width: 480px) {
        .tt-nav-logo-name { font-size: 0.9rem; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── INJECT NAVBAR INTO DOM ────────────────────────────────────────────────
  function injectNavbar() {
    const root = document.getElementById("navbar-root");
    if (!root) {
      console.warn("[TravianTools Navbar] <div id='navbar-root'> not found.");
      return;
    }
    root.innerHTML = buildNavbarHTML();
  }

  // ─── MOBILE TOGGLE LOGIC ───────────────────────────────────────────────────
  function bindEvents() {
    const hamburger = document.getElementById("tt-hamburger");
    const mobileMenu = document.getElementById("tt-mobile-menu");
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener("click", () => {
      const isOpen = hamburger.classList.toggle("tt-open");
      mobileMenu.classList.toggle("tt-open", isOpen);
      hamburger.setAttribute("aria-expanded", isOpen);
      mobileMenu.setAttribute("aria-hidden", !isOpen);
    });

    // Close mobile menu on outside click
    document.addEventListener("click", (e) => {
      if (
        !hamburger.contains(e.target) &&
        !mobileMenu.contains(e.target) &&
        hamburger.classList.contains("tt-open")
      ) {
        hamburger.classList.remove("tt-open");
        mobileMenu.classList.remove("tt-open");
        hamburger.setAttribute("aria-expanded", false);
        mobileMenu.setAttribute("aria-hidden", true);
      }
    });
  }

  // ─── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    injectNavbar();
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();