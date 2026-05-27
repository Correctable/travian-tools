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
    speed:   5,                       // kecepatan server (1x, 2x, 3x, 5x, 10x)
    region:  'Asia',                  // region (Asia, Europe, America, International)
    active:  true,                    // true = data tersedia di Turso
    isNew:   false,                   // true = tampilkan badge "NEW"
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
  // {
  //   slug:    'ts20.travian.com',
  //   label:   'TS20 International',
  //   domain:  'ts20.travian.com',
  //   speed:   3,
  //   region:  'International',
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