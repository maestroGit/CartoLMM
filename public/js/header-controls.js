// header-controls.js
// Consolidated header helpers, debug hooks, settings placeholder, and
// leaflet layers control positioning. Loaded from public/index.html.

(function () {
  // --- Global error handler ---
  // Header click debug listeners removed to reduce console noise.
  // If you need to debug header interactions, use `window.debugRevealMap()`
  // or re-enable a scoped debug flag (e.g. window.__DEBUG_HEADER).

  window.addEventListener('error', function (ev) {
    console.error('Global error caught:', ev.error || ev.message, ev.filename, ev.lineno);
  });

  // --- Settings placeholder modal (exposed globally) ---
  window.showSettingsPlaceholder = function () {
    const existing = document.getElementById('settingsPlaceholderModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'settingsPlaceholderModal';
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:520px; margin-top:60px; text-align:center;">
            <span class="close">&times;</span>
            <h2>⚙️ Settings</h2>
            <p>Settings page not found. This is a placeholder.</p>
            <div style="margin-top:12px;"><button class="dashboard-btn primary modal-close-btn">Close</button></div>
        </div>`;
    document.body.appendChild(modal);
    const remove = () => modal.remove();
    modal.querySelector('.close')?.addEventListener('click', remove);
    modal.querySelector('.modal-close-btn')?.addEventListener('click', remove);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) remove();
    });
  };

  // --- MutationObserver + control positioning helpers ---
  (function () {
    let allowAddControls = false;

    function removeAutoAddedControls() {
      document.querySelectorAll('.leaflet-control-layers').forEach((el) => {
        if (!allowAddControls) {
          console.log('Removing auto-added leaflet control');
          el.remove();
        }
      });
    }

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.addedNodes && m.addedNodes.length) {
          m.addedNodes.forEach((node) => {
            try {
              if (node.nodeType === 1 && node.classList && node.classList.contains('leaflet-control-layers')) {
                const globalAllow = !!window.__allowLeafletControl;
                if (!allowAddControls && !globalAllow) {
                  console.log('MutationObserver: removing early leaflet-control-layers node');
                  node.remove();
                } else {
                  console.log('MutationObserver: allowing leaflet-control-layers node (allowed by flag)');
                  try {
                    positionLeafletLayersControl(node);
                  } catch (e) {
                    console.warn('position on add failed', e);
                  }
                }
              }
            } catch (err) {
              console.error('Error in MutationObserver handler:', err);
            }
          });
        }
      }
    });

    document.addEventListener('DOMContentLoaded', function () {
      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
      }

      // Remove any that already exist
      removeAutoAddedControls();

      // Dropdown/menu wiring
  const toggleBtn = document.getElementById('toggle-metrics');
  let menu = document.getElementById('toggle-metrics-menu');
      const metricsAction = document.getElementById('metrics-action');
      const walletAction = document.getElementById('wallet-demo-action');
      const sidebarPanel = document.querySelector('.sidebar-panel');
      let metricsVisible = true;

      if (toggleBtn) {
        function openMenu() {
          if (!menu) return;
          try {
            const rect = toggleBtn.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.zIndex = 12000;
            menu.style.maxWidth = '320px';

            const spacing = 8;
            const estimatedWidth = Math.min(menu.offsetWidth || 200, 320);
            let left = rect.left;
            if (left + estimatedWidth + 8 > window.innerWidth) {
              left = Math.max(8, window.innerWidth - estimatedWidth - 8);
            }
            const top = rect.bottom + spacing;
            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;
            menu.classList.add('dropdown-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
          } catch (err) {
            menu.classList.add('dropdown-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
          }
        }

        function closeMenu() {
          if (menu) {
            menu.classList.remove('dropdown-open');
            menu.style.position = '';
            menu.style.left = '';
            menu.style.top = '';
            toggleBtn.setAttribute('aria-expanded', 'false');
          }
        }

        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          // Re-query the menu in case the DOM has changed since initialization
          if (!menu) menu = document.getElementById('toggle-metrics-menu');
          if (!menu) return;
          if (menu.classList.contains('dropdown-open')) closeMenu();
          else openMenu();
        });

        if (metricsAction) {
          metricsAction.addEventListener('click', (e) => {
            e.stopPropagation();
            const mainGrid = document.querySelector('.cartolmm-main');
            if (mainGrid) mainGrid.classList.toggle('sidebar-open');
            closeMenu();
          });
        }

        if (walletAction) {
          walletAction.addEventListener('click', (e) => {
            e.stopPropagation();
            try {
              window.open('http://127.0.0.1:5500/public/demo-wallet/wallet-demo.html', '_blank', 'noopener');
            } catch (err) {
              window.location.href = 'http://127.0.0.1:5500/public/demo-wallet/wallet-demo.html';
            }
            closeMenu();
          });
        }
      }

      // Settings control wiring
      // If the settings control is an <a> (preferred), let the browser handle opening in a new tab
      // (avoids popup-blockers). If it's a non-anchor (button), fall back to window.open with modal
      // fallback in case it's blocked.
      const settingsBtn = document.getElementById('settings-btn');
      if (settingsBtn) {
        try {
          if (settingsBtn.tagName === 'A') {
            // Ensure the anchor opens in a new tab and uses noopener for safety.
            settingsBtn.setAttribute('target', '_blank');
            settingsBtn.setAttribute('rel', 'noopener');
          } else {
            settingsBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              // Open the external settings URL in a new tab. Use the explicit dev-server URL
              // to ensure the correct origin is opened.
              const url = 'http://127.0.0.1:5500/public/index.html';
              try {
                const w = window.open(url, '_blank', 'noopener');
                if (!w) throw new Error('popup-blocked');
                try { w.opener = null; } catch (ex) { /* ignore */ }
              } catch (err) {
                showSettingsPlaceholder();
              }
            });
          }
        } catch (err) {
          console.warn('Error wiring settings control', err);
        }
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!menu) return;
        if (menu.style.display === 'block' && !menu.contains(e.target) && e.target !== toggleBtn) {
          closeMenu();
        }
      });
    });

    // Helper: position the Leaflet layers control under the header button
    let currentControl = null;
    let handlersInstalled = false;

    function installHandlers(btn, control, gap) {
      if (handlersInstalled) return;
      handlersInstalled = true;
      const reposition = () => {
        try {
          const r = btn.getBoundingClientRect();
          const left = Math.max(8, Math.round(r.left + r.width / 2 - control.offsetWidth / 2));
          control.style.left = `${left}px`;
          control.style.top = `${Math.round(r.bottom + gap)}px`;
        } catch (e) {
          /* ignore */
        }
      };
      window.addEventListener('resize', reposition);
      window.addEventListener('scroll', reposition);
      window.addEventListener('orientationchange', reposition);
    }

    window.positionLeafletLayersControl = function (node) {
      try {
        const btn = document.getElementById('toggle-layers');
        if (!btn) return;
        const control = node || document.querySelector('.leaflet-control-layers.leaflet-control');
        if (!control) return;
        if (currentControl && currentControl !== control) {
          try {
            currentControl.classList.remove('positioned-under-header');
          } catch (e) {}
        }
        currentControl = control;
        control.style.position = 'fixed';
        control.style.zIndex = 12001;
        const gap = 8;
        const rect = btn.getBoundingClientRect();
        const left = Math.max(8, Math.round(rect.left + rect.width / 2 - control.offsetWidth / 2));
        const top = Math.round(rect.bottom + gap);
        control.style.left = `${left}px`;
        control.style.top = `${top}px`;
        control.classList.add('positioned-under-header');
        installHandlers(btn, control, gap);
      } catch (err) {
        console.warn('positionLeafletLayersControl failed', err);
      }
    };

    // Retry initialization helper: attempts to (re)initialize map and reload data
    window.retryMapInit = async function () {
      try {
        console.log('RetryMapInit: attempting to initialize mapService and reload dashboard data');
        let ok = false;
        if (window.mapService && typeof window.mapService.initialize === 'function') {
          ok = !!window.mapService.initialize('map');
        }

        if (ok) {
          console.log('RetryMapInit: mapService initialized successfully');
          // If dashboardService exists, ask it to (re)load initial data
          if (window.dashboardService && typeof window.dashboardService.loadInitialData === 'function') {
            try {
              await window.dashboardService.loadInitialData();
              console.log('RetryMapInit: dashboardService.loadInitialData completed');
            } catch (err) {
              console.warn('RetryMapInit: dashboardService.loadInitialData failed', err);
            }
          }
          return true;
        } else {
          console.warn('RetryMapInit: mapService.initialize returned falsy');
        }
      } catch (err) {
        console.error('RetryMapInit failed:', err);
      }
      return false;
    };

    // Attach to button if present
    try {
      const retryBtn = document.getElementById('retry-map-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          retryBtn.disabled = true;
          retryBtn.textContent = '⏳ Intentando...';
          const result = await window.retryMapInit();
          retryBtn.disabled = false;
          retryBtn.textContent = result ? '✅ Reintento OK' : '🔁 Reintentar Mapa';
          setTimeout(() => { retryBtn.textContent = '🔁 Reintentar Mapa'; }, 3000);
        });
      }
    } catch (e) { /* ignore */ }
  })();

  // --- Debug helpers to reveal map if it's covered by overlays ---
  window.debugRevealMap = function () {
    try {
      // create style tag
      let s = document.getElementById('debug-reveal-map-style');
      if (!s) {
        s = document.createElement('style');
        s.id = 'debug-reveal-map-style';
        s.type = 'text/css';
        s.innerHTML = `
          /* Bring map container front for debugging */
          .map-container, .leaflet-map {
            z-index: 999999 !important;
            position: relative !important;
          }
          /* Make known overlay classes slightly transparent so map is visible */
          .notification, .welcome-message, .initialization-error, .loader, .dropdown-menu {
            opacity: 0.6 !important;
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(s);
      }
      console.log('debugRevealMap: applied debug styles (map should be on top). Use debugRevealMapRevert() to undo.');
      return true;
    } catch (e) {
      console.error('debugRevealMap failed', e);
      return false;
    }
  };

  window.debugRevealMapRevert = function () {
    try {
      const s = document.getElementById('debug-reveal-map-style');
      if (s) s.remove();
      console.log('debugRevealMapRevert: reverted debug styles');
      return true;
    } catch (e) {
      console.error('debugRevealMapRevert failed', e);
      return false;
    }
  };

})();
