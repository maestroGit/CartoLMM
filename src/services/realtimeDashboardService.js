// Servicio para refresco reactivo del dashboard y nodos usando WebSocket
// Se integra con el frontend y actualiza la UI en tiempo real

export class RealtimeDashboardService {
  constructor({ socket, dashboardService, peersService }) {
    this.socket = socket;
    this.dashboardService = dashboardService;
    this.peersService = peersService;
    this.lastMetrics = null;
    this.lastPeers = null;
    this.isSocketConnected = false;
    this.pollingInterval = null;
  }

  // Inicializa listeners y hace fetch inicial
  init() {
    // Fetch inicial de métricas y peers
    this.fetchInitialSnapshot();
    // Suscribirse a eventos WebSocket
    this.setupSocketListeners();
  }

  fetchInitialSnapshot() {
    // Dashboard
    fetch('/api/dashboard-metrics')
      .then(r => r.json())
      .then(data => {
        if (data.success && this.dashboardService) {
          this.dashboardService.updateMetrics(data.data);
        }
      });
    // Peers
    fetch('/api/peers')
      .then(r => r.json())
      .then(data => {
        if (data.success && this.peersService) {
          this.peersService.renderMetricGrid(data);
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
      // Si se pierde el socket, vuelve a hacer fetch cada 10s
      if (!this.pollingInterval) {
        this.pollingInterval = setInterval(() => this.fetchInitialSnapshot(), 10000);
      }
    });
    // Evento de métricas en tiempo real
    this.socket.on('system:metrics', metrics => {
      this.lastMetrics = metrics;
      if (this.dashboardService) {
        this.dashboardService.updateMetrics(metrics);
      }
      // Si el evento incluye peers, refresca también
      if (metrics.peers && this.peersService) {
        this.peersService.renderMetricGrid(metrics.peers);
      }
    });
    // Evento de peers en tiempo real (si existe)
    this.socket.on('system:peers', peers => {
      this.lastPeers = peers;
      if (this.peersService) {
        this.peersService.renderMetricGrid(peers);
      }
    });
  }
}

// Ejemplo de uso en el frontend:
// import { RealtimeDashboardService } from './src/services/realtimeDashboardService.js';
// const realtime = new RealtimeDashboardService({ socket, dashboardService, peersService });
// realtime.init();
