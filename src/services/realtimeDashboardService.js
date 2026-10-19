// Servicio para refresco reactivo del dashboard y nodos usando WebSocket
// Se integra con el frontend y actualiza la UI en tiempo real

class RealtimeDashboardService {
  constructor({ socket, dashboardService, peersService, mapService }) {
    this.socket = socket;
    this.dashboardService = dashboardService;
    this.peersService = peersService;
    this.mapService = mapService;
    this.lastMetrics = null;
    this.lastPeers = null;
    this.isSocketConnected = false;
    this.pollingInterval = null;
    this.mapUpdateTimeout = null;
    this.mapUpdateDelay = 1000;
    this.debugMetrics = this.isMetricsDebugEnabled();
  }

  isMetricsDebugEnabled() {
    try {
      const params = new URLSearchParams(window.location.search || '');
      if (params.get('debugMetrics') === '1') return true;
      return window.localStorage?.getItem('debugMetrics') === '1';
    } catch (error) {
      return false;
    }
  }

  init() {
    this.fetchInitialSnapshot();
    this.setupSocketListeners();
  }

  applyPeersSnapshot(payload) {
    if (!this.peersService) return [];

    let peers = [];
    let stats = null;
    let network = null;

    if (Array.isArray(payload)) {
      peers = payload;
    } else if (payload && typeof payload === 'object') {
      peers = Array.isArray(payload.peers) ? payload.peers : [];
      stats = payload.stats && typeof payload.stats === 'object' ? payload.stats : null;
      network = payload.network && typeof payload.network === 'object' ? payload.network : null;
    }

    this.peersService.peers = peers;
    if (stats) {
      this.peersService.stats = stats;
    } else {
      const online = peers.filter((p) => p && p.status === 'online').length;
      const offline = peers.filter((p) => p && p.status === 'offline').length;
      const error = peers.filter((p) => p && p.status === 'error').length;
      this.peersService.stats = {
        total: peers.length,
        online,
        offline,
        error,
      };
    }

    if (network) {
      this.peersService.network = network;
      this.peersService.myNodeId = network.localNode || null;
    }

    this.peersService.renderMetricGrid();
    return peers;
  }

  fetchInitialSnapshot() {
    fetch('/api/dashboard-metrics')
      .then(r => r.json())
      .then(data => {
        if (this.debugMetrics) {
          console.log('[METRICS][Realtime] /api/dashboard-metrics snapshot:', data);
        }
        if (data.success && this.dashboardService) {
          this.dashboardService.updateMetrics(data.data);
        }
      });
    fetch('/api/peers')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const peers = this.applyPeersSnapshot(data);
          if (this.mapService && Array.isArray(peers)) {
            console.log('Cargando ' + peers.length + ' peers en el mapa...');
            this.mapService.loadPeersOnMap(peers);
          }
        }
      });
  }

  setupSocketListeners() {
    if (!this.socket) return;
    this.socket.on('connect', () => {
      this.isSocketConnected = true;
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    });
    this.socket.on('disconnect', () => {
      this.isSocketConnected = false;
      if (!this.pollingInterval) {
        this.pollingInterval = setInterval(() => this.fetchInitialSnapshot(), 10000);
      }
    });
    this.socket.on('system:metrics', metrics => {
      this.lastMetrics = metrics;
      if (this.debugMetrics) {
        console.log('[METRICS][Realtime] system:metrics payload:', metrics);
      }
      if (this.dashboardService) {
        this.dashboardService.updateMetrics(metrics);
      }
      if (metrics.peers && this.peersService) {
        this.applyPeersSnapshot(metrics.peers);
      }
    });
    this.socket.on('system:peers', peers => {
      this.lastPeers = peers;
      const peerList = this.applyPeersSnapshot(peers);
      if (this.mapService && Array.isArray(peerList)) {
        this.scheduleMapUpdate(peerList);
      }
    });

    // Evento de descorche en tiempo real (Burn Event RWA)
    this.socket.on('wine:uncorked', data => {
      console.log('🍾 [Realtime] Evento de descorche recibido:', data);
      this.handleUncorkEvent(data);
    });

    // Notificaciones generales del sistema
    this.socket.on('system:notification', data => {
      if (data && data.tipo === 'burn_event') {
        this.handleUncorkEvent(data);
      } else if (data && data.mensaje) {
        this.showToastNotification(data.mensaje, '🔔');
      }
    });
  }

  handleUncorkEvent(data) {
    if (!data) return;
    const bodegaName = data.bodega || data.bodega_nombre || 'Bodega';
    const magnumId = data.botella_id || data.token_id || data.magnum_id || '';
    const msg = `🍾 ¡Magnum ${magnumId} descorchada en ${bodegaName}!`;

    // 1. Mostrar toast animado con estilo BlocksWine Luxury
    this.showToastNotification(msg, '🍷');

    // 2. Pulso en mapa si hay coordenadas disponibles
    if (this.mapService && typeof this.mapService.pulseLocation === 'function') {
      const coords = data.localizacion 
        ? [data.localizacion.lat, data.localizacion.lng]
        : (data.lat && data.lng ? [data.lat, data.lng] : null);
      if (coords) {
        this.mapService.pulseLocation(coords, '#f7931a');
      }
    }
  }

  showToastNotification(message, icon = '🔔') {
    const toast = document.createElement('div');
    toast.className = 'cartolmm-toast';
    toast.innerHTML = `<span style="font-size:18px;">${icon}</span> <span>${message}</span>`;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: linear-gradient(135deg, rgba(43, 15, 19, 0.96), rgba(106, 13, 37, 0.96));
      color: #fff;
      border: 1px solid #f7931a;
      box-shadow: 0 8px 30px rgba(0,0,0,0.6);
      padding: 12px 20px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      pointer-events: none;
      transition: opacity 0.4s ease, transform 0.4s ease;
      transform: translateY(0);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 450);
    }, 6000);
  }

  scheduleMapUpdate(peers) {
    if (this.mapUpdateTimeout) {
      clearTimeout(this.mapUpdateTimeout);
    }
    this.mapUpdateTimeout = setTimeout(() => {
      try {
        this.mapService.updatePeersOnMap(peers);
        console.log('Mapa actualizado con peers WebSocket');
      } catch (error) {
        console.error('Error actualizando mapa:', error);
      }
      this.mapUpdateTimeout = null;
    }, this.mapUpdateDelay);
  }
}

window.RealtimeDashboardService = RealtimeDashboardService;

function initRealtimeServiceGlobal() {
  if (!window.socket || !window.dashboardService || !window.peersService || !window.mapService) {
    console.log('Esperando servicios para realtimeDashboardService...');
    setTimeout(initRealtimeServiceGlobal, 100);
    return;
  }
  console.log('Inicializando realtimeDashboardService...');
  const realtimeService = new RealtimeDashboardService({
    socket: window.socket,
    dashboardService: window.dashboardService,
    peersService: window.peersService,
    mapService: window.mapService
  });
  window.realtimeDashboardService = realtimeService;
  realtimeService.init();
  console.log('realtimeDashboardService inicializado');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initRealtimeServiceGlobal);
} else {
  initRealtimeServiceGlobal();
}
