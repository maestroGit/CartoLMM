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
      bodega: '🍷',
      wine_lover: '🍇',
      minero: '⛏️',
      default: '👤'
    };

    // Tamaños según categoría
    const sizeMap = {
      bodega: 36,
      wine_lover: 32,
      minero: 34,
      default: 30
    };

    const emoji = iconMap[primaryCategory] || iconMap.default;
    const size = sizeMap[primaryCategory] || sizeMap.default;

    // Badge si tiene blockchain activo
    const blockchainBadge = this.data.blockchainActive 
      ? '<div class="user-blockchain-active"></div>' 
      : '';

    // Badge de múltiples categorías
    const multiBadge = hasMultipleCategories 
      ? `<div class="user-multi-badge">×${this.data.categorias.length}</div>` 
      : '';

    const html = `
      <div class="user-marker user-marker-${primaryCategory}" style="font-size: ${size}px;">
        ${emoji}
        ${blockchainBadge}
        ${multiBadge}
      </div>
    `;

    return L.divIcon({
      html: html,
      className: 'user-icon-wrapper',
      iconSize: [size + 8, size + 8],
      iconAnchor: [(size + 8) / 2, (size + 8) / 2],
      popupAnchor: [0, -(size + 8) / 2]
    });
  }

  attachPopup() {
    const categorias = this.data.categorias
      .map(cat => `<span class="categoria-tag categoria-${cat}">${cat}</span>`)
      .join(' ');

    const wallets = this.data.wallets && this.data.wallets.length > 0
      ? this.data.wallets.map(w => `
          <div class="wallet-item">
            <strong>${w.type}:</strong> 
            <code>${w.address.substring(0, 16)}...</code>
          </div>
        `).join('')
      : '<p style="color: #999;">Sin wallets registradas</p>';

    const blockchainStatus = this.data.blockchainActive
      ? '<div class="blockchain-status active">🟢 Blockchain activa</div>'
      : '<div class="blockchain-status inactive">⚪ Sin blockchain</div>';

    const popupContent = `
      <div class="user-popup">
        <h3>${this.data.nombre}</h3>
        <p><strong>Email:</strong> ${this.data.email}</p>
        <p><strong>Categorías:</strong> ${categorias}</p>
        ${blockchainStatus}
        <div class="wallets-section">
          <strong>Wallets:</strong>
          ${wallets}
        </div>
        <p style="font-size: 11px; color: #999; margin-top: 8px;">
          Registrado: ${new Date(this.data.fechaRegistro).toLocaleDateString()}
        </p>
      </div>
    `;

    this.marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: 'user-custom-popup'
    });
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