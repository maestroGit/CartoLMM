/**
 * UserMarker.js
 * Marcador visual para usuarios registrados en el mapa
 */

class UserMarker {
  constructor(userData, map) {
    console.log('[UserMarker] constructor', userData);
    this.data = userData;
    this.map = map;
    this.marker = null;
    this.createMarker();
  }

  createMarker() {
    console.log('[UserMarker] createMarker', this.data.localizacion);
    
    // Validar que el usuario tenga coordenadas
    if (!this.data.localizacion || 
        typeof this.data.localizacion.lat === 'undefined' || 
        typeof this.data.localizacion.lng === 'undefined') {
      console.warn('[UserMarker] Usuario sin coordenadas, no se puede crear marcador:', this.data.nombre);
      return;
    }
    
    const icon = this.createIcon();
    
    const uniqueId = this.data.id || this.data.role || 'unknown';
    this.marker = L.marker([this.data.localizacion.lat, this.data.localizacion.lng], {
      icon: icon,
      title: this.data.nombre
    });
    // Guardar el id real en el marcador para usarlo en popupopen
    this.marker._userUniqueId = uniqueId;

    this.attachPopup();
    if (this.marker) {
      console.log('[UserMarker] addTo map', this.map);
      this.marker.addTo(this.map);
    } else {
      console.warn('[UserMarker] marker not created');
    }
  }

