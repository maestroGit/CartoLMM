/**
 * Script de debugging para Leaflet Integration
 * Ejecutar en la consola del navegador (F12)
 * 
 * Uso:
 * 1. Abre http://localhost:8080 en el navegador
 * 2. Abre la consola (F12 → Console)
 * 3. Copia y pega este script
 * 4. Ejecuta los comandos que necesites
 */

(function() {
  'use strict';

  // Colores para console.log
  const styles = {
    success: 'color: #10B981; font-weight: bold;',
    error: 'color: #EF4444; font-weight: bold;',
    warning: 'color: #F59E0B; font-weight: bold;',
    info: 'color: #3B82F6; font-weight: bold;',
    title: 'color: #8B5CF6; font-size: 16px; font-weight: bold;'
  };

  console.log('%c🧪 Leaflet Integration Debug Tools', styles.title);
  console.log('========================================\n');

  /**
   * Verifica el estado general de la integración
   */
  window.debugLeaflet = function() {
    console.log('%c📊 Estado General', styles.info);
    console.log('------------------');

    // 1. Verificar servicios
    const services = {
      mapService: window.mapService,
      peerManager: window.mapService?.peerManager,
      coordinateService: window.coordinateService,
      realtimeDashboardService: window.realtimeDashboardService,
      socket: window.socket
    };

    Object.entries(services).forEach(([name, service]) => {
      if (service) {
        console.log(`%c✓ ${name}`, styles.success, service);
      } else {
        console.log(`%c✗ ${name} NO ENCONTRADO`, styles.error);
      }
    });

    console.log('\n');

    // 2. Stats de peers en el mapa
    if (window.mapService?.peerManager) {
      const stats = window.mapService.getPeerStats();
      console.log('%c📍 Peers en el Mapa', styles.info);
      console.table(stats);
      console.log('\n');
    }

    // 3. Coordenadas service
    if (window.coordinateService) {
      const coordStats = window.coordinateService.getCacheStats();
      console.log('%c🗺️ CoordinateService', styles.info);
      console.table(coordStats);
      console.log('\n');
    }

    // 4. WebSocket
    if (window.socket) {
      console.log('%c🔌 WebSocket', styles.info);
      console.log('Conectado:', window.socket.connected);
      console.log('ID:', window.socket.id);
      console.log('\n');
    }
  };

  /**
   * Lista todos los peers actualmente en el mapa
   */
  window.listPeers = function() {
    if (!window.mapService?.peerManager) {
      console.log('%c✗ PeerManager no disponible', styles.error);
      return;
    }

    const markers = window.mapService.peerManager.getAllMarkers();
    
    console.log(`%c📋 ${markers.length} Peers en el Mapa`, styles.info);
    console.log('------------------\n');

    markers.forEach((marker, index) => {
      const data = marker.data;
      console.log(`${index + 1}. ${data.isLocal ? '🏠 LOCAL' : '🌐 REMOTE'} - ${data.nodeId}`);
      console.log(`   Status: ${data.status} | Bloques: ${data.blockHeight}`);
      console.log(`   Coords: (${data.lat}, ${data.lng})`);
      console.log(`   URL: ${data.httpUrl}\n`);
    });
  };

  /**
   * Filtra peers por estado
   * @param {string} status - 'online', 'offline', 'error', 'all'
   */
  window.filterPeersByStatus = function(status = 'all') {
    if (!window.mapService?.peerManager) {
      console.log('%c✗ PeerManager no disponible', styles.error);
      return;
    }

    window.mapService.peerManager.filterPeersByStatus(status);
    console.log(`%c✓ Filtro aplicado: ${status}`, styles.success);
  };

  /**
   * Cambia el modo de coordenadas
   * @param {boolean} useMock - true para mock, false para GeoIP
   */
  window.setCoordinateMode = function(useMock = true) {
    if (!window.coordinateService) {
      console.log('%c✗ CoordinateService no disponible', styles.error);
      return;
    }

    window.coordinateService.setMode(useMock);
    console.log(`%c✓ Modo cambiado a: ${useMock ? 'MOCK' : 'GeoIP'}`, styles.success);
  };

  /**
   * Fuerza una actualización de peers desde la API
   */
  window.refreshPeers = async function() {
    console.log('%c🔄 Refrescando peers...', styles.info);

    try {
      const response = await fetch('/api/peers');
      const data = await response.json();

      if (data.success) {
        console.log(`%c✓ ${data.peers.length} peers obtenidos`, styles.success);
        
        // Actualizar mapa
        if (window.mapService && data.peers) {
          window.mapService.updatePeersOnMap(data.peers);
          console.log('%c✓ Mapa actualizado', styles.success);
        }

        // Actualizar sidebar
        if (window.peersService) {
          window.peersService.renderMetricGrid(data);
          console.log('%c✓ Sidebar actualizado', styles.success);
        }

        // Mostrar stats
        console.table(data.stats);
      } else {
        console.log('%c✗ Error en respuesta API', styles.error, data);
      }
    } catch (error) {
      console.log('%c✗ Error refrescando peers', styles.error, error);
    }
  };

  /**
   * Simula un cambio de estado de peer (testing)
   * @param {string} nodeId - ID del nodo
   * @param {string} newStatus - 'online', 'offline', 'error'
   */
  window.simulatePeerStatusChange = function(nodeId, newStatus = 'offline') {
    if (!window.mapService?.peerManager) {
      console.log('%c✗ PeerManager no disponible', styles.error);
      return;
    }

    const peer = window.mapService.peerManager.findPeerById(nodeId);
    
    if (!peer) {
      console.log(`%c✗ Peer ${nodeId} no encontrado`, styles.error);
      console.log('Peers disponibles:', window.mapService.peerManager.getAllNodeIds());
      return;
    }

    peer.updateStatus(newStatus);
    console.log(`%c✓ ${nodeId} cambiado a ${newStatus}`, styles.success);
  };

  /**
   * Centra el mapa en un peer específico
   * @param {string} nodeId - ID del nodo
   */
  window.focusPeer = function(nodeId) {
    if (!window.mapService?.peerManager) {
      console.log('%c✗ PeerManager no disponible', styles.error);
      return;
    }

    const peer = window.mapService.peerManager.findPeerById(nodeId);
    
    if (!peer) {
      console.log(`%c✗ Peer ${nodeId} no encontrado`, styles.error);
      return;
    }

    window.mapService.map.setView([peer.data.lat, peer.data.lng], 10);
    peer.marker.openPopup();
    console.log(`%c✓ Mapa centrado en ${nodeId}`, styles.success);
  };

  /**
   * Muestra información detallada de un peer
   * @param {string} nodeId - ID del nodo
   */
  window.inspectPeer = function(nodeId) {
    if (!window.mapService?.peerManager) {
      console.log('%c✗ PeerManager no disponible', styles.error);
      return;
    }

    const peer = window.mapService.peerManager.findPeerById(nodeId);
    
    if (!peer) {
      console.log(`%c✗ Peer ${nodeId} no encontrado`, styles.error);
      return;
    }

    console.log(`%c🔍 Detalles de ${nodeId}`, styles.info);
    console.log('------------------');
    console.table(peer.data);
  };

  /**
   * Limpia el cache de coordenadas
   */
  window.clearCoordinateCache = function() {
    if (!window.coordinateService) {
      console.log('%c✗ CoordinateService no disponible', styles.error);
      return;
    }

    window.coordinateService.clearCache();
    console.log('%c✓ Cache limpiado', styles.success);
  };

  /**
   * Test de conectividad WebSocket
   */
  window.testWebSocket = function() {
    if (!window.socket) {
      console.log('%c✗ Socket no disponible', styles.error);
      return;
    }

    console.log('%c🔌 Test de WebSocket', styles.info);
    console.log('------------------');
    console.log('Conectado:', window.socket.connected);
    console.log('Socket ID:', window.socket.id);

    // Verificar listeners
    const listeners = [
      'connect',
      'disconnect',
      'system:metrics',
      'system:peers'
    ];

    console.log('\nListeners registrados:');
    listeners.forEach(event => {
      const count = window.socket.listeners(event).length;
      if (count > 0) {
        console.log(`%c✓ ${event} (${count})`, styles.success);
      } else {
        console.log(`%c✗ ${event} (0)`, styles.warning);
      }
    });
  };

  /**
   * Muestra ayuda de comandos
   */
  window.debugHelp = function() {
    console.log('%c📚 Comandos Disponibles', styles.title);
    console.log('========================================\n');

    const commands = [
      { cmd: 'debugLeaflet()', desc: 'Estado general de la integración' },
      { cmd: 'listPeers()', desc: 'Lista todos los peers en el mapa' },
      { cmd: 'filterPeersByStatus(status)', desc: 'Filtra peers por estado (online/offline/error/all)' },
      { cmd: 'setCoordinateMode(useMock)', desc: 'Cambia modo coordenadas (true=mock, false=geoip)' },
      { cmd: 'refreshPeers()', desc: 'Fuerza actualización de peers desde API' },
      { cmd: 'simulatePeerStatusChange(nodeId, status)', desc: 'Simula cambio de estado' },
      { cmd: 'focusPeer(nodeId)', desc: 'Centra mapa en un peer' },
      { cmd: 'inspectPeer(nodeId)', desc: 'Muestra detalles de un peer' },
      { cmd: 'clearCoordinateCache()', desc: 'Limpia cache de coordenadas' },
      { cmd: 'testWebSocket()', desc: 'Test de conectividad WebSocket' },
      { cmd: 'debugHelp()', desc: 'Muestra esta ayuda' }
    ];

    commands.forEach(({ cmd, desc }) => {
      console.log(`%c${cmd}`, 'color: #8B5CF6; font-weight: bold;');
      console.log(`  ${desc}\n`);
    });

    console.log('\n%cEjemplos:', 'color: #F59E0B; font-weight: bold;');
    console.log('  debugLeaflet()');
    console.log('  listPeers()');
    console.log('  filterPeersByStatus("online")');
    console.log('  focusPeer("genesis_node")');
    console.log('  inspectPeer("peer-1")');
    console.log('\n');
  };

  // Mostrar ayuda inicial
  window.debugHelp();

  console.log('%c✅ Debug tools cargadas! Escribe debugHelp() para ver comandos.', styles.success);
})();
