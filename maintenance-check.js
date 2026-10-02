/**
 * maintenance-check.js
 * Cek status maintenance dari Supabase. Kalau aktif, redirect ke maintenance.html
 * Admin yang sudah login TIDAK akan di-redirect.
 */

(function() {
  // Skip jika halaman saat ini adalah maintenance atau admin
  const currentPath = window.location.pathname.toLowerCase();
  if (currentPath.includes('maintenance.html') || currentPath.includes('admin.html')) {
    return;
  }

  async function checkMaintenance() {
    try {
      const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
      const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;

      const res = await fetch(
        SUPABASE_URL + '/rest/v1/settings?key=eq.maintenance_mode&select=value',
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
          }
        }
      );

      if (!res.ok) return;
      const data = await res.json();
      const isMaintenance = data[0] && data[0].value === 'true';

      if (!isMaintenance) return;

      // Cek apakah user adalah admin (sudah login)
      const isAdmin = await checkIfAdmin();
      if (isAdmin) return;

      // Redirect ke maintenance.html
      window.location.replace('maintenance.html');

    } catch (err) {
      console.error('[maintenance-check] Gagal cek status:', err);
      // Kalau error, biarkan website tampil normal (fail-safe)
    }
  }

  async function checkIfAdmin() {
    try {
      // Cek token admin di localStorage (dari Supabase Auth)
      const keys = Object.keys(localStorage);
      const authKey = keys.find(k => k.includes('auth-token'));

      if (!authKey) return false;

      const session = JSON.parse(localStorage.getItem(authKey));
      if (!session || !session.user) return false;

      // Verifikasi session masih valid ke Supabase
      const SUPABASE_URL = window.APP_CONFIG.SUPABASE_URL;
      const SUPABASE_ANON_KEY = window.APP_CONFIG.SUPABASE_ANON_KEY;
      
      const res = await fetch(SUPABASE_URL + '/auth/v1/user', {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + session.access_token
        }
      });

      return res.ok;
    } catch (err) {
      return false;
    }
  }

  // Jalankan pengecekan setelah halaman load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkMaintenance);
  } else {
    checkMaintenance();
  }
})();