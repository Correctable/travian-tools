# Design Specification — travian.sonybukansoni.com

> Dokumen ini adalah referensi desain dan teknis untuk semua halaman di **travian.sonybukansoni.com**.
> Gunakan dokumen ini sebagai acuan utama sebelum membuat atau memodifikasi file apapun.

---

## 1. Identitas Produk

| | |
|---|---|
| **Nama produk** | TravianTools |
| **Domain** | travian.sonybukansoni.com |
| **Parent domain** | sonybukansoni.com |
| **Tagline** | Smart tools for smarter commanders |
| **Target pengguna** | Pemain game Travian: Legends |
| **Kompetitor referensi** | travcotools, gettertools, travian-tst, frisovandijk |
| **Bahasa konten** | Inggris (UI), Indonesia boleh di dokumentasi internal |

---

## 2. Tema & Palet Warna

### Filosofi
Tema **Navy-Putih** — bersih, profesional, modern. Terinspirasi dari gaya visual [pluang.com](https://pluang.com): layout rapi, tipografi kuat, tidak terasa "AI-generated".

### CSS Variables (wajib dipakai konsisten di semua halaman)

```css
:root {
  /* Brand */
  --navy:       #0f2153;
  --navy2:      #1a3068;
  --navy3:      #0b1a3d;
  --blue:       #1d4ed8;
  --blue2:      #2563eb;
  --blue-light: #3b82f6;
  --blue-glow:  rgba(59,130,246,0.10);
  --cyan:       #0891b2;

  /* Surface */
  --surface:    #ffffff;
  --surface2:   #f8faff;
  --border:     #e2e8f3;
  --border2:    rgba(37,99,235,0.25);

  /* Text */
  --text:       #0f2153;
  --text2:      #3d5a8a;
  --text3:      #7a93bc;

  /* Accent */
  --green:      #059669;
  --green-bg:   rgba(5,150,105,0.08);
  --amber:      #d97706;
  --amber-bg:   rgba(217,119,6,0.08);
  --red:        #dc2626;
  --red-bg:     rgba(220,38,38,0.08);
  --purple:     #7c3aed;
  --purple-bg:  rgba(124,58,237,0.08);
}
```

### Aturan warna
- **Background utama:** `#ffffff` (putih murni)
- **Background sekunder / strip:** `#f8faff` (putih kebiruan sangat tipis)
- **Aksen utama:** `#2563eb` (biru)
- **Teks utama:** `#0f2153` (navy gelap)
- **Tidak boleh:** background gelap/dark mode, gradient ungu, warna-warni acak

---

## 3. Tipografi

### Font Stack

| Peran | Font | Weight |
|---|---|---|
| Heading / display | **Space Grotesk** | 600, 700 |
| Body / UI | **DM Sans** | 400, 500, 600 |

```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Aturan tipografi
- Heading besar: `font-family: 'Space Grotesk'`, `letter-spacing: -0.02em` hingga `-0.03em`
- Body: `font-family: 'DM Sans'`, `line-height: 1.65`–`1.75`
- **Tidak boleh:** Inter, Roboto, Arial, system-ui sebagai font utama
- **Tidak boleh:** font serif/medieval (Cinzel, Lora, dll) — versi lama sudah diganti

---

## 4. Arsitektur URL & Routing

### Dua Tipe Tool

**Tipe 1 — Static Tools** (tidak butuh server/database)
```
/tools/{tool-name}/
/simulators/{tool-name}/
```

**Tipe 2 — Server-based Tools** (butuh pilih server, akses Turso)
```
/s/{server-slug}/{tool-name}/
/s/{server-slug}/{tool-name}/{sub-page}/
```

### Flow User — Server-based Tools

```
Klik menu server-based (Statistics, Map, Oasis Data) di navbar
              ↓
  Tidak ada server aktif di URL?
              ↓
    /s/   →  pilih server
              ↓
    /s/ts5.x1.asia/statistics/
    /s/ts5.x1.asia/map/
    /s/ts5.x1.asia/oasis-data/

  Sudah ada server aktif (/s/ts5.x1.asia/...)?
              ↓
    Navbar langsung generate link ke /s/ts5.x1.asia/{tool-baru}/
```

### Konvensi Penamaan Server

Slug server mengikuti subdomain server Travian sebelum `.travian.com`:
```
https://ts5.x1.asia.travian.com/  →  slug: ts5.x1.asia
https://ts1.x1.asia.travian.com/  →  slug: ts1.x1.asia
```

### Config Server (Single Source of Truth)

File `servers.js` di root repo — satu-satunya tempat tambah/edit server:

```js
const SERVERS = [
  {
    slug:    'ts5.x1.asia',
    label:   'TS5 Asia',
    domain:  'ts5.x1.asia.travian.com',
    speed:   5,
    region:  'Asia',
    active:  true,
    isNew:   false,
  },
  // Tambah server baru di sini saja — otomatis muncul di /s/ dan navbar switcher
];

const SERVER_BASED_TOOLS = ['statistics', 'oasis-data', 'map'];
```

**Menambah server baru = hanya tambah entry di `SERVERS` array. Tidak perlu edit file lain.**

---

## 5. Struktur File & Folder

```
/ (root)
├── index.html                          # Landing page
├── navbar.js                           # Shared navbar component (server-aware)
├── servers.js                          # Config server — SINGLE SOURCE OF TRUTH
├── shared.css                          # Global CSS shared
├── CNAME
│
├── s/                                  # Gateway semua server-based tools
│   ├── index.html                      # Halaman pilih server
│   └── ts5.x1.asia/                    # Folder per server (duplikat untuk server baru)
│       ├── statistics/
│       │   ├── index.html              # Leaderboard player & alliance
│       │   ├── player/index.html       # Profil player
│       │   └── alliance/index.html     # Profil alliance
│       ├── oasis-data/
│       │   └── index.html             # Data oasis per server
│       └── map/
│           └── index.html             # Peta interaktif
│
├── tools/                              # Static tools (tidak butuh server)
│   ├── attack-planner/index.html
│   ├── building-costs/index.html
│   ├── oasis-finder/index.html
│   ├── spy-on-productivity/index.html
│   └── village-tree/index.html
│
├── simulators/                         # Static simulators
│   ├── field-production/index.html
│   └── village-planner/index.html
│
├── login/index.html
├── register/index.html
│
├── data/                               # Static data (buildings.json, dll)
├── images/
└── scripts/                            # GitHub Actions workflows
```

> **Catatan:** Folder `statistics/ts5.x1.asia/` (pola lama) sudah tidak dipakai.
> Semua halaman statistik sekarang ada di `/s/ts5.x1.asia/statistics/`.

---

## 6. Komponen UI

### 6.1 Navbar (`navbar.js`)

Cara pakai di setiap halaman:

```html
<!-- Di awal <body> -->
<div id="navbar-root"></div>

<!-- Sebelum </body> — servers.js harus di-load SEBELUM navbar.js -->
<script src="/servers.js"></script>
<script src="/navbar.js"></script>
```

**Spesifikasi visual:**
- Sticky, `height: 64px`, `padding: 0 40px` (mobile: `0 20px`)
- Background: `rgba(255,255,255,0.92)` + `backdrop-filter: blur(16px)`
- Border bottom: `1px solid var(--border)`
- Box shadow: `0 1px 0 rgba(37,99,235,0.06)`

**Struktur tanpa server aktif:**
```
[⚔️ TravianTools]  [Tools ▾] [Statistics ▾] [Map ▾] [Simulators ▾] [Guides ▾] [Changelog]  [Log In] [Sign Up Free]
```

**Struktur dengan server aktif** (URL mengandung `/s/{slug}/`):
```
[⚔️ TravianTools]  [Tools ▾] [Statistics ▾] [Map ▾] [Simulators ▾] [Guides ▾] [Changelog]  [● TS5 Asia ▾] [Log In] [Sign Up Free]
```

**Cara navbar detect server aktif:**
```js
// URL /s/ts5.x1.asia/statistics/ → parts = ['s','ts5.x1.asia','statistics']
const parts = window.location.pathname.split('/').filter(Boolean);
// parts[0] === 's' → parts[1] adalah server slug
const activeServer = parts[0] === 's' && parts[1] ? parts[1] : null;
```

**Link server-based tools di navbar:**
- Ada server aktif → `href="/s/{activeServer}/{tool}/"`
- Tidak ada → `href="/s/?redirect={tool}"`

**Server Switcher (muncul saat ada server aktif):**
- Tombol biru tipis dengan dot hijau berkedip dan label server (`TS5 Asia`)
- Dropdown list semua server aktif dari `SERVERS` config
- Server saat ini ditandai centang (✓)
- Footer "View all servers →" mengarah ke `/s/`
- Klik server lain → ganti `/s/{old-slug}/` menjadi `/s/{new-slug}/` di URL

**Menu utama:**
1. **Tools** — Building Cost, Oasis Finder, Spy Productivity, Attack Planner, Village Tree, Oasis Data (server-based), (SOON: Troop Simulator)
2. **Statistics** — Server Statistics (server-based), (SOON: Village Analyzer, Alliance Stats)
3. **Map** — Interactive Map (server-based)
4. **Simulators** — Field Production, Village Planner, (SOON: Battle Simulator, Troop Training, Crop Balance)
5. **Guides** — (SOON semua)
6. **Changelog** — link langsung

**Dropdown style:**
- Background `#ffffff`, border `1px solid var(--border)`, border-radius `14px`
- Padding `18px 8px 8px` (padding-top untuk bridge hover)
- Shadow `0 20px 60px rgba(15,33,83,0.12)`, min-width `260px`
- Bridge hover: `::after` pseudo `height: 18px`
- Setiap item: ikon 32×32px + judul bold + deskripsi kecil + badge

**Mobile (≤768px):**
- Hamburger menu, panel slide-down `max-height` transition
- Server switcher muncul sebagai grup biru tipis di atas menu

### 6.2 Breadcrumb

**Pola untuk Static Tools:**
```html
<div class="breadcrumb">
  <a href="/">Home</a> <span>›</span>
  <a href="/tools/">Tools</a> <span>›</span>
  <span>Nama Tool</span>
</div>
```

**Pola untuk Server-based Tools:**
```html
<div class="breadcrumb">
  <a href="/">Home</a> <span>›</span>
  <a href="/s/">Servers</a> <span>›</span>
  <a href="/s/ts5.x1.asia/statistics/">ts5.x1.asia</a> <span>›</span>
  <span>Statistics</span>
</div>
```

**Pola untuk Sub-page (player/alliance profile):**
```html
<div class="breadcrumb">
  <a href="/">Home</a> <span>›</span>
  <a href="/s/">Servers</a> <span>›</span>
  <a href="/s/ts5.x1.asia/statistics/">ts5.x1.asia</a> <span>›</span>
  <span id="bcName">Player Name</span>   <!-- diisi JS setelah data load -->
</div>
```

**Style breadcrumb:**
```css
.breadcrumb {
  display: flex; align-items: center; gap: 6px;
  font-size: 0.8rem; color: var(--text3);
  margin-bottom: 20px; flex-wrap: wrap;
}
.breadcrumb a { color: var(--text3); text-decoration: none; transition: color 0.15s; }
.breadcrumb a:hover { color: var(--blue2); }
.breadcrumb span { color: var(--text2); font-weight: 500; }
```

### 6.3 Page Header (Standard Tool Page)

Untuk halaman tool dengan header terpisah (attack-planner, building-costs, dll):

```html
<div class="page-header">
  <div class="breadcrumb">...</div>
  <div class="page-header-inner">
    <div class="page-title-group">
      <div class="page-icon">🔧</div>
      <div>
        <div class="page-title">Nama Tool</div>
        <div class="page-subtitle">Deskripsi singkat.</div>
      </div>
    </div>
    <div class="page-badges">
      <span class="page-badge free">FREE</span>
      <span class="page-badge no-login">No login required</span>
    </div>
  </div>
</div>
```

**Badge variants:**
```css
.page-badge.free      { background: var(--green-bg);  color: var(--green);      border: 1px solid rgba(5,150,105,0.2); }
.page-badge.no-login  { background: var(--blue-glow); color: var(--blue-light); border: 1px solid rgba(59,130,246,0.2); }
.page-badge.pro       { background: var(--amber-bg);  color: var(--amber);      border: 1px solid rgba(217,119,6,0.2); }
.page-badge.soon      { background: var(--surface2);  color: var(--text3);      border: 1px solid var(--border); }
```

### 6.4 Page Wrap & Max-Width

```css
/* Static tools (attack-planner, building-costs, simulators, dll) */
.page-wrap {
  position: relative; z-index: 1;
  max-width: 1060px;
  margin: 0 auto;
  padding: 48px 24px 72px;
}

/* Server-based tools (statistics, map, oasis-data) */
.page-wrap {
  position: relative; z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}

@media (max-width: 768px) {
  .page-wrap { padding: 28px 16px 48px; }
}
```

**Aturan max-width:**
- `1060px` — static tools, simulators, select-server (`/s/`)
- `1200px` — server-based tools dengan layout dua kolom (statistics, player/alliance profile, dll)
- Perbedaan lebar antar halaman dalam kategori yang sama = bug

### 6.5 Tombol

| Class | Deskripsi |
|---|---|
| `.tt-btn-primary` | `#2563eb`, teks putih, shadow biru — navbar |
| `.tt-btn-ghost` | Border tipis, hover biru — navbar |
| `.btn-primary` | Versi in-page |
| `.btn-ghost` | Versi in-page |

### 6.6 Cards, Badge, Background, Toast, Sidebar

*(Sama seperti sebelumnya — CSS variables, animasi, dan pola sidebar 1fr+280px tidak berubah)*

---

## 7. Animasi

```css
@keyframes fadeDown { from { opacity:0; transform:translateY(-14px); } to { opacity:1; transform:translateY(0); } }
@keyframes fadeUp   { from { opacity:0; transform:translateY(18px);  } to { opacity:1; transform:translateY(0); } }
@keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
```

- Durasi hover transition: `0.18s`–`0.25s`
- Cards/sections: `fadeUp` staggered dengan `animation-delay`

---

## 8. Layout & Spacing

| Konteks | Max-width | Padding |
|---|---|---|
| Static tools & simulators | `1060px` | `48px 24px 72px` |
| Server-based tools (statistics, map) | `1200px` | `32px 24px 80px` |
| Halaman pilih server (`/s/`) | `1060px` | `64px 24px 80px` |

**Breakpoints:**

| Breakpoint | Keterangan |
|---|---|
| `≤ 900px` | Sidebar layout → single column |
| `≤ 860px` | Profile layout (main+sidebar) → single column |
| `≤ 768px` | Navbar hamburger; padding dikurangi |
| `≤ 700px` | Stats grid 4-col → 2-col |
| `≤ 480px` | Padding lebih compact |

---

## 9. Daftar Halaman & Status

### Gateway & Halaman Utama

| URL | File | Status |
|---|---|---|
| `/` | `index.html` | ✅ Live |
| `/s/` | `s/index.html` | ✅ Done |
| `/login/` | `login/index.html` | 🔧 UI ada, belum fungsional |
| `/register/` | `register/index.html` | 🔧 UI ada, belum fungsional |
| `/changelog/` | `changelog/index.html` | ⬜ Belum dibuat |

### Static Tools

| URL | File | Status | Auth |
|---|---|---|---|
| `/tools/attack-planner/` | `tools/attack-planner/index.html` | ✅ Live | Bebas |
| `/tools/building-costs/` | `tools/building-costs/index.html` | ✅ Live | Bebas |
| `/tools/oasis-finder/` | `tools/oasis-finder/index.html` | ✅ Live | Bebas |
| `/tools/spy-on-productivity/` | `tools/spy-on-productivity/index.html` | ✅ Live | Bebas |
| `/tools/village-tree/` | `tools/village-tree/index.html` | ✅ Live | Bebas |

### Static Simulators

| URL | File | Status | Auth |
|---|---|---|---|
| `/simulators/field-production/` | `simulators/field-production/index.html` | ✅ Live | Bebas |
| `/simulators/village-planner/` | `simulators/village-planner/index.html` | ✅ Live | Bebas |

### Server-based Tools — ts5.x1.asia

| URL | File | Status | Auth |
|---|---|---|---|
| `/s/ts5.x1.asia/statistics/` | `s/ts5.x1.asia/statistics/index.html` | ✅ Done | Bebas |
| `/s/ts5.x1.asia/statistics/player/` | `s/ts5.x1.asia/statistics/player/index.html` | ✅ Done | Bebas |
| `/s/ts5.x1.asia/statistics/alliance/` | `s/ts5.x1.asia/statistics/alliance/index.html` | ✅ Done | Bebas |
| `/s/ts5.x1.asia/oasis-data/` | `s/ts5.x1.asia/oasis-data/index.html` | 🚧 IN DEV | Preview 1000 (free) |
| `/s/ts5.x1.asia/map/` | `s/ts5.x1.asia/map/index.html` | 🚧 IN DEV | TBD |

---

## 10. Daftar Tools & Roadmap

### ✅ Live

| Tool | Tipe | Kategori | Auth |
|---|---|---|---|
| Attack Planner | Static | Tools | Bebas |
| Building Costs | Static | Tools | Bebas |
| Oasis Finder | Static | Tools | Bebas |
| Spy Productivity | Static | Tools | Bebas |
| Village Tree | Static | Tools | Bebas |
| Field Production | Static | Simulators | Bebas |
| Village Planner | Static | Simulators | Bebas |
| Server Statistics | Server-based | Statistics | Bebas |

### 🚧 In Development

| Tool | Tipe | Kategori | Catatan |
|---|---|---|---|
| Oasis Data | Server-based | Tools | Preview 1000 data gratis |
| Map | Server-based | Map | — |

### 🗓 Planned

| Tool | Tipe | Kategori |
|---|---|---|
| Troop Simulator | Static | Tools |
| Battle Simulator | Static | Simulators |
| Troop Training | Static | Simulators |
| Crop Balance | Static | Simulators |
| Village Analyzer | Server-based | Statistics |
| Alliance Stats | Server-based | Statistics |
| Beginner Guide | Static | Guides |
| Defense Guide | Static | Guides |
| Raiding Strategy | Static | Guides |

---

## 11. Aturan Desain

### ✅ Boleh
- Background putih `#ffffff` atau `#f8faff`
- Font Space Grotesk + DM Sans dari Google Fonts CDN
- Warna aksen navy & biru sesuai CSS variables
- Animasi fadeUp/fadeDown subtle
- Server switcher di navbar saat ada server aktif
- Emoji sebagai ikon (bukan icon library eksternal)
- Layout dua kolom untuk tool kompleks

### ❌ Tidak boleh
- Background gelap / dark mode
- Font medieval (Cinzel, Lora)
- Gradient ungu atau warna AI-generic
- `max-width` berbeda dalam kategori yang sama
- Layout tidak responsive
- CSS framework eksternal (Tailwind, Bootstrap)
- Folder per server di luar `/s/` (misal `statistics/ts5.x1.asia/` — pola lama)

---

## 12. Catatan Teknis

### Stack
- Plain HTML/CSS/JS — tidak pakai framework
- Font dari Google Fonts CDN
- Tidak ada iklan, tidak ada tracker

### Hosting & DNS
- GitHub Pages via `travian.sonybukansoni.com`
- GitHub repo username: `correctable`
- DNS: CNAME `travian` → `correctable.github.io` di Niagahoster/Domainesia

### Database (Turso — read-only)

```js
const TURSO_URL   = 'https://travian-stats-correctable.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicm8iLCJpYXQiOjE3Nzk2MDM3ODcsImlkIjoiMDE5ZTU4MmMtNWEwMS03YWIxLTg3NTgtNWNmYzllOWMyY2U3IiwicmlkIjoiMzNmMzgyNDItMTU3Yy00N2FjLWFkMzQtNDFhZDRhZDFhNjhhIn0.jXrskYytK1bpe7YkS0GigPktGeoRPZR7L-1Vto8-wWgBeKC5FthmH6wUgVzKuLy-9xEKDZY117xBfHqgIi2eAw';
```

> Token **read-only** — aman di client-side. Jangan ganti dengan token write.

**Konstanta wajib di setiap halaman server-based:**
```js
const SERVER      = 'ts5';           // nilai kolom 'server' di Turso — JANGAN diganti
const SERVER_SLUG = 'ts5.x1.asia';   // untuk URL dan label UI
const BASE_PATH   = `/s/${SERVER_SLUG}/statistics`; // sesuaikan per tool
```

### Skema Database
Tabel: `snapshots`, `villages`, `players`, `alliances`, `oases`, `village_tiles`,
`player_history`, `alliance_history`, `village_history`, `village_events`, `alliance_events`
Views: `player_growth_7d`, `alliance_growth_7d`
Kolom `server`: nilai `'ts5'` (bukan slug URL)

### Data Statis
- `data/buildings.json` — semua bangunan Travian semua tribe semua level

### GitHub Actions
- `scripts/` + `.github/` — workflow otomasi import data ke Turso (tidak terpengaruh perubahan hosting)

---

## 13. Checklist Tambah Halaman Baru

**Static tool:**
1. Buat `tools/{nama}/index.html`
2. Pasang `<div id="navbar-root"></div>` di awal `<body>`
3. Load Google Fonts + CSS variables di `<head>`
4. Pasang `page-header` + `.page-wrap` (`max-width: 1060px`)
5. Load `<script src="/servers.js"></script><script src="/navbar.js"></script>` sebelum `</body>`
6. Tambah entry di `NAVBAR_CONFIG` di `navbar.js` dengan `serverBased: false`
7. Test responsive 375px / 768px / 1060px+

**Server-based tool baru** (misal `player-tracker`):
1. Buat `s/ts5.x1.asia/player-tracker/index.html`
2. Salin pola dari `s/ts5.x1.asia/statistics/index.html`
3. Set `const BASE_PATH = '/s/ts5.x1.asia/player-tracker'`
4. Breadcrumb: `Home › Servers › ts5.x1.asia › Player Tracker`
5. Tambah `'player-tracker'` ke `SERVER_BASED_TOOLS` di `servers.js`
6. Tambah entry di `NAVBAR_CONFIG` dengan `serverBased: true, serverTool: 'player-tracker'`

**Server baru:**
1. Tambah entry di `SERVERS` array di `servers.js` → `active: true`
2. Duplikat folder `s/ts5.x1.asia/` → `s/{slug-baru}/`
3. Update `const SERVER`, `SERVER_SLUG`, `BASE_PATH` di setiap file di folder baru
4. Selesai — `/s/` dan navbar switcher otomatis ikut update dari `servers.js`

---

*Terakhir diperbarui: Mei 2026 — travian.sonybukansoni.com*