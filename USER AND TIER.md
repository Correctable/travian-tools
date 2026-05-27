# TravianTools — Rencana Pengembangan
> Dokumen ini adalah ringkasan keputusan teknis dan roadmap dari sesi perencanaan.
> Bawa dokumen ini ke chat baru untuk melanjutkan dari titik yang sama.

---

## Konteks Proyek

- **Produk:** TravianTools — `travian.sonybukansoni.com`
- **Stack:** Plain HTML/CSS/JS, GitHub Pages, Turso (read-only), Supabase (auth + database)
- **Repo:** GitHub username `correctable`
- **Design spec utama:** `DESIGN_SPEC.md` di root repo (sudah finalized, Mei 2026)

---

## Keputusan yang Sudah Dikunci

### Tier Free vs Pro
- **Static Tools & Simulators** — semua full free
- **Statistics** (leaderboard, player profile, alliance profile) — free
- **Inactive Search** — **full free** (kompetitor buka semua datanya, tidak worth di-gate)
- **Map** — free view, filter alliance max 5 (free) / unlimited (Pro), filter player max 10 (free) / unlimited (Pro), export koordinat Pro only
- **Oasis Data** — preview 1000 row (free), full + export CSV (Pro)
- **Notes & Watchlist** — Pro only, login required
- **Battle Report** share link — free (paste & share, TTL), riwayat tersimpan Pro
- **Alliance Management** (buat workspace, member roster, troop summary, artifact tracker) — Pro only
- **Chrome Extension / Userscript** — Pro only (roadmap)

### Posisi Inactive Search
Masuk ke bawah **Statistics**, bukan Tools, agar implementasi lebih mudah mengikuti pola server-based yang sudah ada.

Struktur statistics jadi:
```
/s/ts5.x1.asia/statistics/
├── index.html            ✅ Leaderboard (existing)
├── player/               ✅ Player profile (existing)
├── alliance/             ✅ Alliance profile (existing)
└── inactive-search/      🆕 Cari player inactive
```

### Auth & Database — Supabase
- Provider auth: **Supabase** (free tier)
- Region Supabase: **Southeast Asia (Singapore)**
- Supabase menggantikan kebutuhan Cloudflare Worker — client JS bisa insert langsung dari browser karena Row Level Security (RLS)
- Turso tetap dipakai untuk data game (read-only via token yang sudah ada)
- Supabase dipakai untuk: shared reports, saved searches, notes, watchlist, workspace alliance

---

## Struktur Repository (Lengkap)

```
/ (root)
├── index.html
├── navbar.js                  # Perlu update untuk auth state (lihat bagian Navbar)
├── servers.js                 # Tambah 'inactive-search' ke SERVER_BASED_TOOLS
├── shared.css
├── CNAME
│
├── s/
│   └── ts5.x1.asia/
│       ├── statistics/
│       │   ├── index.html              ✅ Leaderboard
│       │   ├── player/index.html       ✅ Player profile
│       │   ├── alliance/index.html     ✅ Alliance profile
│       │   └── inactive-search/        🆕
│       │       └── index.html
│       ├── oasis-data/                 🚧 in dev
│       │   └── index.html
│       └── map/                        🚧 in dev
│           └── index.html
│
├── tools/                     ✅ existing, tidak ada perubahan struktur
│
├── simulators/                ✅ existing, tidak ada perubahan struktur
│
├── reports/                   🆕 Battle Report
│   └── index.html             # Paste report → parse → tampilkan + generate share link
│
├── r/                         🆕 Shared report viewer
│   └── index.html             # /r/{id} → fetch dari Supabase → render
│
├── account/                   🆕 Fitur Pro (semua login required)
│   ├── notes/
│   │   └── index.html
│   ├── watchlist/
│   │   └── index.html
│   └── workspace/
│       ├── index.html         # Dashboard workspace (leader view)
│       ├── members/index.html
│       ├── troops/index.html  # Troop summary + input form anggota
│       ├── artifacts/index.html
│       └── world-wonder/index.html
│
├── login/index.html           🔧 UI ada, perlu disambung ke Supabase Auth
├── register/index.html        🔧 UI ada, perlu disambung ke Supabase Auth
│
└── data/
    └── buildings.json         ✅ existing
```

