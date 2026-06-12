(() => {
  const CSS = `
    .tt-footer {
      background: var(--surface2);
      border-top: 1px solid var(--border);
      padding: 0 40px;
    }
    .tt-footer-inner {
      width: 100%;
    }
    .tt-footer-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 0;
      border-bottom: 1px solid var(--border);
      position: relative;
    }
    .tt-footer-brand {
      display: flex;
      align-items: center;
      gap: 7px;
      text-decoration: none;
      flex-shrink: 0;
    }
    .tt-footer-brand span:first-child {
      font-size: 1rem;
    }
    .tt-footer-brand span:last-child {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 0.88rem;
      color: var(--text);
      letter-spacing: -0.01em;
    }
    .tt-footer-sep {
      width: 1px;
      height: 16px;
      background: var(--border);
      flex-shrink: 0;
    }
    .tt-footer-links {
      display: flex;
      align-items: center;
      gap: 4px;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
    .tt-footer-links a {
      font-size: 0.78rem;
      color: var(--text3);
      text-decoration: none;
      padding: 4px 10px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      white-space: nowrap;
    }
    .tt-footer-links a:hover {
      color: var(--blue2);
      background: var(--blue-glow);
    }
    .tt-footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      flex-wrap: wrap;
    }
    .tt-footer-copy {
      font-size: 0.72rem;
      color: var(--text3);
    }
    .tt-footer-copy a {
      color: var(--text3);
      text-decoration: none;
      transition: color 0.15s;
    }
    .tt-footer-copy a:hover {
      color: var(--blue2);
    }
    .tt-footer-disclaimer {
      font-size: 0.7rem;
      color: var(--text3);
      opacity: 0.6;
    }
    @media (max-width: 768px) {
      .tt-footer { padding: 0 20px; }
      .tt-footer-sep { display: none; }
      .tt-footer-top { gap: 12px; padding: 14px 0; }
      .tt-footer-bottom { flex-direction: column; align-items: flex-start; gap: 2px; padding: 10px 0; }
    }
  `;

  const LINKS = [
    { label: 'Servers',     href: '/s/' },
    { label: 'Pricing',     href: '/pricing/' },
    { label: 'Changelog',   href: '/changelog/' },
    { label: 'Contact Us',  href: 'https://discord.gg/kwkWZxgYXy', external: true },
  ];

  function init() {
    if (!document.getElementById('tt-footer-styles')) {
      const style = document.createElement('style');
      style.id = 'tt-footer-styles';
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    const root = document.getElementById('footer-root');
    if (!root) return;

    const linkHTML = LINKS.map(({ label, href, external }) =>
      `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`
    ).join('');

    root.innerHTML = `
      <footer class="tt-footer">
        <div class="tt-footer-inner">
          <div class="tt-footer-top">
            <a href="/" class="tt-footer-brand">
              <span>⚔️</span>
              <span>TravianTools</span>
            </a>
            <nav class="tt-footer-links">${linkHTML}</nav>
          </div>
          <div class="tt-footer-bottom">
            <div class="tt-footer-copy">
              © ${new Date().getFullYear()} TravianTools · by <a href="https://sonybukansoni.com" target="_blank" rel="noopener">sonybukansoni.com</a>
            </div>
            <div class="tt-footer-disclaimer">Not affiliated with Travian Games GmbH</div>
          </div>
        </div>
      </footer>
    `;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();