  createIcon() {
    console.log('[UserMarker] createIcon - role:', this.data.role, 'categorias:', this.data.categorias);
    
    // Usar role primero (de magnumsmaster), luego categorias como fallback
    let userType = this.data.role || 'unknown';
    
    // Fallback a categorias si role no está disponible
    if (!userType || userType === 'unknown') {
      if (Array.isArray(this.data.categorias) && this.data.categorias.length > 0) {
        userType = this.data.categorias[0];
      } else {
        userType = 'default';
      }
    }

    // Emojis según tipo de usuario
    const iconMap = {
      wine_lover: '🍷',       // Amante del vino
      bodega: '🍇',           // Bodega/Productor
      winery: '🍇',           // Alias de bodega
      minero: '⛏️',           // Minero
      default: '🍷',          // Por defecto
      unknown: '🍷'           // Desconocido
    };

    const emoji = iconMap[userType] || iconMap.default;

    // Badge si tiene blockchain activo
    const blockchainBadge = this.data.blockchainActive 
      ? '<div class="user-blockchain-active"></div>' 
      : '';

    // Badge de múltiples categorías: si es minero, mostrar ⛏️
    let multiBadge = '';
    if (Array.isArray(this.data.categorias) && this.data.categorias.length > 1 && 
        this.data.categorias.includes('minero')) {
      multiBadge = '<div class="user-multi-badge">⛏️</div>';
    }

    const html = `
      <div class="user-marker user-marker-${userType}">
        ${emoji}
        ${blockchainBadge}
        ${multiBadge}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: 'user-icon-wrapper',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
      popupAnchor: [0, -19]
    });
  }

  attachPopup() {
    const uniqueId = this.data.id || this.data.role || 'user';
    const nombre = this.data.nombre || 'Sin nombre';
    const email = this.data.email || 'No especificado';
    const location = this.resolveLocation(this.data);
    const subscription = this.resolveSubscription(this.data);
    const memberSince = this.resolveMemberSince(this.data);

    const roleCategory = this.data.role === 'winery'
      ? 'bodega'
      : ((this.data.role === 'wine_lover' || this.data.role === 'user') ? 'wine_lover' : null);
    const categoriasList = Array.isArray(this.data.categorias) && this.data.categorias.length > 0
      ? this.data.categorias
      : (roleCategory ? [roleCategory] : []);

    const isWineLover = Boolean(categoriasList && categoriasList.includes('wine_lover'));
    const isBodega = Boolean(categoriasList && (categoriasList.includes('bodega') || this.data.role === 'winery'));
    const userType = isWineLover ? 'winelover' : (isBodega ? 'bodega' : 'otro');

    // Categorías tags
    const categoriesHtml = categoriasList.length > 0
      ? categoriasList.slice(0, 3).map(cat => `<span class="winery-category-tag">${this.escapeHtml(cat)}</span>`).join('')
      : `<span class="winery-category-tag">${userType === 'bodega' ? 'bodega' : (userType === 'winelover' ? 'wine_lover' : 'user')}</span>`;

    // Badges tags
    const rawBadges = Array.isArray(this.data.badges) ? this.data.badges : [];
    const badgesHtml = rawBadges.length > 0
      ? rawBadges.slice(0, 3).map(badge => `<span class="winery-badge-tag">${this.escapeHtml(this.getBadgeLabel(badge))}</span>`).join('')
      : '<span class="winery-badge-tag">No badges</span>';

    // Wallets section
    const wallets = Array.isArray(this.data.wallets) && this.data.wallets.length > 0
      ? this.data.wallets.map((w, idx) => `
          <div class="wallet-item">
            <code class="wallet-address-code">${this.escapeHtml(w.address)}</code>
            <div class="wallet-actions-row">
              <button class="balance-btn-user-popup" onclick="window.getWalletBalance && window.getWalletBalance('${this.escapeHtml(w.address)}', this)">Magnums</button>
              <div class="wallet-balance-result" id="wallet-balance-result-${this.escapeHtml(this.data.id || String(idx))}"></div>
            </div>
          </div>
        `).join('')
      : '<p class="wallet-empty-message">Sin wallets registradas</p>';

    // Blockchain status
    const blockchainStatus = this.data.blockchainActive
      ? '<p class="footer-popup-item blockchain-active-item">🟢 Blockchain activa</p>'
      : '';

    // Web field
    const webRaw = this.data.web ? String(this.data.web).trim() : '';
    const webHref = webRaw.startsWith('http://') || webRaw.startsWith('https://') ? webRaw : `https://${webRaw}`;
    const webField = webRaw
      ? `<p class="footer-popup-item"><strong>Web:</strong> <a href="${this.escapeHtml(webHref)}" target="_blank" rel="noopener">${this.escapeHtml(webRaw)}</a></p>`
      : '';

    // URL para Move Magnum
    const walletTransferUrl = window.BLOCKCHAIN_WALLET_URL || 'https://app.blockswine.com/transfer-keystore.html';

    // Resolver info de botella y fuentes de imagen
    const bottleInfo = this.resolveMagnumBottle(this.data, isWineLover);
    const { primarySrc, fallbackSrc } = this.getWineryImageSources(this.data);

    let cardBodyHtml = '';

    if (userType === 'bodega') {
      const denominacionesData = this.extractDenominacionesInfo(this.data);
      const dosHtml = this.createDosSection(denominacionesData);

      cardBodyHtml = `
        <div class="user-bottle-img-wrapper bodega-img-full"><img src="${primarySrc}" data-fallback-src="${fallbackSrc}" alt="Bottle or winery image" class="bottle-img-card" onclick="window.showZoomImage && window.showZoomImage(this.currentSrc || this.src)" data-fallback-bound="1"></div>
        <div class="winery-card-header">
          <h3 class="winery-card-name">${this.escapeHtml(nombre)}</h3>
          <span class="winery-role-badge">Winery</span>
        </div>
        <p class="winery-card-email">${this.escapeHtml(email)}</p>
        <div class="winery-card-info">
          <div class="winery-info-row">
            <span class="winery-info-label">Location:</span>
            <span class="winery-info-value">${this.escapeHtml(location)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Subscription:</span>
            <span class="winery-info-value">${this.escapeHtml(subscription)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Member Since:</span>
            <span class="winery-info-value">${this.escapeHtml(memberSince)}</span>
          </div>
        </div>
        <div class="winery-card-categories">
          ${categoriesHtml}
        </div>
        <div class="winery-card-badges">
          ${badgesHtml}
        </div>
        ${dosHtml}
        <div class="wallets-section">
          ${wallets}
        </div>
        <div class="winery-card-actions">
          <button class="winery-view-btn" onclick="window.location.href='/list-winery.html'">View Details</button>
        </div>
        <div class="footer-popup">
          <p class="footer-popup-item">Registrado: ${this.formatRegistroFecha()} - <span class="categoria-tag categoria-bodega">bodega</span></p>
          <p class="footer-popup-item"><strong>Email:</strong> ${this.escapeHtml(email)}</p>
          ${webField}
          ${blockchainStatus}
        </div>
      `;
    } else if (userType === 'winelover') {
      cardBodyHtml = `
        <div class="user-bottle-img-wrapper">
          <div class="user-bottle-stage">
            <div class="vintage-pill">${this.escapeHtml(bottleInfo.vintage)}</div>
            <div class="critic-pill">${this.escapeHtml(bottleInfo.critic)}</div>
            <div class="bottle-frame" onclick="window.showZoomImage && window.showZoomImage('${bottleInfo.imgUrl}')" title="Clic para ampliar botella Magnum">
              <img 
                src="${bottleInfo.imgUrl}" 
                data-fallback-src="/images/Icono-Magnum.png"
                alt="${this.escapeHtml(bottleInfo.wineTitle)}" 
                class="user-magnum-img bottle-img-card" 
                onerror="this.onerror=null;this.src='/images/bottel-magnum-transparent.png';" 
              />
            </div>
            <div class="bottle-meta-badge">🍷 ${this.escapeHtml(bottleInfo.winery)} · ${this.escapeHtml(bottleInfo.doOrigin)}</div>
          </div>
        </div>
        <div class="winery-card-header">
          <h3 class="winery-card-name">${this.escapeHtml(nombre)}</h3>
          <span class="winery-role-badge">Wine Lover</span>
        </div>
        <p class="winery-card-email">${this.escapeHtml(email)}</p>
        <div class="custody-indicator">
          <span class="custody-dot"></span> Custodia Activa Magnum 1.5L
        </div>
        <div class="wine-title-sub">${this.escapeHtml(bottleInfo.wineTitle)}</div>
        <div class="winery-card-info">
          <div class="winery-info-row">
            <span class="winery-info-label">Location:</span>
            <span class="winery-info-value">${this.escapeHtml(location)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Subscription:</span>
            <span class="winery-info-value">${this.escapeHtml(subscription)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Member Since:</span>
            <span class="winery-info-value">${this.escapeHtml(memberSince)}</span>
          </div>
        </div>
        <div class="winery-card-categories">
          ${categoriesHtml}
        </div>
        <div class="winery-card-badges">
          ${badgesHtml}
        </div>
        <div class="wallets-section">
          ${wallets}
        </div>
        <!-- Wallet UTXO UI (colapsable) -->
        <details class="wallet-utxo-details">
          <summary class="wallet-utxo-summary">Wallet Key &amp; UTXOs</summary>
          <div class="wallet-section">
            <div class="wallet-import-controls">
              <label for="wallet-file-${uniqueId}">Keystore (.json):</label>
              <div class="custom-file-input-wrapper">
                <input type="file" id="wallet-file-${uniqueId}" accept="application/json" style="display:none;">
                <button type="button" id="wallet-file-btn-${uniqueId}" class="wallet-btn">Select file</button>
                <span id="wallet-file-name-${uniqueId}" class="wallet-file-name"></span>
              </div>
              <div class="wallet-import-group" id="wallet-import-group-${uniqueId}">
                <label for="wallet-passphrase-${uniqueId}">Passphrase</label>
                <input type="password" id="wallet-passphrase-${uniqueId}" placeholder="Passphrase" class="wallet-input">
                <button id="wallet-import" class="wallet-btn">Import PublicKey</button>
              </div>
              <button id="wallet-reset" class="wallet-btn" style="display:none;">Change wallet</button>
              <span class="wallet-badge" id="wallet-badge" style="display:none;">Wallet loaded</span>
              <button id="wallet-history" class="wallet-btn" style="display:none;">History</button>
            </div>
            <div class="wallet-status" id="wallet-status"></div>
            <div class="wallet-balance-area">
              <strong>Balance:</strong> <span id="wallet-balance">0</span>
            </div>
            <div class="wallet-utxos-area">
              <strong>UTXOs:</strong>
              <div id="wallet-utxo-list"></div>
            </div>
          </div>
        </details>
        <div class="winery-card-actions">
          <button class="winery-view-btn move-btn-user-popup" onclick="window.open('${walletTransferUrl}','_blank','noopener,noreferrer')">Move Magnum</button>
        </div>
        <div class="user-card-social">
          <a href="https://x.com/" target="_blank" title="X" class="social-icon-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5f5f5" xmlns="http://www.w3.org/2000/svg"><path d="M17.53 7.477l-4.06 4.06 4.06 4.06-1.06 1.06-4.06-4.06-4.06 4.06-1.06-1.06 4.06-4.06-4.06-4.06 1.06-1.06 4.06 4.06 4.06-4.06z"/></svg>
          </a>
          <a href="https://instagram.com/" target="_blank" title="Instagram" class="social-icon-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#f5f5f5" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.567 5.783 2.295 7.149 2.233 8.415 2.175 8.795 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.613.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-7.613 0-5.923-.013-6.332-.072-7.613-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
          </a>
        </div>
        ${this.data.descripcion ? `<div class="user-card-description">${this.escapeHtml(this.data.descripcion)}</div>` : ''}
        <div class="footer-popup">
          <p class="footer-popup-item">Registrado: ${this.formatRegistroFecha()} - <span class="categoria-tag categoria-wine_lover">wine_lover</span></p>
          <p class="footer-popup-item"><strong>Email:</strong> ${this.escapeHtml(email)}</p>
          ${blockchainStatus}
        </div>
      `;
    } else {
      // Usuario general / Minero
      const roleBadge = this.resolveRoleBadge(this.data);
      cardBodyHtml = `
        <div class="user-profile-header">
          <img src="${primarySrc}" data-fallback-src="/images/Icono-Magnum.png" alt="Avatar" class="user-profile-avatar" onclick="window.showZoomImage && window.showZoomImage(this.currentSrc || this.src)" />
        </div>
        <div class="winery-card-header">
          <h3 class="winery-card-name">${this.escapeHtml(nombre)}</h3>
          <span class="winery-role-badge">${this.escapeHtml(roleBadge)}</span>
        </div>
        <p class="winery-card-email">${this.escapeHtml(email)}</p>
        <div class="winery-card-info">
          <div class="winery-info-row">
            <span class="winery-info-label">Location:</span>
            <span class="winery-info-value">${this.escapeHtml(location)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Subscription:</span>
            <span class="winery-info-value">${this.escapeHtml(subscription)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Member Since:</span>
            <span class="winery-info-value">${this.escapeHtml(memberSince)}</span>
          </div>
        </div>
        <div class="winery-card-categories">
          ${categoriesHtml}
        </div>
        <div class="winery-card-badges">
          ${badgesHtml}
        </div>
        <div class="wallets-section">
          ${wallets}
        </div>
        <div class="winery-card-actions">
          <button class="winery-view-btn" onclick="window.open('${walletTransferUrl}','_blank','noopener,noreferrer')">Open Wallet</button>
        </div>
        <div class="footer-popup">
          <p class="footer-popup-item">Registrado: ${this.formatRegistroFecha()} - ${categoriesHtml}</p>
          <p class="footer-popup-item"><strong>Email:</strong> ${this.escapeHtml(email)}</p>
          ${blockchainStatus}
        </div>
      `;
    }

    const popupContent = `
      <div class="user-popup winery-card" data-user-type="${userType}" data-user-id="${uniqueId}" data-user-img="${primarySrc}" data-img-bottle="${bottleInfo.imgUrl}">
        ${cardBodyHtml}
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 370,
      minWidth: 270,
      className: 'peer-leaflet-popup user-custom-popup',
    });

    const self = this;
    this.marker.on('popupopen', function(e) {
      setTimeout(() => {
        const popupElement = e?.popup?._container || document.querySelector('.peer-leaflet-popup');
        if (popupElement) {
          self.attachImageFallbackHandlers(popupElement);
        }

        const id = this._userUniqueId;
        const fileInput = document.getElementById('wallet-file-' + id);
        const fileBtn = document.getElementById('wallet-file-btn-' + id);
        const fileNameSpan = document.getElementById('wallet-file-name-' + id);
        if (fileBtn && fileInput) {
          fileBtn.onclick = () => {
            fileInput.click();
          };
          fileInput.onchange = () => {
            if (fileNameSpan) {
              fileNameSpan.textContent = fileInput.files.length ? fileInput.files[0].name : 'Ningún archivo seleccionado';
            }
          };
        }

        // Lógica para ocultar campos de passphrase/import si la wallet está cargada
        const importGroup = document.getElementById('wallet-import-group-' + id);
        const walletStatus = document.getElementById('wallet-status');
        function updateImportGroupVisibility() {
          if (walletStatus && /wallet\s*cargada/i.test(walletStatus.textContent) && importGroup) {
            importGroup.style.display = 'none';
          } else if (importGroup) {
            importGroup.style.display = '';
          }
        }
        updateImportGroupVisibility();
        if (walletStatus && typeof MutationObserver !== 'undefined') {
          const observer = new MutationObserver(() => {
            updateImportGroupVisibility();
          });
          observer.observe(walletStatus, { childList: true, subtree: true, characterData: true });
        }

        // Centrar verticalmente la popup en la vista
        try {
          const map = e.target._map;
          const popup = map._popup;
          if (popup && popup._container) {
            const popupRect = popup._container.getBoundingClientRect();
            const mapRect = map.getContainer().getBoundingClientRect();
            const popupCenterY = popupRect.top + popupRect.height / 2;
            const mapCenterY = mapRect.top + mapRect.height / 2;
            const offsetY = popupCenterY - mapCenterY;
            if (Math.abs(offsetY) > 10) {
              map.panBy([0, offsetY], { animate: true });
            }
          }
        } catch (err) {
          console.warn('[UserMarker][popupopen] Error centrando popup:', err);
        }
      }, 80);
    });

    // Inyectar función global para obtener balance si no existe
    if (!window.getWalletBalance) {
      window.getWalletBalance = function(address, btn) {
        if (!address) {
          console.warn('[Balance] No address provided');
          return;
        }
        console.log('[Balance] btn recibido:', btn);
        const resultDiv = btn.nextElementSibling;
        console.log('[Balance] resultDiv (nextElementSibling):', resultDiv);
        
        if (resultDiv) {
          resultDiv.textContent = 'Consultando...';
          console.log('[Balance] Texto inicial establecido: "Consultando..."');
        } else {
          console.error('[Balance] ❌ No se encontró resultDiv (nextElementSibling del botón)');
        }
        console.log('[Balance] Solicitando resumen UTXO para address:', address);
          fetch(`/api/wallet/${encodeURIComponent(address)}/utxo-summary`)
            .then(res => {
              console.log('[Balance] Respuesta fetch:', res);
              return res.text();
            })
            .then(text => {
              console.log('[Balance] Texto bruto de respuesta:', text);
              if (!text || text.trim() === '') {
                resultDiv.textContent = 'Respuesta vacía del backend';
                console.warn('[Balance] El backend respondió vacío');
                return;
              }
              let data;
              try {
                data = JSON.parse(text);
              } catch (e) {
                console.error('[Balance] Error al parsear JSON:', e, text);
                resultDiv.textContent = 'Error al obtener balance';
                resultDiv.style.color = '#a22';
                return;
              }
              console.log('[Balance] Respuesta JSON:', data);
              console.log('[Balance] resultDiv existe:', !!resultDiv);
              console.log('[Balance] resultDiv element:', resultDiv);
              
              if (resultDiv) {
                console.log('[Balance] Validando datos...');
                console.log('[Balance] - data existe:', !!data);
                console.log('[Balance] - data.success:', data?.success);
                console.log('[Balance] - data.data existe:', !!data?.data);
                console.log('[Balance] - data.data.utxosDisponibles:', data?.data?.utxosDisponibles);
                console.log('[Balance] - data.data.balanceDisponible:', data?.data?.balanceDisponible);
                
                if (data && data.success && data.data && typeof data.data.utxosDisponibles !== 'undefined') {
                  const utxosCount = Number(data.data.utxosDisponibles || 0);
                  const balance = Number(data.data.balanceDisponible || 0);
                  const displayValue = `${utxosCount} Magnums · ${balance} Balance`;
                  console.log('[Balance] ✅ Actualizando DOM con resumen:', displayValue);
                  resultDiv.textContent = displayValue;
                  resultDiv.style.color = '#222';
                  console.log('[Balance] ✅ DOM actualizado. Nuevo texto:', resultDiv.textContent);
                } else {
                  console.warn('[Balance] ⚠️ Condición fallida, mostrando "Resumen no disponible"');
                  resultDiv.textContent = 'Resumen no disponible';
                  resultDiv.style.color = '#a22';
                }
              } else {
                console.error('[Balance] ❌ resultDiv no encontrado en el DOM');
              }
            })
            .catch((err) => {
              console.error('[Balance] Error en fetch:', err);
              if (resultDiv) {
                resultDiv.textContent = 'Error';
                resultDiv.style.color = '#a22';
              }
            });
      };
    }
  }

  resolveImageSrc(rawValue) {
    const fallback = '/images/Icono-Magnum.png';
    if (typeof rawValue !== 'string') {
      return fallback;
    }

    let candidate = rawValue.trim();
    if (!candidate) {
      return fallback;
    }

    // Algunos registros vienen como etiqueta HTML completa en vez de URL directa.
    const fromHtml = this.extractSrcFromImgTag(candidate);
    if (fromHtml) {
      candidate = fromHtml;
    }

    // Normalizar prefijos de carpeta public/ para que resuelvan desde la raíz servida por Vite/Express
    candidate = candidate.replace(/^\/public\//, '/');

    if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
      return candidate;
    }

    try {
      const decoded = decodeURI(candidate);
      return encodeURI(decoded.normalize('NFC'));
    } catch (err) {
      return candidate.normalize('NFC');
    }
  }

  extractSrcFromImgTag(rawValue) {
    if (typeof rawValue !== 'string') {
      return '';
    }

    const match = rawValue.match(/<img[^>]*\ssrc\s*=\s*["']([^"']+)["']/i);
    return match && match[1] ? match[1].trim() : '';
  }

  /**
   * Resuelve la imagen de bodega con URL externa/local o fallback a Icono-Magnum
   */
  resolveBodegaImage(data = {}) {
    return this.getWineryImageSources(data).primarySrc;
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  resolveLocation(data = this.data) {
    if (data.location && typeof data.location === 'string') return data.location;
    if (data.localizacion_direccion && typeof data.localizacion_direccion === 'string') return data.localizacion_direccion;
    if (data.localizacion && typeof data.localizacion.direccion === 'string') return data.localizacion.direccion;
    if (data.ciudad && typeof data.ciudad === 'string') return data.ciudad;
    if (data.municipio && typeof data.municipio === 'string') return data.municipio;
    if (data.poblacion && typeof data.poblacion === 'string') return data.poblacion;
    if (data.ubicacion && typeof data.ubicacion === 'string') {
      const parts = data.ubicacion.split('-');
      return parts[parts.length - 1].trim();
    }
    const text = `${data.nombre || ''} ${data.email || ''}`.toLowerCase();
    if (text.includes('fya')) return 'Navarrete';
    if (text.includes('traslascuestas')) return 'Valcavado de Roa';
    if (text.includes('pierola') || text.includes('piérola')) return 'Moreda de Álava';

    if (data.localizacion && data.localizacion.lat && data.localizacion.lng) {
      return `${Number(data.localizacion.lat).toFixed(2)}, ${Number(data.localizacion.lng).toFixed(2)}`;
    }
    return 'Navarrete';
  }

  resolveSubscription(data = this.data) {
    const raw = data.subscription_status || data.subscriptionStatus || data.suscripcion;
    if (!raw) return 'Inactive';
    const norm = String(raw).trim().toLowerCase();
    if (norm === 'active' || norm === 'activa') return 'Active';
    if (norm === 'inactive' || norm === 'inactiva') return 'Inactive';
    if (norm === 'pending' || norm === 'pendiente') return 'Pending';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  resolveMemberSince(data = this.data) {
    const rawDate = data.fecha_registro || data.fechaRegistro || data.created_at || data.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        return String(d.getFullYear());
      }
    }
    return '2026';
  }

  resolveRoleBadge(data = this.data) {
    if (data.role === 'winery' || (Array.isArray(data.categorias) && data.categorias.includes('bodega'))) {
      return 'Winery';
    }
    if (data.role === 'wine_lover' || (Array.isArray(data.categorias) && data.categorias.includes('wine_lover'))) {
      return 'Wine Lover';
    }
    if (data.role === 'minero' || (Array.isArray(data.categorias) && data.categorias.includes('minero'))) {
      return 'Miner';
    }
    return 'User';
  }

  getBadgeLabel(badge) {
    const labels = {
      crianza_joven: 'Crianza Joven',
      crianza_crianza: 'Crianza',
      crianza_reserva: 'Reserva',
      crianza_gran_reserva: 'Gran Reserva',
      cert_ecologico: 'Cert Ecologico',
      cert_biodinamico: 'Cert Biodinamico',
      cert_vegano: 'Cert Vegano',
      cert_sin_sulfitos: 'Cert Sin Sulfitos',
      premiada: 'Premiada',
      medalla_oro: 'Medalla Oro',
      medalla_plata: 'Medalla Plata',
      medalla_bronce: 'Medalla Bronce',
    };
    return labels[badge] || badge;
  }

  getWineryImageSources(winery = this.data) {
    const imageFromProfile = winery?.userCard?.img || winery?.usercard_img;
    const imageFromBottle = winery?.img_bottle || winery?.imgBottle || winery?.['img-bottle'] || winery?.img;
    const defaultImage = '/images/Icono-Magnum.png';

    const profileValue = typeof imageFromProfile === 'string' ? imageFromProfile.trim() : '';
    const bottleValue = typeof imageFromBottle === 'string' ? imageFromBottle.trim() : '';
    const profileLooksLocal = profileValue.startsWith('/images/');
    const bottleLooksRemote = /^https?:\/\//i.test(bottleValue);

    let explicitSrc = '';
    if (profileLooksLocal && bottleLooksRemote) {
      explicitSrc = bottleValue;
    } else {
      explicitSrc = profileValue || bottleValue;
    }

    if (explicitSrc && !explicitSrc.includes('default-bottle.png')) {
      const primarySrc = this.resolveImageSrc(explicitSrc);
      const fallbackSrc =
        bottleValue && bottleValue !== primarySrc && !bottleValue.includes('default-bottle.png')
          ? this.resolveImageSrc(bottleValue)
          : defaultImage;

      return { primarySrc, fallbackSrc };
    }

    // Resolutor semántico por nombre/email de la bodega (concordancia con magnumslocal)
    const nameOrEmail = `${winery?.nombre || ''} ${winery?.email || ''} ${winery?.winery || ''}`.toLowerCase();
    if (nameOrEmail.includes('traslascuestas')) {
      return {
        primarySrc: 'https://www.terranostrum.es/images/content/full/Bodega-traslascuestas-1.jpg',
        fallbackSrc: defaultImage
      };
    }
    if (nameOrEmail.includes('pierola') || nameOrEmail.includes('piérola')) {
      return {
        primarySrc: 'https://pierola.com/wp-content/uploads/2022/03/Bodegas-Pie%CC%81rola-exterior-1536x539.jpg',
        fallbackSrc: defaultImage
      };
    }
    if (nameOrEmail.includes('fya')) {
      return {
        primarySrc: '/images/FyA-bodega.jpg',
        fallbackSrc: defaultImage
      };
    }

    return { primarySrc: defaultImage, fallbackSrc: defaultImage };
  }

  attachImageFallbackHandlers(rootElement) {
    if (!rootElement) return;

    rootElement.querySelectorAll('img[data-fallback-src]').forEach((img) => {
      if (img.dataset.fallbackBound === '1') return;
      img.dataset.fallbackBound = '1';

      img.addEventListener('error', () => {
        const fallbackSrc = img.dataset.fallbackSrc || '/images/Icono-Magnum.png';
        const currentSrc = img.getAttribute('src') || '';

        if (currentSrc === fallbackSrc && fallbackSrc === '/images/Icono-Magnum.png') {
          return;
        }

        img.setAttribute('src', fallbackSrc);
        img.dataset.fallbackSrc = '/images/Icono-Magnum.png';
      });
    });
  }

  extractDenominacionesInfo(winery = this.data) {
    const result = {
      dos: [],
      variedades: new Set(),
      tipos: new Set()
    };

    if (Array.isArray(winery?.denominaciones) && winery.denominaciones.length > 0) {
      winery.denominaciones.forEach(do_ => {
        result.dos.push({
          id: do_.id,
          nombre: do_.nombre,
          tipo: do_.tipo || 'DO'
        });

        if (do_.variedades && Array.isArray(do_.variedades)) {
          do_.variedades.forEach(v => result.variedades.add(v.nombre));
        }

        if (do_.tipos_vino && Array.isArray(do_.tipos_vino)) {
          do_.tipos_vino.forEach(t => result.tipos.add(t.nombre));
        }
      });
    }

    // Direct / fallback properties
    if (result.dos.length === 0) {
      const explicitDo = winery?.denominacion || winery?.denominacionOrigen || winery?.denominacion_origen || winery?.region;
      if (explicitDo) {
        result.dos.push({ id: 'do_main', nombre: explicitDo, tipo: '' });
      }
    }

    if (result.variedades.size === 0) {
      const vars = winery?.variedadesPrincipales || winery?.variedades || winery?.variedades_principales;
      if (Array.isArray(vars)) {
        vars.forEach(v => result.variedades.add(v));
      } else if (typeof vars === 'string' && vars.trim()) {
        vars.split(',').forEach(v => result.variedades.add(v.trim()));
      }
    }

    if (result.tipos.size === 0) {
      const tipos = winery?.tiposVino || winery?.tipos_vino || winery?.tipos;
      if (Array.isArray(tipos)) {
        tipos.forEach(t => result.tipos.add(t));
      } else if (typeof tipos === 'string' && tipos.trim()) {
        tipos.split(',').forEach(t => result.tipos.add(t.trim()));
      }
    }

    // Known bodegas semantic catalog
    const text = `${winery?.nombre || ''} ${winery?.email || ''}`.toLowerCase();
    if (text.includes('fya')) {
      if (result.dos.length === 0) result.dos.push({ id: 'doca_rioja', nombre: 'DOCa Rioja', tipo: '' });
      if (result.variedades.size === 0) {
        result.variedades.add('Tempranillo');
        result.variedades.add('Garnacha');
      }
      if (result.tipos.size === 0) {
        result.tipos.add('Blanco');
        result.tipos.add('Gran Reserva');
        result.tipos.add('Reserva');
      }
    } else if (text.includes('pierola') || text.includes('piérola')) {
      if (result.dos.length === 0) result.dos.push({ id: 'doca_rioja', nombre: 'DOCa Rioja', tipo: '' });
      if (result.variedades.size === 0) {
        result.variedades.add('Tempranillo');
      }
      if (result.tipos.size === 0) {
        result.tipos.add('Tinto');
        result.tipos.add('Crianza');
        result.tipos.add('Reserva');
      }
    } else if (text.includes('traslascuestas')) {
      if (result.dos.length === 0) result.dos.push({ id: 'do_ribera', nombre: 'DO Ribera del Duero', tipo: '' });
      if (result.variedades.size === 0) {
        result.variedades.add('Tinta del País');
        result.variedades.add('Tempranillo');
      }
      if (result.tipos.size === 0) {
        result.tipos.add('Tinto');
        result.tipos.add('Roble');
      }
    }

    result.variedades = Array.from(result.variedades);
    result.tipos = Array.from(result.tipos);

    return result;
  }

  createDosSection(data) {
    if (data.dos.length === 0 && data.variedades.length === 0 && data.tipos.length === 0) {
      return '';
    }

    let html = '<div class="winery-card-dos">';

    if (data.dos.length > 0) {
      html += '<div class="winery-dos-section">';
      html += '<span class="winery-dos-label">🏅 DO:</span> ';
      html += data.dos.slice(0, 2).map(do_ => 
        `<span class="winery-do-tag">${this.escapeHtml((do_.tipo ? do_.tipo + ' ' : '') + do_.nombre)}</span>`
      ).join('');
      if (data.dos.length > 2) {
        html += `<span class="winery-more-tag">+${data.dos.length - 2}</span>`;
      }
      html += '</div>';
    }

    if (data.variedades.length > 0) {
      html += '<div class="winery-variedades-section">';
      html += '<span class="winery-dos-label">🍇 Grapes:</span> ';
      html += data.variedades.slice(0, 3).map(v => 
        `<span class="winery-variedad-tag">${this.escapeHtml(v)}</span>`
      ).join('');
      if (data.variedades.length > 3) {
        html += `<span class="winery-more-tag">+${data.variedades.length - 3}</span>`;
      }
      html += '</div>';
    }

    if (data.tipos.length > 0) {
      html += '<div class="winery-tipos-section">';
      html += '<span class="winery-dos-label">🍷 Types:</span> ';
      html += data.tipos.slice(0, 3).map(t => 
        `<span class="winery-tipo-tag">${this.escapeHtml(t)}</span>`
      ).join('');
      if (data.tipos.length > 3) {
        html += `<span class="winery-more-tag">+${data.tipos.length - 3}</span>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }


