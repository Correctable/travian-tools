// supabase.js — Shared Supabase client for TravianTools
// Load order di setiap halaman yang butuh auth/database:
//
//   <script src="/supabase.js"></script>
//   <script src="/servers.js"></script>
//   <script src="/navbar.js"></script>
//
// supabase.js sudah bundling createClient sendiri via esm — tidak perlu CDN terpisah.
// Akses client via window._supabase dari file lain.

(async function () {
  const SUPABASE_URL  = 'https://bcsomahzvxbzzmguldsm.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjc29tYWh6dnhienptZ3VsZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTk3MjgsImV4cCI6MjA5NTM3NTcyOH0.FGrCaavzrQEtgktWDhueSid6ZFu_rRJBQS2C0MBd6ds';

  // Tunggu jika supabase global belum siap (CDN masih loading)
  // Fallback: import dari CDN via dynamic import jika perlu
  let createClient;

  if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
    // CDN UMD sudah ter-load
    createClient = supabase.createClient;
  } else {
    // Fallback: dynamic import dari esm.sh (module)
    try {
      const mod = await import('https://esm.sh/@supabase/supabase-js@2');
      createClient = mod.createClient;
    } catch (e) {
      console.error('[TravianTools] Failed to load Supabase:', e);
      return;
    }
  }

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  });

  // Expose ke global
  window._supabase = client;

  // Helper: ambil session aktif
  window.getSession = async function () {
    const { data: { session } } = await client.auth.getSession();
    return session;
  };

  // Helper: ambil user aktif (null jika belum login)
  window.getUser = async function () {
    const session = await window.getSession();
    return session ? session.user : null;
  };

  // Helper: ambil role string ('free' | 'plus' | 'pro')
  window.getRole = async function () {
    const user = await window.getUser();
    return user?.user_metadata?.role || 'free';
  };

  // Helper: cek apakah user Plus atau Pro
  window.isPlus = async function () {
    const role = await window.getRole();
    return role === 'plus' || role === 'pro';
  };

  // Helper: cek apakah user Pro
  window.isPro = async function () {
    const user = await window.getUser();
    if (!user) return false;
    return user.user_metadata?.role === 'pro';
  };

  // Helper: logout
  window.signOut = async function () {
    await client.auth.signOut();
    window.location.href = '/';
  };

  console.log('[TravianTools] Supabase client ready');
})();