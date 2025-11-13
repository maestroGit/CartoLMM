// Adaptador para exponer el servicio reactivo en el frontend clásico
import { RealtimeDashboardService } from '../src/services/realtimeDashboardService.js';

window.realtimeDashboardService = new RealtimeDashboardService({
  socket: window.CartoLMMWebSocket && window.CartoLMMWebSocket.prototype.socket ? window.CartoLMMWebSocket.prototype.socket : (window.socket || null),
  dashboardService: window.dashboardService,
  peersService: window.peersService,
  mapService: window.mapService // Nuevo: conectar servicio de mapa
});

window.realtimeDashboardService.init();
