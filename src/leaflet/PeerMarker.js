/**
 * Marcador de peer blockchain en el mapa Leaflet
 * Soporta datos blockchain: nodeId, status, blockHeight, etc.
 */
class PeerMarker {
  constructor(peerData, map) {
    this.data = peerData;
    this.map = map;
    this.visible = true;
    this.marker = this.createMarker();
    this.attachPopup();
  }

  /**
   * Crea el marcador Leaflet con icono personalizado
   * @returns {L.Marker} Marcador de Leaflet
   */
  createMarker() {
    const icon = this.createIcon();
    return L.marker([this.data.lat, this.data.lng], { icon }).addTo(this.map);
  }

  /**
   * Crea icono divIcon según tipo y estado del peer
   * @returns {L.DivIcon} Icono personalizado
   */
  createIcon() {
    const iconConfigs = {
      local: {
        html: '<div class="peer-marker peer-marker-local"><span class="peer-icon">🏠</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      },
      online: {
        html: '<div class="peer-marker peer-marker-online"><span class="peer-icon">🌐</span><span class="peer-pulse"></span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      },
      offline: {
        html: '<div class="peer-marker peer-marker-offline"><span class="peer-icon">⚫</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      },
      error: {
        html: '<div class="peer-marker peer-marker-error"><span class="peer-icon">⚠️</span></div>',
        className: 'peer-icon-wrapper',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
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
      
      const title = this.data.isLocal ? '🏠 NODO LOCAL' : '🌐 PEER REMOTO';
      
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
      maxWidth: 300,
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