---

## Perubahan `servers.js`

Tambah `inactive-search` ke array `SERVER_BASED_TOOLS`:

```js
const SERVER_BASED_TOOLS = ['statistics', 'oasis-data', 'map', 'inactive-search'];
```

---

## Perubahan `navbar.js` — Auth State

Navbar perlu membaca Supabase session dan merender tiga state:

**Belum login:**
```
[TravianTools] [Tools▾] [Statistics▾] [Map▾] [Simulators▾] [Guides▾] [Changelog]  [Log In] [Sign Up Free]
```

**Login, free user:**
```
[TravianTools] [Tools▾] [Statistics▾] [Map▾] [Simulators▾] [Guides▾] [Changelog]  [● TS5▾] [avatar▾]
```

**Login, Pro user:**
```
[TravianTools] [Tools▾] [Statistics▾] [Map▾] [Simulators▾] [Guides▾] [Changelog]  [● TS5▾] [⭐ avatar▾]
```

Dropdown avatar berisi: My Notes, Watchlist, Workspace (Pro), Settings, Log Out.

Implementasi: load Supabase JS dari CDN di navbar, panggil `supabase.auth.getSession()` saat init.

---

## Skema Tabel Supabase (Prioritas Awal)

Dua tabel ini perlu dibuat pertama:

```sql
-- Battle Report share link
create table shared_reports (
  id         text primary key,        -- nanoid/slug pendek
  content    text not null,           -- raw report text atau parsed JSON
  user_id    uuid references auth.users(id), -- null jika tidak login
  created_at timestamptz default now(),
  expires_at timestamptz              -- null = permanen (Pro)
);

-- Inactive Search share link
create table shared_searches (
  id         text primary key,
  server     text not null,           -- e.g. 'ts5'
  params     jsonb not null,          -- filter yang dipakai
  result     jsonb,                   -- hasil snapshot saat dibuat
  user_id    uuid references auth.users(id),
  created_at timestamptz default now(),
  expires_at timestamptz
);
```

RLS: user hanya bisa read/write row miliknya sendiri. Row tanpa `user_id` (anonymous share) bisa dibaca siapa saja.

Tabel selanjutnya (nanti, setelah auth jalan): `notes`, `watchlist`, `workspaces`, `workspace_members`, `troop_inputs`.

---

## Prioritas Pengerjaan

| # | Item | Prasyarat | Status |
|---|------|-----------|--------|
| 1 | Setup Supabase project + 2 tabel awal | — | ⬜ |
| 2 | Auth fungsional (login/register/logout) + update navbar | Supabase project jadi | ⬜ |
| 3 | Inactive Search di `/s/ts5.x1.asia/statistics/inactive-search/` | Auth jalan | ⬜ |
| 4 | Battle Report di `/reports/` + viewer `/r/{id}` | Supabase + auth | ⬜ |
| 5 | Notes & Watchlist di `/account/` | Auth + Pro gate | ⬜ |
| 6 | Alliance Workspace di `/account/workspace/` | Semua di atas | ⬜ |

---

## Catatan Teknis Tambahan

### GitHub Pages — Routing `/r/{id}`
GitHub Pages tidak support dynamic routing. Untuk `/r/abc123` bekerja, gunakan **404.html redirect trick**:
- Buat `404.html` yang redirect ke `r/index.html` sambil pass path sebagai query param
- `r/index.html` baca slug dari `window.location` lalu fetch dari Supabase

### Supabase Credentials
Setelah project jadi, simpan di setiap halaman yang butuh Supabase:
```js
const SUPABASE_URL  = 'https://xxxx.supabase.co';   // isi setelah project dibuat
const SUPABASE_ANON = 'your-anon-key';               // public key, aman di client
```
Jangan gunakan service role key di client-side.

### Turso (existing, tidak berubah)
```js
const TURSO_URL   = 'https://travian-stats-correctable.turso.io';
const TURSO_TOKEN = '...'; // read-only, aman di client
const SERVER      = 'ts5';
```

---

*Dibuat: Mei 2026 — sesi perencanaan TravianTools*