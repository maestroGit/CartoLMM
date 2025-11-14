/**
 * Marcador de peer blockchain en el mapa Leaflet
 * Soporta datos blockchain: nodeId, status, blockHeight, etc.
 */
class PeerMarker {
  constructor(peerData, map) {
    this.data = peerData;
    this.map = map;
    this.visible = true;
    console.log('[PeerMarker.constructor] Creando marcador para peer:', peerData);
    this.marker = this.createMarker();
    this.attachPopup();
  }

  /**
   * Crea el marcador Leaflet con icono personalizado
   * @returns {L.Marker} Marcador de Leaflet
   */
  createMarker() {
    const icon = this.createIcon();
    console.log('[PeerMarker.createMarker] lat:', this.data.lat, 'lng:', this.data.lng, 'icon:', icon);
    return L.marker([this.data.lat, this.data.lng], { icon }).addTo(this.map);
  }

  /**
   * Crea icono divIcon según tipo y estado del peer
   * @returns {L.DivIcon} Icono personalizado
   */
  createIcon() {
    const iconConfigs = {
      local: {
        html: '<div class="peer-marker peer-marker-local"><span class="peer-icon">💻</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19]
      },
      online: {
        html: '<div class="peer-marker peer-marker-online"><span class="peer-icon">📡</span><span class="peer-pulse"></span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17]
      },
      offline: {
        html: '<div class="peer-marker peer-marker-offline"><span class="peer-icon">🔴</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      },
      error: {
        html: '<div class="peer-marker peer-marker-error"><span class="peer-icon">⚠️</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      }
    };

    const type = this.data.isLocal ? 'local' : (this.data.status || 'online');
    const config = iconConfigs[type] || iconConfigs.online;

    return L.divIcon(config);
  }

  /**
   * Adjunta popup con información del peer
   */
  attachPopup() {
    let content;
    
    // Popup para peer blockchain
    if (this.data.nodeId) {
      const statusEmoji = {
        online: '🟢',
        offline: '🔴',
        error: '🟠'
      }[this.data.status] || '⚪';
      const title = this.data.isLocal ? '💻  NODO LOCAL' : '📡  PEER REMOTO';
      // Mostrar publicKey completa si existe
      let walletSection = '';
      if (this.data.walletPublicKey) {
        walletSection = `<p><strong>Wallet:</strong> <code style="word-break:break-all;white-space:pre-wrap;user-select:all;">${this.data.walletPublicKey}</code></p>`;
      }
      content = `
        <div class="peer-popup">
          <h4 class="peer-popup-title">${title}</h4>
          <div class="peer-popup-content">
            <p><strong>ID:</strong> <code>${this.data.nodeId}</code></p>
            <p><strong>Estado:</strong> ${statusEmoji} <span class="status-${this.data.status}">${this.data.status || 'unknown'}</span></p>
            <p><strong>URL:</strong> <a href="${this.data.httpUrl}" target="_blank" rel="noopener">${this.data.httpUrl}</a></p>
            ${this.data.responseTime !== undefined ? `<p><strong>Latencia:</strong> ${this.data.responseTime}ms</p>` : ''}
            ${this.data.peers !== undefined ? `<p><strong>Peers conectados:</strong> ${this.data.peers}</p>` : ''}
            ${this.data.lastSeen ? `<p><strong>Última conexión:</strong> ${new Date(this.data.lastSeen).toLocaleString('es-ES')}</p>` : ''}
            ${this.data.city ? `<p><strong>📍 Ubicación:</strong> ${this.data.city}</p>` : ''}
            ${walletSection}
          </div>
        </div>
      `;
    } else {
      // Fallback para otros tipos de datos
      content = `
        <strong>${this.data.nombre || this.data.nodeId || 'Peer'}</strong><br>
        ${this.data.categoria ? `Categoría: ${this.data.categoria}<br>` : ''}
        ${this.data.region || this.data.city ? `Región: ${this.data.region || this.data.city}<br>` : ''}
      `;
    }
    
    this.marker.bindPopup(content, {
      maxWidth: 500,
      minWidth: 340,
      className: 'peer-leaflet-popup'
    });
  }

  /**
   * Actualiza los datos del peer y refresca el popup
   * @param {Object} newData - Nuevos datos del peer
   */
  updateData(newData) {
    const oldStatus = this.data.status;
    this.data = { ...this.data, ...newData };
    
    // Refrescar popup con nuevos datos
    this.attachPopup();
    
    // Si cambió el estado, actualizar icono
    if (oldStatus !== this.data.status) {
      this.updateIcon();
    }
  }

  /**
   * Actualiza el icono del marcador
   */
  updateIcon() {
    const newIcon = this.createIcon();
    this.marker.setIcon(newIcon);
  }

  /**
   * Actualiza solo el estado del peer
   * @param {string} newStatus - Nuevo estado (online/offline/error)
   */
  updateStatus(newStatus) {
    if (this.data.status !== newStatus) {
      this.updateData({ status: newStatus });
    }
  }

  /**
   * Actualiza la altura del bloque
   * @param {number} blockHeight - Nueva altura
   */
  setBlockHeight(blockHeight) {
    this.updateData({ blockHeight });
  }

  /**
   * Muestra/oculta el marcador
   * @param {boolean} isVisible - True para mostrar, false para ocultar
   */
  setVisible(isVisible) {
    this.visible = isVisible;
    if (isVisible) {
      if (!this.map.hasLayer(this.marker)) {
        this.marker.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.marker)) {
        this.map.removeLayer(this.marker);
      }
    }
  }

  /**
   * Verifica si el peer coincide con una categoría
   * @param {string} category - Categoría a filtrar
   * @returns {boolean}
   */
  matchesCategory(category) {
    return category === 'all' || this.data.categoria === category;
  }

  /**
   * Verifica si el peer coincide con una región
   * @param {string} region - Región a filtrar
   * @returns {boolean}
   */
  matchesRegion(region) {
    return region === 'all' || this.data.region === region || this.data.city === region;
  }

  /**
   * Verifica si el peer coincide con un estado
   * @param {string} status - Estado a filtrar (online/offline/error)
   * @returns {boolean}
   */
  matchesStatus(status) {
    return status === 'all' || this.data.status === status;
  }

  /**
   * Remueve el marcador del mapa
   */
  remove() {
    if (this.marker && this.map.hasLayer(this.marker)) {
      this.map.removeLayer(this.marker);
    }
  }

  /**
   * Obtiene el nodeId del peer
   * @returns {string} ID del nodo
   */
  getNodeId() {
    return this.data.nodeId || this.data.id;
  }
}

// Exponer como clase global
window.PeerMarker = PeerMarker;