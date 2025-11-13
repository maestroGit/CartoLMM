/**
 * Gestor de capas para peers blockchain en Leaflet
 * Maneja marcadores, relaciones y buffers de peers
 */
class PeerLayerManager {
  constructor(map) {
    this.map = map;
    this.peerMarkers = new Map(); // nodeId -> PeerMarker
    this.peerRelations = [];
    this.peerBuffers = [];
  }

  /**
   * Añade o actualiza un peer en el mapa
   * @param {Object} peerData - Datos del peer
   * @returns {PeerMarker} Marcador creado o actualizado
   */
  addPeer(peerData) {
    const nodeId = peerData.nodeId || peerData.id || `peer-${Date.now()}`;
    
    // Si ya existe, actualizar datos en lugar de crear nuevo
    if (this.peerMarkers.has(nodeId)) {
      const existingMarker = this.peerMarkers.get(nodeId);
      existingMarker.updateData(peerData);
      return existingMarker;
    }
    
    // Crear nuevo marcador usando clase global
    const pm = new window.PeerMarker(peerData, this.map);
    this.peerMarkers.set(nodeId, pm);
    return pm;
  }

  /**
   * Actualiza los datos de un peer existente
   * @param {string} nodeId - ID del nodo
   * @param {Object} updates - Datos a actualizar
   * @returns {boolean} True si se actualizó, false si no existe
   */
  updatePeer(nodeId, updates) {
    if (this.peerMarkers.has(nodeId)) {
      const marker = this.peerMarkers.get(nodeId);
      marker.updateData(updates);
      return true;
    }
    return false;
  }

  /**
   * Remueve un peer del mapa
   * @param {string} nodeId - ID del nodo a remover
   * @returns {boolean} True si se removió, false si no existía
   */
  removePeer(nodeId) {
    if (this.peerMarkers.has(nodeId)) {
      const marker = this.peerMarkers.get(nodeId);
      marker.remove();
      this.peerMarkers.delete(nodeId);
      return true;
    }
    return false;
  }

  /**
   * Busca un peer por su nodeId
   * @param {string} nodeId - ID del nodo
   * @returns {PeerMarker|null} Marcador encontrado o null
   */
  findPeerById(nodeId) {
    return this.peerMarkers.get(nodeId) || null;
  }

  /**
   * Obtiene todos los marcadores como array
   * @returns {Array<PeerMarker>} Array de marcadores
   */
  getAllMarkers() {
    return Array.from(this.peerMarkers.values());
  }

  /**
   * Obtiene todos los nodeIds
   * @returns {Array<string>} Array de IDs
   */
  getAllNodeIds() {
    return Array.from(this.peerMarkers.keys());
  }

  /**
   * Limpia todos los marcadores del mapa
   */
  clear() {
    this.peerMarkers.forEach(marker => marker.remove());
    this.peerMarkers.clear();
  }

  /**
   * Sincroniza peers del mapa con nueva lista
   * Añade nuevos, actualiza existentes, remueve desaparecidos
   * @param {Array} newPeers - Array de peers actualizado
   */
  syncPeers(newPeers) {
    const newPeerIds = new Set(newPeers.map(p => p.nodeId || p.id));
    
    // Remover peers que ya no están
    const currentIds = this.getAllNodeIds();
    currentIds.forEach(id => {
      if (!newPeerIds.has(id)) {
        this.removePeer(id);
      }
    });
    
    // Añadir o actualizar peers
    newPeers.forEach(peer => this.addPeer(peer));
  }

  addRelation(peerA, peerB, options = {}) {
    const rel = new PeerRelation(peerA, peerB, this.map, options);
    this.peerRelations.push(rel);
    return rel;
  }

  addBuffer(peer, radius, options = {}) {
    const buf = new PeerBuffer(peer, this.map, radius, options);
    this.peerBuffers.push(buf);
    return buf;
  }

  /**
   * Filtra peers por categoría
   * @param {string} category - Categoría a filtrar ('all' para mostrar todos)
   */
  filterPeersByCategory(category) {
    this.getAllMarkers().forEach(pm =>
      pm.setVisible(pm.matchesCategory(category))
    );
  }

  /**
   * Filtra peers por región
   * @param {string} region - Región a filtrar ('all' para mostrar todos)
   */
  filterPeersByRegion(region) {
    this.getAllMarkers().forEach(pm =>
      pm.setVisible(pm.matchesRegion(region))
    );
  }

  /**
   * Filtra peers por estado
   * @param {string} status - Estado a filtrar (online/offline/error/'all')
   */
  filterPeersByStatus(status) {
    this.getAllMarkers().forEach(pm => {
      pm.setVisible(pm.matchesStatus(status));
    });
  }

  clearBuffers() {
    this.peerBuffers.forEach(buf => buf.setVisible(false));
    this.peerBuffers = [];
  }

  clearRelations() {
    this.peerRelations.forEach(rel => rel.setVisible(false));
    this.peerRelations = [];
  }
}

// Exponer como clase global
window.PeerLayerManager = PeerLayerManager;