/**
 * TravianTools — Server Configuration
 * 
 * SINGLE SOURCE OF TRUTH untuk semua server yang tersedia.
 * Diload oleh: navbar.js, select-server/index.html, semua halaman server-based.
 * 
 * CARA TAMBAH SERVER BARU:
 * 1. Tambah entry baru di array SERVERS di bawah
 * 2. Set active: false kalau data Turso belum ada (tampil sebagai "Coming Soon")
 * 3. Set active: true kalau data sudah ada — otomatis muncul di select-server & navbar
 * 4. Tidak perlu buat folder atau file HTML baru apapun
 */

const SERVERS = [
  {
    slug:    'ts5.x1.asia',           // dipakai di URL: /ts5.x1.asia/statistics/
    label:   'TS5 Asia',              // nama tampil di UI
    domain:  'ts5.x1.asia.travian.com', // domain resmi server Travian
    speed:   1,                       // kecepatan server (1x, 2x, 3x, 5x, 10x)
    region:  'Asia',                  // region (Asia, Europe, America, International)
    active:  true,                    // true = data tersedia di Turso
    isNew:   false,                   // true = tampilkan badge "NEW"
  },

  // ── Tournament Travian Qualification (TTQ) ───────────────
  {
    slug:    'ttq.x2.asia',
    label:   'TTQ Asia 2026',
    domain:  'ttq.x2.asia.travian.com',
    speed:   2,
    region:  'Asia',
    active:  false,                   // set true setelah data Turso siap
    isNew:   true,
  },
  {
    slug:    'ttq.x2.america',
    label:   'TTQ America 2026',
    domain:  'ttq.x2.america.travian.com',
    speed:   2,
    region:  'America',
    active:  false,
    isNew:   true,
  },
  {
    slug:    'ttq.x2.europe',
    label:   'TTQ Europe 2026',
    domain:  'ttq.x2.europe.travian.com',
    speed:   2,
    region:  'Europe',
    active:  false,
    isNew:   true,
  },
  {
    slug:    'ttq.x2.arabics',
    label:   'TTQ Arabics 2026',
    domain:  'ttq.x2.arabics.travian.com',
    speed:   2,
    region:  'Arabics',
    active:  false,
    isNew:   true,
  },

  // ── Tambah server baru di bawah ini ──────────────────────
  // {
  //   slug:    'ts1.x1.asia',
  //   label:   'TS1 Asia',
  //   domain:  'ts1.x1.asia.travian.com',
  //   speed:   1,
  //   region:  'Asia',
  //   active:  false,
  //   isNew:   false,
  // },
];

/**
 * Tools yang butuh server (server-based tools).
 * Dipakai oleh navbar.js untuk resolve href server-based items.
 * URL pattern: /s/{server-slug}/{tool}/
 */
const SERVER_BASED_TOOLS = [
  'statistics',
  'oasis-data',
  'map',
];