  /**
   * Resuelve el asset óptimo y metadatos de la botella Magnum (Cascade Asset Resolver)
   * Cascada:
   * 1. URL explícita (siempre que no sea la foto obsoleta 20220704_174927.jpg)
   * 2. ID directo de botella (magnum-042 -> Vitium, magnum-088 -> Valcavado)
   * 3. Mapeo semántico por bodega/vino
   * 4. Asignación determinista por ID de usuario para muestra en catálogo
   * 5. Fallback a silueta oficial de Magnum transparente
   */
  resolveMagnumBottle(data = {}, isWineLover = false) {
    // 1. Imagen explícita personalizada
    const explicit = (data.userCard && data.userCard.img) ||
      data.usercard_img ||
      data.img_bottle ||
      data.imgBottle ||
      data['img-bottle'] ||
      data.img ||
      data.imagen;

    if (explicit && typeof explicit === 'string' && explicit.trim() !== '' && !explicit.includes('20220704_174927')) {
      const resolvedSrc = this.resolveImageSrc(explicit.trim());
      return {
        imgUrl: resolvedSrc,
        wineTitle: data.nombreVino || data.vino || 'Magnum Fine Wine',
        winery: data.bodega || 'BlocksWine Reserve',
        vintage: data.anada ? String(data.anada) : 'Vintage Selection',
        critic: '★ 95+ Points',
        doOrigin: data.denominacion || data.doOrigin || 'Denominación de Origen'
      };
    }

    // Catálogo estándar de botellas Magnum tokenizadas
    const catalog = {
      'magnum-042': {
        imgUrl: '/images/bottles/magnum-042.png',
        wineTitle: 'VITIUM · Selección Familiar',
        winery: 'Fernández de Piérola',
        vintage: '2018',
        critic: '★ 95 Parker',
        doOrigin: 'DOCa Rioja'
      },
      'magnum-088': {
        imgUrl: '/images/bottles/magnum-088.png',
        wineTitle: 'VALCAVADO · Edición Limitada',
        winery: 'Traslascuestas',
        vintage: '2019',
        critic: '★ 96 Peñín',
        doOrigin: 'DO Ribera del Duero'
      }
    };

    // 2. Por ID de botella
    const rawBottleId = data.bottleId || data.bottle_id || data.id_bottle || (data.botella && data.botella.id);
    if (rawBottleId) {
      const cleanId = String(rawBottleId).trim().toLowerCase();
      if (cleanId === 'magnum-042' || cleanId === '042') return catalog['magnum-042'];
      if (cleanId === 'magnum-088' || cleanId === '088') return catalog['magnum-088'];
      return {
        imgUrl: `/images/bottles/${cleanId}.png`,
        wineTitle: data.nombreVino || 'Magnum Collector Edition',
        winery: data.bodega || 'BlocksWine Reserve',
        vintage: data.anada ? String(data.anada) : '2026',
        critic: '★ 95+ Points',
        doOrigin: data.denominacion || 'Denominación de Origen'
      };
    }

    // 3. Mapeo semántico por bodega/vino
    const textBlob = `${data.nombre || ''} ${data.descripcion || ''} ${data.bodega || ''} ${data.vino || ''}`.toLowerCase();
    if (textBlob.includes('piérola') || textBlob.includes('pierola') || textBlob.includes('vitium')) {
      return catalog['magnum-042'];
    }
    if (textBlob.includes('traslascuestas') || textBlob.includes('valcavado')) {
      return catalog['magnum-088'];
    }

    // 4. Si es wine_lover sin botella fija: asignar deterministamente por ID
    if (isWineLover) {
      const seed = String(data.id || data.email || data.nombre || '0');
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash |= 0;
      }
      return (Math.abs(hash) % 2 === 0) ? catalog['magnum-042'] : catalog['magnum-088'];
    }

