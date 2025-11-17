/**
 * UserMarker.js
 * Marcador visual para usuarios registrados en el mapa
 */

class UserMarker {
  constructor(userData, map) {
    this.data = userData;
    this.map = map;
    this.marker = null;
    
    this.createMarker();
  }

  createMarker() {
    const icon = this.createIcon();
    
    this.marker = L.marker([this.data.localizacion.lat, this.data.localizacion.lng], {
      icon: icon,
      title: this.data.nombre
    });

    this.attachPopup();
    this.marker.addTo(this.map);
  }

  createIcon() {
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
          <div class="wallet-item" style="margin-bottom:10px;">
            <strong>${w.type}:</strong> 
            <code style="word-break:break-all;white-space:pre-wrap;user-select:all;">${w.address}</code>
            <button class="balance-btn-user-popup" style="margin-left:8px;" onclick="window.getWalletBalance && window.getWalletBalance('${w.address}', this)">Balance</button>
            <div class="wallet-balance-result" id="wallet-balance-result-${this.data.id || idx}" style="font-size:12px;color:#2a2;min-height:18px;margin-top:2px;"></div>
          </div>
        `).join('')
      : '<p style="color: #999;">Sin wallets registradas</p>';

    const blockchainStatus = this.data.blockchainActive
      ? '<div class="blockchain-status active">🟢 Blockchain activa</div>'
      : '<div class="blockchain-status inactive">⚪ Sin blockchain</div>';

    const webField = this.data.web
      ? `<p><strong>Web:</strong> <a href="https://${this.data.web}" target="_blank" rel="noopener">${this.data.web}</a></p>`
      : '';

    // Imagen: usar campo this.data["img-bottle"] si existe, si no, usar imagen por defecto
    const imagenSrc = this.data["img-bottle"] && this.data["img-bottle"].trim() !== ''
      ? this.data["img-bottle"]
      : '/public/images/IconoMagnum.png';
    const isExternal = imagenSrc.startsWith('http://') || imagenSrc.startsWith('https://');
    const finalImgSrc = isExternal ? imagenSrc : imagenSrc;
    // Botón Move
    const moveBtn = `<div style="width:100%;display:flex;justify-content:center;"><button class="move-btn-user-popup" onclick=\"window.open('http://localhost:3000/demo-wallet/web-demo.html','_blank')\">Move</button></div>`;
    // Imagen con zoom interactivo
    const imagenDiv = `<div class="user-bottle-img-wrapper"><img src="${finalImgSrc}" alt="Imagen botella o icono" onclick="window.showZoomImage && window.showZoomImage('${finalImgSrc}')">${moveBtn}</div>`;

    const popupContent = `
      <div class="user-popup">
        <h3>${this.data.nombre}</h3>
        <p><strong>Email:</strong> ${this.data.email}</p>
        ${webField}
        <p><strong>Categorías:</strong> ${categorias}</p>
        ${blockchainStatus}
        <div class="wallets-section">
          <strong>Wallets:</strong>
          ${wallets}
        </div>
        ${imagenDiv}
        <p style="font-size: 11px; color: #999; margin-top: 8px;">
          Registrado: ${new Date(this.data.fechaRegistro).toLocaleDateString()}
        </p>
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 600,
      minWidth: 440,
      className: 'peer-leaflet-popup user-custom-popup'
    });

    // Inyectar función global para obtener balance si no existe
    if (!window.getWalletBalance) {
      window.getWalletBalance = function(address, btn) {
        if (!address) return;
        const resultDiv = btn.nextElementSibling;
        if (resultDiv) {
          resultDiv.textContent = 'Consultando...';
        }
        console.log('[Balance] Solicitando balance para address:', address);
        fetch(`/api/balance?address=${encodeURIComponent(address)}`)
          .then(r => r.json())
          .then(data => {
            console.log('[Balance] Respuesta recibida para', address, ':', data);
            if (resultDiv) {
              // El backend ahora siempre devuelve data.data.balance
              const balance = (data && data.data && typeof data.data.balance !== 'undefined') ? data.data.balance : 0;
              resultDiv.textContent = balance + ' Importe Total';
              resultDiv.style.color = 'rgba(215, 126, 42, 1)';
            }
          })
          .catch(err => {
            console.error('[Balance] Error de red para', address, err);
            if (resultDiv) {
              resultDiv.textContent = 'Error de red';
              resultDiv.style.color = '#a22';
            }
          });
      }
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