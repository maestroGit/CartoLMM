class PeersService {
  constructor(endpoint = '/api/peers') {
    this.endpoint = endpoint;
    this.peers = [];
    this.stats = null;
    this.network = null;
    this.myNodeId = null;
  }

  /**
   * Recupera peers desde la API mejorada
   * Ahora usa /api/peers que devuelve info detallada de cada nodo
   */
  fetchPeers = async () => {
    try {
      const res = await fetch(this.endpoint);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      // Extraer datos de la nueva estructura
      this.peers = data.peers || [];
      this.stats = data.stats || {};
      this.network = data.network || {};
      this.myNodeId = this.network.localNode || null;

      console.log(`✅ Peers cargados: ${this.stats.online}/${this.stats.total} online`);
      
      return this.peers;
    } catch (e) {
      console.error("❌ Error recuperando peers:", e);
      this.peers = [];
      this.stats = { total: 0, online: 0, offline: 0, error: 0 };
      return [];
    }
  };

  /**
   * Renderiza las métricas de peers en la sección lateral
   * Ahora muestra info más detallada: status, blockHeight, responseTime, etc.
   */
  renderMetricGrid = (selector = '#peers-metric-grid') => {
    const grid = document.querySelector(selector);
    if (!grid) {
      console.warn('⚠️ No se encontró el contenedor de peers:', selector);
      return;
    }

    const noPeersMsg = document.getElementById('no-peers-message');
    
    // Limpia previos
    grid.querySelectorAll('.metric-card:not(#no-peers-message)').forEach(e => e.remove());

    if (!this.peers.length) {
      if (noPeersMsg) noPeersMsg.style.display = '';
      return;
    } else {
      if (noPeersMsg) noPeersMsg.style.display = 'none';
    }

    // Renderizar cada peer con info detallada
    this.peers.forEach(peer => {
      // Normalizar y recortar URL para evitar espacios finales que rompan links
      const httpUrl = (peer.httpUrl || '').toString().trim();
      const div = document.createElement('div');
      div.className = 'metric-card peer-card';
      
      // Estilos según estado
      let statusColor = '#10B981'; // Verde
      let statusIcon = '🟢';
      let borderStyle = '';
      let displayName = peer.nodeId || 'N/A';

      if (peer.status === 'offline') {
        statusColor = '#EF4444'; // Rojo
        statusIcon = '🔴';
      } else if (peer.status === 'error') {
        // Default error mapping (non-local is a warning)
        statusColor = '#F59E0B'; // Naranja
        statusIcon = '⚠️';
      }

      // Special handling for local node: show explicit LOCAL label
      if (peer.isLocal) {
        borderStyle = 'border: 2px solid var(--brand-accent, #F7931A);';
        if (peer.status === 'online') {
          displayName = 'LOCAL (online)';
        } else if (peer.status === 'error') {
          statusColor = '#EF4444'; // rojo
          statusIcon = '🔴';
          displayName = 'LOCAL (error)';
        } else if (peer.status === 'offline') {
          statusColor = '#EF4444';
          statusIcon = '🔴';
          displayName = 'LOCAL (offline)';
        } else {
          displayName = `LOCAL${peer.nodeId && peer.nodeId !== 'unknown' ? ' — ' + peer.nodeId : ''}`;
        }
      }

      // Construir HTML con toda la info (diseño ultra-compacto)
      div.style.cssText = borderStyle;
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-size: 0.7em; color: ${peer.isLocal ? 'var(--brand-accent, #F7931A)' : '#1F2937'}; font-weight: ${peer.isLocal ? 'bold' : '600'};">
            ${statusIcon} ${displayName}
          </span>
          <span style="font-size: 0.6em; color: ${statusColor}; text-transform: uppercase; font-weight: 600;">
            ${peer.status}
          </span>
        </div>
        
        <div style="font-size: 0.65em; color: #6B7280; line-height: 1.3;">
          <div style="margin-bottom: 1px;">
            <a href="${httpUrl}" target="_blank" style="color: #3B82F6; text-decoration: none;">
              ${this.shortenUrl(httpUrl)}
            </a>
          </div>
          
          ${peer.status === 'online' ? `
            <div style="display: flex; gap: 6px; margin-top: 2px; font-size: 0.95em;">
              <span title="Altura de bloque">📊${peer.blockHeight || 0}</span>
              <span title="Dificultad">⚡${peer.difficulty || 0}</span>
              <span title="Ping">⏱️${peer.responseTime || 0}ms</span>
            </div>
          ` : ''}
          
          ${peer.error ? `
            <div style="color: #F59E0B; font-size: 0.9em; margin-top: 1px;">
              ⚠️ ${peer.error}
            </div>
          ` : ''}
          
          ${peer.lastSeen ? `
            <div style="color: #9CA3AF; font-size: 0.9em; margin-top: 1px;">
              ${this.timeAgo(peer.lastSeen)}
            </div>
          ` : ''}
        </div>
      `;
      
      grid.appendChild(div);
    });

    // Añadir card de estadísticas al final si hay stats
    if (this.stats && this.stats.total > 0) {
      this.renderStatsCard(grid);
    }
  };

  /**
   * Renderiza card con estadísticas globales de la red (ultra-compacto)
   */
  renderStatsCard = (grid) => {
    const statsDiv = document.createElement('div');
    statsDiv.className = 'metric-card stats-card';
    statsDiv.style.cssText = 'background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3);';
    
    statsDiv.innerHTML = `
      <div style="font-size: 0.7em; color: var(--blockchain-green, #10B981); margin-bottom: 3px; font-weight: 600;">
        📊 Estadísticas
      </div>
      <div style="font-size: 0.65em; line-height: 1.4;">
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 2px;">
          <span>Total: <strong>${this.stats.total}</strong></span>
          <span style="color: #10B981;">✓ <strong>${this.stats.online}</strong></span>
          ${this.stats.offline > 0 ? `<span style="color: #EF4444;">✗ <strong>${this.stats.offline}</strong></span>` : ''}
          ${this.stats.error > 0 ? `<span style="color: #F59E0B;">⚠ <strong>${this.stats.error}</strong></span>` : ''}
        </div>
        
        ${this.stats.online > 0 ? `
          <div style="margin-top: 2px; font-size: 0.95em;">
            📊 ${this.stats.maxBlockHeight} | ⏱️ ${this.stats.avgResponseTime}ms${this.network ? ` | P2P: ${this.network.p2pConnections || 0}` : ''}
          </div>
        ` : ''}
      </div>
    `;
    
    grid.appendChild(statsDiv);
  };

  /**
   * Acorta URLs largas para mejor visualización
   */
  shortenUrl = (url) => {
    if (!url) return 'N/A';
    const cleaned = url.toString().trim();
    if (!cleaned || cleaned === 'unknown') return 'N/A';
    try {
      const urlObj = new URL(cleaned);
      return `${urlObj.hostname}:${urlObj.port || (urlObj.protocol === 'wss:' || urlObj.protocol === 'https:' ? '443' : '80')}`;
    } catch {
      return cleaned.length > 30 ? cleaned.substring(0, 27) + '...' : cleaned;
    }
  };

  /**
   * Formatea tiempo relativo (hace 1m, 5s, etc.)
   */
  timeAgo = (ts) => {
    if (!ts) return 'N/A';
    
    const date = new Date(ts);
    const secs = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (secs < 0) return 'ahora';
    if (secs < 60) return `hace ${secs}s`;
    if (secs < 3600) return `hace ${Math.floor(secs / 60)}m`;
    if (secs < 86400) return `hace ${Math.floor(secs / 3600)}h`;
    return `hace ${Math.floor(secs / 86400)}d`;
  };

  /**
   * Devuelve la lista de peers para otras visualizaciones (mapa, etc)
   */
  getPeerList = () => this.peers;

  /**
   * Devuelve solo peers online
   */
  getOnlinePeers = () => this.peers.filter(p => p.status === 'online');

  /**
   * Devuelve info del nodo local
   */
  getLocalNode = () => this.peers.find(p => p.isLocal) || null;

  /**
   * Devuelve estadísticas de red
   */
  getStats = () => this.stats;

  /**
   * Actualiza y repinta (útil para refresco periódico)
   */
  refresh = async () => {
    console.log('🔄 Refrescando peers...');
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