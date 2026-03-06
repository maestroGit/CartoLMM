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
        // Inyectar CSS para ajustar el fondo blanco del wrapper en modo claro y evitar el saliente
        if (!document.getElementById('user-popup-media-style')) {
          const style = document.createElement('style');
          style.id = 'user-popup-media-style';
          style.innerHTML = `
            @media (prefers-color-scheme: light) {
              .peer-leaflet-popup .leaflet-popup-content-wrapper {
                background: rgba(255,255,255,0.95) !important;
                color: #1F2937;
                max-width: 370px !important;
                min-width: 270px !important;
                width: 370px !important;
                box-sizing: border-box;
                padding: 0 !important;
              }
            }
          `;
          document.head.appendChild(style);
        }
    const roleCategory = this.data.role === 'winery'
      ? 'bodega'
      : ((this.data.role === 'wine_lover' || this.data.role === 'user') ? 'wine_lover' : null);
    const categoriasList = Array.isArray(this.data.categorias) && this.data.categorias.length > 0
      ? this.data.categorias
      : (roleCategory ? [roleCategory] : []);
    const categorias = categoriasList
      .map(cat => `<span class="categoria-tag categoria-${cat}">${cat}</span>`)
      .join(' ');

    const wallets = this.data.wallets && this.data.wallets.length > 0
      ? this.data.wallets.map((w, idx) => `
          <div class="wallet-item" style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            <code style="word-break:break-all;white-space:pre-wrap;user-select:all;margin-bottom:0;">${w.address}</code>
            <div style="display:flex;align-items:center;gap:6px;">
              <button class="balance-btn-user-popup" onclick="window.getWalletBalance && window.getWalletBalance('${w.address}', this)">Magnums</button>
              <div class="wallet-balance-result" id="wallet-balance-result-${this.data.id || idx}"></div>
            </div>
          </div>
        `).join('')
      : '<p style="color: #999;">Sin wallets registradas</p>';

    const blockchainStatus = this.data.blockchainActive
      ? '<div class="blockchain-status active">🟢 Blockchain activa</div>'
      : '<div class="blockchain-status inactive">⚪ Sin blockchain</div>';

    const webField = this.data.web
      ? `<p><strong>Web:</strong> <a href="https://${this.data.web}" target="_blank" rel="noopener">${this.data.web}</a></p>`
      : '';

    // Imagen: para winelover sin imagen personalizada, usar imagen fija por defecto
    let imagenSrc = '';
    const isWineLover = categoriasList && categoriasList.includes('wine_lover');
    if (this.data.userCard && this.data.userCard.img && this.data.userCard.img.trim() !== '') {
      imagenSrc = this.data.userCard.img;
    } else if (this.data.usercard_img && this.data.usercard_img.trim() !== '') {
      imagenSrc = this.data.usercard_img;
    } else if (this.data.img_bottle && this.data.img_bottle.trim() !== '') {
      imagenSrc = this.data.img_bottle;
    } else if (this.data.imgBottle && this.data.imgBottle.trim() !== '') {
      imagenSrc = this.data.imgBottle;
    } else if (this.data['img-bottle'] && this.data['img-bottle'].trim() !== '') {
      imagenSrc = this.data['img-bottle'];
    } else if (this.data.img && this.data.img.trim() !== '') {
      imagenSrc = this.data.img;
    } else if (isWineLover) {
      imagenSrc = '/public/images/20220704_174927.jpg';
    } else {
      imagenSrc = '/images/iconoBWred.png';
    }
    const finalImgSrc = this.resolveImageSrc(imagenSrc);
    // Botón Move

    // Imagen con zoom interactivo y botón Move solo para wine_lover
    const moveBtn = `<div style=\"width:100%;display:flex;justify-content:center;\"><button class=\"move-btn-user-popup\" onclick=\"window.open('http://localhost:3000/demo-wallet/web-demo.html','_blank')\">Move</button></div>`;
    // Para bodega: solo imagen, contenedor ancho
      const imagenDivBodega = `<div class="user-bottle-img-wrapper bodega-img-full"><img src="${finalImgSrc}" alt="Imagen botella o icono" referrerpolicy="no-referrer" style="max-height:320px;object-fit:contain;border-radius:12px;box-shadow:0 4px 24px #0003;background:#2B0F13;" onclick="window.showZoomImage && window.showZoomImage(this.getAttribute('src'))" onerror="this.onerror=null;this.src='/images/default-bottle.png';"></div>`;
    // Para wine_lover: imagen + botón Move
    const imagenDivWineLover = `<div class=\"user-bottle-img-wrapper\"><img src=\"${finalImgSrc}\" alt=\"Imagen botella o icono\" referrerpolicy=\"no-referrer\" onclick=\"window.showZoomImage && window.showZoomImage(this.getAttribute('src'))\" onerror=\"this.onerror=null;this.src='/images/default-bottle.png';\">${moveBtn}</div>`;
    // Para usuarios generales (role=user): mostrar avatar/foto de perfil
    const imagenDivUsuario = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:10px 0 4px 0;">
        <img
          src="${finalImgSrc}"
          alt="Foto de ${this.data.nombre || 'usuario'}"
          style="width:88px;height:88px;border-radius:50%;object-fit:cover;border:2px solid #f7931a;box-shadow:0 2px 10px #0004;cursor:pointer;"
          referrerpolicy="no-referrer"
          onclick="window.showZoomImage && window.showZoomImage(this.getAttribute('src'))"
          onerror="this.onerror=null;this.src='/images/default-bottle.png';"
        >
        <div style="font-weight:600;color:#f5f5f5;text-align:center;">${this.data.nombre || 'Usuario'}</div>
      </div>
    `;

        const userType = categoriasList.includes('wine_lover')
          ? 'winelover'
          : (categoriasList.includes('bodega') ? 'bodega' : 'otro');
        const uniqueId = this.data.id || userType;
    const userCard = (userType === 'winelover' && finalImgSrc && this.data.nombre) ? `
      <div class="user-card">
        <div class="user-card-img-wrapper">
          <img src="${finalImgSrc}" alt="${this.data.nombre}" class="user-card-img" />
        </div>
        <div class="user-popup-nombre">${this.data.nombre}</div>
        <div class="user-card-social">
          <a href="https://x.com/" target="_blank" title="X" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fffefe" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M17.53 7.477l-4.06 4.06 4.06 4.06-1.06 1.06-4.06-4.06-4.06 4.06-1.06-1.06 4.06-4.06-4.06-4.06 1.06-1.06 4.06 4.06 4.06-4.06z"/></svg>
          </a>
          <a href="https://instagram.com/" target="_blank" title="Instagram" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fefefe" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.567 5.783 2.295 7.149 2.233 8.415 2.175 8.795 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.613.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-7.613 0-5.923-.013-6.332-.072-7.613-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
          </a>
          <a href="https://youtube.com/" target="_blank" title="YouTube" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fefefe" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a2.998 2.998 0 0 0-2.115-2.115C19.633 3.5 12 3.5 12 3.5s-7.633 0-9.383.571a2.998 2.998 0 0 0-2.115 2.115C0 7.937 0 12 0 12s0 4.063.502 5.814a2.998 2.998 0 0 0 2.115 2.115C4.367 20.5 12 20.5 12 20.5s7.633 0 9.383-.571a2.998 2.998 0 0 0 2.115-2.115C24 16.063 24 12 24 12s0-4.063-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
                <div class="user-card-description">${this.data.descripcion || ''}
        </div>
        </div>
      </div>
    ` : '';
    const popupContent = `
      <div class="user-popup" data-user-type="${userType}" data-user-id="${uniqueId}" data-user-img="${finalImgSrc}" data-img-bottle="${this.data['img-bottle'] || ''}">
        ${userCard}
        ${userType === 'bodega' ? imagenDivBodega : ''}
        ${userType === 'otro' ? imagenDivUsuario : ''}
        ${userType === 'bodega' ? `<h3 class="bodega-img-title">${this.data.nombre}</h3>` : ''}
       
        <div class="wallets-section">
          ${wallets}
        </div>
        <!-- Wallet UTXO UI (colapsable) -->
        ${userType !== 'bodega' ? `
        <details style="margin:2px 0 0 0;">
          <summary style="cursor:pointer;font-weight:510;">Wallet</summary>
          <div class="wallet-section" style="width:100%;max-width:420px;margin:0 auto;">
            <div class="wallet-import-controls" style="display:flex;flex-direction:column;gap:8px;">
              <label for="wallet-file-${this.data.id || userType}" </label>
              <div class="custom-file-input-wrapper">
                <input type="file" id="wallet-file-${this.data.id || userType}" accept="application/json" style="display:none;">
                <button type="button" id="wallet-file-btn-${this.data.id || userType}" class="wallet-btn">Select file</button>
                <span id="wallet-file-name-${this.data.id || userType}" class="wallet-file-name" style="margin-left:10px;color:#FFA726;font-size:0.95em;"></span>
              </div>
              <div class="wallet-import-group" id="wallet-import-group-${this.data.id || userType}">
                <label for="wallet-passphrase-${this.data.id || userType}" style="font-weight:500;">Passphrase</label>
                <input type="password" id="wallet-passphrase-${this.data.id || userType}" placeholder="Passphrase" class="wallet-input">
                <button id="wallet-import" class="wallet-btn">Import PublicKey</button>
              </div>
              <button id="wallet-reset" class="wallet-btn" style="display:none;">Change wallet</button>
              <span class="wallet-badge" id="wallet-badge" style="display:none;">Wallet loaded</span>
              <button id="wallet-history" class="wallet-btn" style="display:none;">History</button>
            </div>
            <div class="wallet-status" id="wallet-status"></div>
            <div class="wallet-balance-area" style="margin-top:10px;">
              <strong>Balance:</strong> <span id="wallet-balance">0</span>
            </div>
            <div class="wallet-utxos-area" style="margin-top:10px;">
              <strong>UTXOs:</strong>
              <div id="wallet-utxo-list" style="margin-top:4px;"></div>
            </div>
          </div>
        </details>
        ` : ''}
        <!-- /Wallet UTXO UI -->
        <div class="footer-popup">
          <p class="footer-popup-item">Registrado: ${this.formatRegistroFecha()} - ${categorias}</p>
          <p class="footer-popup-item"><strong>Email:</strong> ${this.data.email}</p>
          ${userType === 'bodega' ? `<p class=\"footer-popup-item\"><strong>Web:</strong> <a href=\"https://${this.data.web}\" target=\"_blank\" rel=\"noopener\">${this.data.web}</a></p>` : ''}
          ${(userType === 'bodega' || userType === 'winelover') && this.data.blockchainActive ? `<p class=\"footer-popup-item\">🟢 Blockchain activa</p>` : ''}
        </div>
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 370,
      minWidth: 270,
      className: 'peer-leaflet-popup user-custom-popup',
    });
    // Inyectar CSS para forzar el ancho de todos los popups y reducir espacio entre wallet y descripción
    if (!document.getElementById('user-popup-width-style')) {
      const style = document.createElement('style');
      style.id = 'user-popup-width-style';
      style.innerHTML = `
        .leaflet-popup-content {
          max-width: 370px !important;
          min-width: 270px !important;
          width: 370px !important;
          box-sizing: border-box !important;
          overflow-x: hidden !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .user-popup {
          width: 370px !important;
          max-width: 370px !important;
          min-width: 270px !important;
          box-sizing: border-box !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow-x: hidden !important;
        }
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        .peer-leaflet-popup .leaflet-popup-content-wrapper {
          width: 370px !important;
          max-width: 370px !important;
          min-width: 270px !important;
          padding: 0 !important;
        }
        .wallet-item code {
          word-break: break-all;
          white-space: normal !important;
          overflow-x: auto;
          width: 100%;
          max-width: 100%;
          display: block;
          margin-bottom: 0 !important;
          box-sizing: border-box;
        }
        .user-card-description {
          margin-top: 6px !important;
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }
        .wallet-item {
          margin-bottom: 2px !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Inyectar CSS para ajustar el ancho del popup al de .user-popup
    if (!document.getElementById('user-popup-width-style')) {
      const style = document.createElement('style');
      style.id = 'user-popup-width-style';
      style.innerHTML = `
        .leaflet-popup-content .user-popup {
          max-width: 370px !important;
          min-width: 270px !important;
          width: 370px !important;
          box-sizing: border-box;
        }
        .leaflet-popup-content-wrapper.peer-leaflet-popup.user-custom-popup {
          padding: 0;
        }
      `;
      document.head.appendChild(style);
    }
    // File input custom trigger logic: usar evento popupopen para asegurar funcionalidad
    this.marker.on('popupopen', function(e) {
      setTimeout(() => {
        // Usar el id guardado en el marcador
        const id = this._userUniqueId;
        console.log('[UserMarker][popupopen] id usado:', id);
        const fileInput = document.getElementById('wallet-file-' + id);
        const fileBtn = document.getElementById('wallet-file-btn-' + id);
        const fileNameSpan = document.getElementById('wallet-file-name-' + id);
        console.log('[UserMarker][popupopen] fileInput:', fileInput, 'fileBtn:', fileBtn, 'fileNameSpan:', fileNameSpan);
        if (fileBtn && fileInput) {
          fileBtn.onclick = () => {
            console.log('[UserMarker][popupopen] fileBtn click');
            fileInput.click();
          };
          fileInput.onchange = () => {
            fileNameSpan.textContent = fileInput.files.length ? fileInput.files[0].name : 'Ningún archivo seleccionado';
            console.log('[UserMarker][popupopen] file selected:', fileInput.files[0]);
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
        // Observar cambios en el wallet-status
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
            // Diferencia entre el centro de la popup y el centro del mapa
            const popupCenterY = popupRect.top + popupRect.height / 2;
            const mapCenterY = mapRect.top + mapRect.height / 2;
            const offsetY = popupCenterY - mapCenterY;
            // Panear el mapa para centrar la popup verticalmente
            if (Math.abs(offsetY) > 10) {
              map.panBy([0, offsetY], {animate: true});
            }
          }
        } catch (err) {
          console.warn('[UserMarker][popupopen] Error centrando popup:', err);
        }
      }, 120);
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
                  const displayValue = `${utxosCount} UTXO${utxosCount === 1 ? '' : 's'} · ${balance} LMM`;
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
    const fallback = '/images/default-bottle.png';
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

  formatRegistroFecha() {
    const rawFecha = this.data.fechaRegistro || this.data.fecha_registro;
    if (!rawFecha) {
      return 'N/D';
    }

    const parsed = new Date(rawFecha);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/D';
    }

    return parsed.toLocaleDateString();
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