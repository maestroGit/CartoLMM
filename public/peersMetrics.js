class PeersService {
  constructor(endpoint = '/system-info') {
    this.endpoint = endpoint;
    this.peers = [];
    this.myNodeId = null;
    this.myHttpUrl = null;
  }

  // Recupera peers desde la API y guarda otros datos útiles del nodo local
  fetchPeers = async () => {
    try {
      const res = await fetch(this.endpoint);
      const data = await res.json();
      this.myNodeId = data.blockchain?.nodeId || null;
      this.myHttpUrl = data.blockchain?.httpUrl?.trim() || null;
      this.peers = data.blockchain?.network?.peersHttp || [];
      return this.peers;
    } catch (e) {
      console.error("❌ Error recuperando peers:", e);
      this.peers = [];
      return [];
    }
  };

  // Renderiza las métricas de peers en la sección lateral (puedes modificar el selector)
  renderMetricGrid = (selector = '#peers-metric-grid') => {
    const grid = document.querySelector(selector);
    const noPeersMsg = document.getElementById('no-peers-message');
    // Limpia previos
    grid.querySelectorAll('.metric-card:not(#no-peers-message)').forEach(e => e.remove());

    if (!this.peers.length) {
      if (noPeersMsg) noPeersMsg.style.display = '';
      return;
    } else {
      if (noPeersMsg) noPeersMsg.style.display = 'none';
    }

    this.peers.forEach(peer => {
      const isLocal = peer.nodeId === this.myNodeId ||
                      (peer.httpUrl && peer.httpUrl.trim() === this.myHttpUrl);
      const div = document.createElement('div');
      div.className = 'metric-card';
      if (isLocal) div.style.border = "2px solid #007bff";
      div.innerHTML = `
        <span class="metric-value" style="font-size:1em;${isLocal ? 'color:#007bff;font-weight:bold;' : ''}">
          ${peer.nodeId} ${isLocal ? '<span style="color:#d00;">(local)</span>' : ''}
        </span>
        <span class="metric-label">
          <a href="${peer.httpUrl}" target="_blank">${peer.httpUrl}</a>
          <div style="color:#888; font-size:0.9em;">${this.timeAgo(peer.lastSeen)}</div>
        </span>
      `;
      grid.appendChild(div);
    });
  };

  // Método auxiliar para pintar fechas "hace 1m"
  timeAgo = ts => {
    if (!ts) return '';
    const secs = Math.floor((Date.now() - ts) / 1000);
    if (secs < 60) return `hace ${secs}s`;
    if (secs < 3600) return `hace ${Math.floor(secs/60)}m`;
    if (secs < 86400) return `hace ${Math.floor(secs/3600)}h`;
    return `hace ${Math.floor(secs/86400)}d`;
  };

  // Devuelve la lista de peers para otras visualizaciones (mapa, etc)
  getPeerList = () => this.peers;

  // Devuelve info del nodo local
  getOwnNodeInfo = () => ({
    nodeId: this.myNodeId,
    httpUrl: this.myHttpUrl
  });

  // Actualiza y repinta (útil para refresco periódico)
  refresh = async () => {
    await this.fetchPeers();
    this.renderMetricGrid();
  };
}

// Instancia global si la quieres accesible desde el mapa, etc
// Hace que la instancia esté disponible globalmente en la consola y en todos los scripts de tu app web.
// Si todo tu frontend JS está “enlazado clásico” y va sobre el objeto window, no es necesario exportar.
// Si todo tu frontend JS está “enlazado clásico” y va sobre el objeto window, no es necesario exportar.
// Desde cualquier script o función en tu HTML puedes accederla así:
window.peersService = new PeersService();

// Al cargar, refresca una vez y (opcional) cada 30s
window.peersService.refresh();
setInterval(() => window.peersService.refresh(), 30000);