    // 5. Fallback general elegante
    return {
      imgUrl: '/images/bottel-magnum-transparent.png',
      wineTitle: 'Magnum Fine Wine',
      winery: 'BlocksWine Protocol',
      vintage: '2026',
      critic: '★ Verified Custody',
      doOrigin: 'BlocksWine Origin'
    };
  }

  formatRegistroFecha() {
    const rawFecha = this.data.fechaRegistro || this.data.fecha_registro || this.data.created_at || this.data.createdAt;
    if (!rawFecha) {
      return '12/2/2026';
    }

    const parsed = new Date(rawFecha);
    if (Number.isNaN(parsed.getTime())) {
      return '12/2/2026';
    }

    return parsed.toLocaleDateString('es-ES');
  }

  updateData(newData) {
    this.data = { ...this.data, ...newData };
    // Actualizar icono si cambió categoría
    const newIcon = this.createIcon();
    this.marker.setIcon(newIcon);
    // Actualizar popup
    this.attachPopup();
  }

  show() {
    if (this.marker && !this.map.hasLayer(this.marker)) {
      this.marker.addTo(this.map);
    }
  }

  hide() {
    if (this.marker && this.map.hasLayer(this.marker)) {
      this.map.removeLayer(this.marker);
    }
  }

  remove() {
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
  }

  getPosition() {
    return this.marker ? this.marker.getLatLng() : null;
  }

  openPopup() {
    if (this.marker) {
      this.marker.openPopup();
    }
  }
}

// Exponer globalmente
window.UserMarker = UserMarker;