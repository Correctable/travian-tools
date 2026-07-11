/**
 * TravianTools — Current Server Configuration
 *
 * Wajib dimuat setelah /servers.js.
 *
 * Contoh URL:
 * /s/ttq.x2.asia/map/
 * /s/ttq.x2.asia/statistics/player/
 */

(() => {
  const API_BASE = 'https://travian-api.sonybukansoni.workers.dev';

  function getServerSlug() {
    const match = window.location.pathname.match(/^\/s\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  function createServerConfig() {
    if (typeof SERVERS === 'undefined') {
      throw new Error(
        'SERVERS tidak ditemukan. Muat /servers.js sebelum server-config.js.'
      );
    }

    const slug = getServerSlug();

    if (!slug) {
      throw new Error(
        `Slug server tidak ditemukan dari URL: ${window.location.pathname}`
      );
    }

    const server = SERVERS.find(item => item.slug === slug);

    if (!server) {
      throw new Error(`Server "${slug}" tidak terdaftar di /servers.js.`);
    }

    return Object.freeze({
      // Identitas server
      slug: server.slug,
      label: server.label,
      domain: server.domain,
      apiKey: server.apiKey,

      // Informasi server
      speed: server.speed,
      region: server.region,
      active: server.active,
      isNew: server.isNew,

      // Path dan endpoint
      basePath: `/s/${server.slug}`,
      apiBase: API_BASE,

      // Helper URL
      toolPath(tool) {
        return `/s/${server.slug}/${tool}/`;
      },

      travianUrl(path = '') {
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `https://${server.domain}${normalizedPath}`;
      },
    });
  }

  try {
    window.SERVER_CONFIG = createServerConfig();
  } catch (error) {
    console.error('[server-config]', error);
    window.SERVER_CONFIG = null;
  }
})();