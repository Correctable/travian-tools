// supabase.js — Shared Supabase client for TravianTools
// Load order di setiap halaman yang butuh auth/database:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
//   <script src="/supabase.js"></script>
//   <script src="/servers.js"></script>
//   <script src="/navbar.js"></script>
//
// Akses client via window._supabase dari file lain.

(function () {
  const SUPABASE_URL  = 'https://bcsomahzvxbzzmguldsm.supabase.co';
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjc29tYWh6dnhienptZ3VsZHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTk3MjgsImV4cCI6MjA5NTM3NTcyOH0.FGrCaavzrQEtgktWDhueSid6ZFu_rRJBQS2C0MBd6ds';

  if (typeof supabase === 'undefined') {
    console.error('[TravianTools] Supabase CDN belum di-load. Pastikan script CDN ada sebelum supabase.js.');
    return;
  }

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
    auth: {
      persistSession: true,       // session disimpan di localStorage
      autoRefreshToken: true,     // token di-refresh otomatis sebelum expired
      detectSessionInUrl: true,   // handle redirect dari email confirmation
    },
  });

  // Expose ke global supaya bisa diakses dari navbar.js dan halaman lain
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

  // Helper: cek apakah user Pro
  // Konvensi: simpan role di user_metadata.role = 'pro'
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

})();