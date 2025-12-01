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
    const icon = this.createIcon();
    
    const uniqueId = this.data.id || (this.data.categorias && this.data.categorias.includes('wine_lover')
      ? 'winelover'
      : (this.data.categorias && this.data.categorias.includes('bodega')
        ? 'bodega'
        : 'otro'));
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
    console.log('[UserMarker] createIcon', this.data.categorias);
    const primaryCategory = this.data.categorias[0];
    const hasMultipleCategories = this.data.categorias.length > 1;

    // Emojis según categoría
    const iconMap = {
      bodega: '🍇',
      wine_lover: '🍷',
      minero: '⛏️',
      default: '👤'
    };

    const emoji = iconMap[primaryCategory] || iconMap.default;

    // Badge si tiene blockchain activo
    const blockchainBadge = this.data.blockchainActive 
      ? '<div class="user-blockchain-active"></div>' 
      : '';

    // Badge de múltiples categorías: si es minero, mostrar ⛏️
    let multiBadge = '';
    if (hasMultipleCategories && this.data.categorias.includes('minero')) {
      multiBadge = '<div class="user-multi-badge">⛏️</div>';
    }

    const html = `
      <div class="user-marker user-marker-${primaryCategory}">
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
    const categorias = this.data.categorias
      .map(cat => `<span class="categoria-tag categoria-${cat}">${cat}</span>`)
      .join(' ');

    const wallets = this.data.wallets && this.data.wallets.length > 0
      ? this.data.wallets.map((w, idx) => `
          <div class="wallet-item">
            <code style="word-break:break-all;white-space:pre-wrap;user-select:all;">${w.address}</code>
            <button class="balance-btn-user-popup" onclick="window.getWalletBalance && window.getWalletBalance('${w.address}', this)">Balance</button>
            <div class="wallet-balance-result" id="wallet-balance-result-${this.data.id || idx}"></div>
          </div>
        `).join('')
      : '<p style="color: #999;">Sin wallets registradas</p>';

    const blockchainStatus = this.data.blockchainActive
      ? '<div class="blockchain-status active">🟢 Blockchain activa</div>'
      : '<div class="blockchain-status inactive">⚪ Sin blockchain</div>';

    const webField = this.data.web
      ? `<p><strong>Web:</strong> <a href="https://${this.data.web}" target="_blank" rel="noopener">${this.data.web}</a></p>`
      : '';

    // Imagen: usar campo this.data.userCard.img si existe y no está vacío, si no usar iconoBWred.png o dejar en blanco
    let imagenSrc = '';
    if (this.data.userCard && this.data.userCard.img && this.data.userCard.img.trim() !== '') {
      imagenSrc = this.data.userCard.img;
    } else {
      imagenSrc = '/public/images/iconoBWred.png';
    }
    const isExternal = imagenSrc.startsWith('http://') || imagenSrc.startsWith('https://');
    const finalImgSrc = isExternal ? imagenSrc : imagenSrc;
    // Botón Move

    // Imagen con zoom interactivo y botón Move solo para wine_lover
    const moveBtn = `<div style=\"width:100%;display:flex;justify-content:center;\"><button class=\"move-btn-user-popup\" onclick=\"window.open('http://localhost:3000/demo-wallet/web-demo.html','_blank')\">Move</button></div>`;
    // Para bodega: solo imagen, contenedor ancho
      const imagenDivBodega = `<div class="user-bottle-img-wrapper bodega-img-full"><img src="${finalImgSrc}" alt="Imagen botella o icono" style="max-height:320px;object-fit:contain;border-radius:12px;box-shadow:0 4px 24px #0003;background:#2B0F13;" onclick="window.showZoomImage && window.showZoomImage('${finalImgSrc}')"></div>`;
    // Para wine_lover: imagen + botón Move
    const imagenDivWineLover = `<div class=\"user-bottle-img-wrapper\"><img src=\"${finalImgSrc}\" alt=\"Imagen botella o icono\" onclick=\"window.showZoomImage && window.showZoomImage('${finalImgSrc}')\">${moveBtn}</div>`;

        const userType = this.data.categorias && this.data.categorias.includes('wine_lover') ? 'winelover' : (this.data.categorias && this.data.categorias.includes('bodega') ? 'bodega' : 'otro');
        const uniqueId = this.data.id || userType;
    const userCard = (userType === 'winelover' && finalImgSrc && this.data.nombre) ? `
      <div class="user-card">
        <div class="user-card-img-wrapper">
          <img src="${finalImgSrc}" alt="${this.data.nombre}" class="user-card-img" />
        </div>
        <div class="user-card-name">${this.data.nombre}</div>
        <div class="user-card-description">${this.data.descripcion || ''}
        </div>
        <div class="user-card-social">
          <a href="https://x.com/" target="_blank" title="X" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#222" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M17.53 7.477l-4.06 4.06 4.06 4.06-1.06 1.06-4.06-4.06-4.06 4.06-1.06-1.06 4.06-4.06-4.06-4.06 1.06-1.06 4.06 4.06 4.06-4.06z"/></svg>
          </a>
          <a href="https://instagram.com/" target="_blank" title="Instagram" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#E1306C" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.242 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.242-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.567 5.783 2.295 7.149 2.233 8.415 2.175 8.795 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 12c0 5.923.013 6.332.072 7.613.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-7.613 0-5.923-.013-6.332-.072-7.613-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>
          </a>
          <a href="https://youtube.com/" target="_blank" title="YouTube" style="display:inline-block;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#c4302b" style="vertical-align:middle;" xmlns="http://www.w3.org/2000/svg"><path d="M23.498 6.186a2.998 2.998 0 0 0-2.115-2.115C19.633 3.5 12 3.5 12 3.5s-7.633 0-9.383.571a2.998 2.998 0 0 0-2.115 2.115C0 7.937 0 12 0 12s0 4.063.502 5.814a2.998 2.998 0 0 0 2.115 2.115C4.367 20.5 12 20.5 12 20.5s7.633 0 9.383-.571a2.998 2.998 0 0 0 2.115-2.115C24 16.063 24 12 24 12s0-4.063-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
        </div>
        </div>
      </div>
    ` : '';
    const popupContent = `
      <div class="user-popup" data-user-type="${userType}" data-user-id="${uniqueId}" data-user-img="${finalImgSrc}" data-img-bottle="${this.data['img-bottle'] || ''}">
        ${userCard}
        ${userType === 'bodega' ? imagenDivBodega : ''}
        <h3${userType === 'bodega' ? ' class="bodega-img-title"' : ''}>${this.data.nombre}</h3>
        ${userType !== 'bodega' ? blockchainStatus : ''}
        <div class="wallets-section">
          <strong>Wallets:</strong>
          ${wallets}
        </div>
        <!-- Wallet UTXO UI (colapsable) -->
        ${userType !== 'bodega' ? `
        <details style="margin:10px 0 0 0;">
          <summary style="cursor:pointer;font-weight:500;">Abrir gestión de wallet UTXO</summary>
          <div class="wallet-section" style="width:100%;max-width:420px;margin:0 auto;">
            <div class="wallet-import-controls" style="display:flex;flex-direction:column;gap:8px;">
              <label for="wallet-file-${this.data.id || userType}" style="font-weight:500;">Importar keystore (.json):</label>
              <div class="custom-file-input-wrapper">
                <input type="file" id="wallet-file-${this.data.id || userType}" accept="application/json" style="display:none;">
                <button type="button" id="wallet-file-btn-${this.data.id || userType}" class="wallet-btn">Seleccionar archivo</button>
                <span id="wallet-file-name-${this.data.id || userType}" class="wallet-file-name" style="margin-left:10px;color:#FFA726;font-size:0.95em;"></span>
              </div>
              <label for="wallet-passphrase-${this.data.id || userType}" style="font-weight:500;">Passphrase para descifrar:</label>
              <input type="password" id="wallet-passphrase-${this.data.id || userType}" placeholder="Passphrase" class="wallet-input">
              <button id="wallet-import" class="wallet-btn">Importar PublicKey</button>
              <button id="wallet-reset" class="wallet-btn" style="display:none;">Cambiar wallet</button>
              <span class="wallet-badge" id="wallet-badge" style="display:none;">Wallet cargada</span>
              <button id="wallet-history" class="wallet-btn" style="display:none;">Historial</button>
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
          <p class="footer-popup-item">Registrado: ${new Date(this.data.fechaRegistro).toLocaleDateString()}</p>
          <p class="footer-popup-item"><strong>Email:</strong> ${this.data.email}</p>
          ${userType === 'bodega' ? `<p class=\"footer-popup-item\"><strong>Web:</strong> <a href=\"https://${this.data.web}\" target=\"_blank\" rel=\"noopener\">${this.data.web}</a></p>` : ''}
          <p class="footer-popup-item"><strong>Categorías:</strong> ${categorias}</p>
          ${userType === 'bodega' && this.data.blockchainActive ? `<p class=\"footer-popup-item\">🟢 Blockchain activa</p>` : ''}
        </div>
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 800,
      minWidth: 440,
      className: 'peer-leaflet-popup user-custom-popup'
    });
    // File input custom trigger logic: usar evento popupopen para asegurar funcionalidad
    this.marker.on('popupopen', function() {
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
      }, 100);
    });

    // Inyectar función global para obtener balance si no existe
    if (!window.getWalletBalance) {
      window.getWalletBalance = function(address, btn) {
        if (!address) {
          console.warn('[Balance] No address provided');
          return;
        }
        const resultDiv = btn.nextElementSibling;
        if (resultDiv) {
          resultDiv.textContent = 'Consultando...';
        }
        console.log('[Balance] Solicitando balance para address:', address);
          fetch(`/api/balance?address=${encodeURIComponent(address)}`)
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
              if (resultDiv) {
                if (data && data.success && data.data && typeof data.data.balance !== 'undefined') {
                  resultDiv.textContent = data.data.balance;
                  resultDiv.style.color = '#222';
                } else {
                  resultDiv.textContent = 'Balance no disponible';
                  resultDiv.style.color = '#a22';
                }
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