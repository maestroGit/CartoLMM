/**
 * Dashboard Service para CartoLMM
 * Maneja la interfaz principal y coordinación entre servicios
 */

class DashboardService {
  constructor() {
    this.isInitialized = false;
    this.selectedBodega = null;
    this.metrics = {
      totalBodegas: 0,
      activeBodegas: 0,
      totalBlocks: 0,
      activeNodes: 0,
      pendingTransactions: 0,
      networkStatus: "disconnected",
    };
    this.updateInterval = null;
  }

  /**
   * Inicializa el dashboard completo
   */
  async initialize() {
    try {
      console.log("🚀 Inicializando CartoLMM Dashboard...");

      // 1. Inicializar servicios base
      await this.initializeServices();

      // 2. Cargar datos iniciales
      await this.loadInitialData();

      // 3. Configurar interfaz
      this.setupUI();

      // 4. Configurar actualizaciones automáticas
      this.startPeriodicUpdates();

      this.isInitialized = true;
      console.log("✅ CartoLMM Dashboard inicializado correctamente");

      return true;
    } catch (error) {
      console.error("❌ Error inicializando dashboard:", error);
      this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * Inicializa todos los servicios necesarios
   */
  async initializeServices() {
    // Inicializar mapa
    const mapInitialized = window.mapService.initialize("map");
    if (!mapInitialized) {
      throw new Error("No se pudo inicializar el servicio de mapas");
    }

    // Inicializar blockchain (si falla, no usar datos mock)
    try {
      await window.blockchainService.initialize();
    } catch (error) {
      console.warn("⚠️ Blockchain no disponible (mock deshabilitado)");
    }

    console.log("✅ Servicios inicializados");
  }

  /**
   * Carga datos iniciales
   */
  async loadInitialData() {
    try {
      // Fuente legacy eliminada: '/src/data/bodegas.json'
      // Sustituimos por dataset vacío (o futuro endpoint remoto)
      const bodegasData = { bodegas: [] };

      // Capa de bodegas eliminada: no cargar en el mapa

      // Cargar datos blockchain sólo si hay conexión real
      let blockchainData = null;
      if (window.blockchainService.isConnected) {
        blockchainData = await window.blockchainService.loadInitialData();
      }

      // Cargar nodos en el mapa (solo si vienen con coordenadas reales)
      if (blockchainData && Array.isArray(blockchainData.peers)) {
        const peersWithCoords = blockchainData.peers.filter(
          (p) => typeof p.lat === "number" && typeof p.lng === "number"
        );
        if (peersWithCoords.length > 0) {
          window.mapService.loadBlockchainNodes(peersWithCoords);
        }
      }

      // Actualizar métricas
      this.updateMetrics(bodegasData, blockchainData);

      console.log("✅ Datos iniciales cargados");
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      // Cargar datos de respaldo
      await this.loadFallbackData();
    }
  }

  /**
   * Asigna coordenadas a nodos blockchain basándose en bodegas
   */
  // Eliminado: assignCoordinatesToNodes (no se simulan coordenadas)

  /**
   * Configura la interfaz de usuario
   */
  setupUI() {
    this.setupEventListeners();
    this.setupControls();
    this.updateMetricsDisplay();
    this.setupModals();
  }

  /**
   * Configura event listeners
   */
  setupEventListeners() {
    // Eventos de bodega
    window.addEventListener("bodega:selected", (event) => {
      this.handleBodegaSelected(event.detail);
    });

    // Eventos blockchain
    window.addEventListener("blockchain:newBlock", (event) => {
      this.handleNewBlock(event.detail);
    });

    window.addEventListener("blockchain:newTransaction", (event) => {
      this.handleNewTransaction(event.detail);
    });

    // Controles de timeline
    const timelineRange = document.getElementById("timelineRange");
    if (timelineRange) {
      timelineRange.addEventListener("input", (e) => {
        this.handleTimelineChange(e.target.value);
      });
    }

    // Botón de timeline play/pause
    const timelinePlay = document.getElementById("timelinePlay");
    if (timelinePlay) {
      timelinePlay.addEventListener("click", () => {
        this.toggleTimelinePlayback();
      });
    }

    // Filtros de capas
    document.querySelectorAll(".layer-filter").forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        this.toggleLayer(e.target.dataset.layer, e.target.checked);
      });
    });
  }

  /**
   * Configura controles adicionales
   */
  setupControls() {
    // Configurar búsqueda
    const searchInput = document.querySelector(".search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Configurar filtros
    const filterSelects = document.querySelectorAll(".filter-select");
    filterSelects.forEach((select) => {
      select.addEventListener("change", (e) => {
        this.handleFilterChange(e.target.name, e.target.value);
      });
    });
  }

  /**
   * Configura modales
   */
  setupModals() {
    // Modal de detalles de bodega
    this.setupBodegaModal();

    // Modal de configuración
    this.setupSettingsModal();
  }

  /**
   * Configura modal de bodega
   */
  setupBodegaModal() {
    const modal = document.getElementById("bodegaModal");
    const closeBtn = modal?.querySelector(".close");

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this.closeBodegaModal();
      });
    }

    // Cerrar al hacer click fuera
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeBodegaModal();
      }
    });
  }

  /**
   * Configura modal de configuración
   */
  setupSettingsModal() {
    // Implementar configuraciones del sistema
  }

  /**
   * Maneja selección de bodega
   */
  handleBodegaSelected(bodega) {
    this.selectedBodega = bodega;
    this.showBodegaDetails(bodega);
    this.updateSidebarWithBodega(bodega);
  }

  /**
   * Muestra detalles de bodega en modal
   */
  showBodegaDetails(bodega) {
    const modal = document.getElementById("bodegaModal");
    const content = modal?.querySelector(".modal-content");

    if (content) {
      content.innerHTML = `
                <span class="close">&times;</span>
                <div class="bodega-details">
                    <header class="bodega-header">
                        <h2>${bodega.nombre}</h2>
                        <span class="bodega-status ${
                          bodega.blockchain?.status
                        }">
                            ${bodega.blockchain?.status || "Desconocido"}
                        </span>
                    </header>
                    
                    <div class="bodega-info">
                        <div class="info-section">
                            <h3>📍 Ubicación</h3>
                            <p><strong>Región:</strong> ${bodega.region}</p>
                            <p><strong>Coordenadas:</strong> ${bodega.ubicacion.lat.toFixed(
                              4
                            )}, ${bodega.ubicacion.lng.toFixed(4)}</p>
                        </div>
                        
                        <div class="info-section">
                            <h3>🍷 Inventario</h3>
                            <p><strong>Botellas:</strong> ${
                              bodega.inventario?.botellas || 0
                            }</p>
                            <p><strong>Variedades:</strong> ${
                              bodega.inventario?.variedades || 0
                            }</p>
                            <p><strong>Valor total:</strong> €${
                              bodega.inventario?.valorTotal || 0
                            }</p>
                        </div>
                        
                        <div class="info-section">
                            <h3>⛓️ Blockchain</h3>
                            <p><strong>Estado:</strong> ${
                              bodega.blockchain?.status || "N/A"
                            }</p>
                            <p><strong>Dirección:</strong> ${
                              bodega.blockchain?.address || "N/A"
                            }</p>
                            <p><strong>Último bloque:</strong> ${
                              bodega.blockchain?.lastBlock || "N/A"
                            }</p>
                        </div>
                    </div>
                    
                    <div class="bodega-actions">
                        <button onclick="dashboardService.viewBodegaTransactions('${
                          bodega.id
                        }')">
                            Ver Transacciones
                        </button>
                        <button onclick="dashboardService.viewBodegaInventory('${
                          bodega.id
                        }')">
                            Ver Inventario
                        </button>
                        <button onclick="dashboardService.verifyBodegaQR('${
                          bodega.id
                        }')">
                            Verificar QR
                        </button>
                    </div>
                </div>
            `;

      // Reconfigurar el botón close
      const closeBtn = content.querySelector(".close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.closeBodegaModal();
        });
      }
    }

    if (modal) {
      modal.style.display = "block";
    }
  }

  /**
   * Cierra modal de bodega
   */
  closeBodegaModal() {
    const modal = document.getElementById("bodegaModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  /**
   * Actualiza sidebar con información de bodega
   */
  updateSidebarWithBodega(bodega) {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    // Crear sección de bodega seleccionada si no existe
    let selectedSection = sidebar.querySelector(".selected-bodega");
    if (!selectedSection) {
      selectedSection = document.createElement("div");
      selectedSection.className = "selected-bodega";
      sidebar.insertBefore(selectedSection, sidebar.firstChild);
    }

    selectedSection.innerHTML = `
            <h3>🍷 Bodega Seleccionada</h3>
            <div class="selected-bodega-info">
                <h4>${bodega.nombre}</h4>
                <p>${bodega.region}</p>
                <div class="quick-stats">
                    <div class="stat">
                        <span class="stat-value">${
                          bodega.inventario?.botellas || 0
                        }</span>
                        <span class="stat-label">Botellas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${
                          bodega.blockchain?.status || "N/A"
                        }</span>
                        <span class="stat-label">Estado</span>
                    </div>
                </div>
            </div>
        `;
  }

  /**
   * Maneja nuevos bloques
   */
  handleNewBlock(blockData) {
    this.metrics.totalBlocks = (this.metrics.totalBlocks || 0) + 1;
    this.updateMetricsDisplay();

    // Mostrar notificación
    this.showNotification("Nuevo bloque minado", "success");
  }

  /**
   * Maneja nuevas transacciones
   */
  handleNewTransaction(transactionData) {
    this.metrics.pendingTransactions =
      (this.metrics.pendingTransactions || 0) + 1;
    this.updateMetricsDisplay();

    // Mostrar notificación
    this.showNotification("Nueva transacción detectada", "info");
  }

  /**
   * Actualiza métricas del sistema
   */
  updateMetrics(bodegasData = null, blockchainData = null) {
    if (bodegasData) {
      this.metrics.totalBodegas = bodegasData.bodegas?.length || 0;
      this.metrics.activeBodegas =
        bodegasData.bodegas?.filter((b) => b.blockchain?.status === "active")
          .length || 0;
    }

    if (blockchainData) {
      // blockchainData can come in several shapes:
      // - full payload { blocks: [], peers: [], transactions: [] }
      // - metrics object { totalBlocks, activeNodes, network: { activeNodes } }
      // - compact { network: { activeNodes, blockHeight, totalTransactions } }
      if (typeof blockchainData.activeNodes === "number") {
        this.metrics.activeNodes = blockchainData.activeNodes;
      } else if (Array.isArray(blockchainData.peers)) {
        this.metrics.activeNodes = blockchainData.peers.length;
      } else if (
        blockchainData.network &&
        typeof blockchainData.network.activeNodes === "number"
      ) {
        this.metrics.activeNodes = blockchainData.network.activeNodes;
      }

      if (Array.isArray(blockchainData.blocks)) {
        this.metrics.totalBlocks = blockchainData.blocks.length;
      } else if (typeof blockchainData.totalBlocks === "number") {
        this.metrics.totalBlocks = blockchainData.totalBlocks;
      }

      if (Array.isArray(blockchainData.transactions)) {
        this.metrics.pendingTransactions = blockchainData.transactions.length;
      } else if (typeof blockchainData.pendingTransactions === "number") {
        this.metrics.pendingTransactions = blockchainData.pendingTransactions;
      } else if (
        blockchainData.network &&
        typeof blockchainData.network.totalTransactions === "number"
      ) {
        this.metrics.pendingTransactions =
          blockchainData.network.totalTransactions;
      }
    }

    this.metrics.networkStatus = window.blockchainService.isConnected
      ? "connected"
      : "disconnected";

    // Set last updated timestamp
    try {
      this.metrics.lastUpdated = new Date().toISOString();
    } catch (e) {
      this.metrics.lastUpdated = Date.now();
    }

    this.updateMetricsDisplay();
  }

  /**
   * Actualiza visualización de métricas
   */
updateMetricsDisplay() {
  // Actualizar contadores en sidebar
  // Preferir elementos por ID si existen (más robusto frente a cambios de markup)
  const blocksEl = document.getElementById("blocks-counter");
  if (blocksEl)
    blocksEl.textContent = this.metrics.totalBlocks ?? blocksEl.textContent;
  else
    this.updateCounter(
      ".total-blocks .metric-value",
      this.metrics.totalBlocks
    );

  const txEl = document.getElementById("transactions-counter");
  if (txEl)
    txEl.textContent = this.metrics.pendingTransactions ?? txEl.textContent;
  else
    this.updateCounter(
      ".pending-transactions .metric-value",
      this.metrics.pendingTransactions
    );

  const activeNodesEl = document.getElementById("active-nodes");
  if (activeNodesEl)
    activeNodesEl.textContent =
      this.metrics.activeNodes ?? activeNodesEl.textContent;
  else
    this.updateCounter(
      ".active-nodes .metric-value",
      this.metrics.activeNodes
    );

  const totalBodegasEl = document.getElementById("total-bodegas");
  if (totalBodegasEl)
    totalBodegasEl.textContent =
      this.metrics.totalBodegas ?? totalBodegasEl.textContent;
  else
    this.updateCounter(
      ".total-bodegas .metric-value",
      this.metrics.totalBodegas
    );

  const activeBodegasEl = document.querySelector(
    ".active-bodegas .metric-value"
  );
  if (activeBodegasEl)
    activeBodegasEl.textContent =
      this.metrics.activeBodegas ?? activeBodegasEl.textContent;
  else
    this.updateCounter(
      ".active-bodegas .metric-value",
      this.metrics.activeBodegas
    );

  // Actualizar estado de conexión
  const statusElement = document.querySelector(
    ".network-status .metric-value"
  );
  if (statusElement) {
    statusElement.textContent = this.metrics.networkStatus;
    statusElement.className = `metric-value ${this.metrics.networkStatus}`;
  }

  // Mostrar última actualización en formato legible
  const lastUpdatedEl = document.getElementById("metrics-last-updated");
  if (lastUpdatedEl) {
    const ts = this.metrics.lastUpdated;
    if (!ts) {
      lastUpdatedEl.textContent = "-";
    } else {
      // formatear a tiempo relativo simple y añadir la hora exacta
      const when = (function format(ts) {
        try {
          const d = new Date(ts);
          const diff = Math.floor((Date.now() - d.getTime()) / 1000);
          let rel;
          if (diff < 5) rel = "ahora";
          else if (diff < 60) rel = `hace ${diff}s`;
          else if (diff < 3600) rel = `hace ${Math.floor(diff / 60)}m`;
          else if (diff < 86400) rel = `hace ${Math.floor(diff / 3600)}h`;
          else rel = `hace ${Math.floor(diff / 86400)}d`;

          // Formatear hora exacta YYYY-MM-DD HH:MM
          const pad = (n) => String(n).padStart(2, "0");
          const exact = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
            d.getDate()
          )} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

          return `${rel} — ${exact}`;
        } catch (e) {
          return String(ts);
        }
      })(ts);

      lastUpdatedEl.textContent = when;
    }
  }

  // ... tus actualizaciones de bloques, txs, nodos ...
  // Actualiza los peers visibles con el mismo ritmo de las métricas
  if (window.peersService) window.peersService.renderMetricGrid();
}

  /**
   * Actualiza un contador específico
   */
  updateCounter(selector, newValue) {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = newValue;
    }
  }

  /**
   * Maneja cambios en el timeline
   */
  handleTimelineChange(value) {
    console.log("📅 Timeline cambiado a:", value);
    // Implementar filtrado temporal
  }

  /**
   * Toggle reproducción del timeline
   */
  toggleTimelinePlayback() {
    const button = document.getElementById("timelinePlay");
    if (button) {
      const isPlaying = button.textContent === "⏸️";
      button.textContent = isPlaying ? "▶️" : "⏸️";

      if (isPlaying) {
        this.stopTimelinePlayback();
      } else {
        this.startTimelinePlayback();
      }
    }
  }

  /**
   * Inicia reproducción automática del timeline
   */
  startTimelinePlayback() {
    // Implementar reproducción automática
    console.log("▶️ Iniciando reproducción timeline");
  }

  /**
   * Detiene reproducción del timeline
   */
  stopTimelinePlayback() {
    console.log("⏸️ Deteniendo reproducción timeline");
  }

  /**
   * Toggle visibilidad de capa
   */
  toggleLayer(layerName, visible) {
    console.log(`🔍 Toggle capa ${layerName}:`, visible);
    // Implementar toggle de capas
  }

  /**
   * Maneja búsqueda
   */
  handleSearch(query) {
    console.log("🔍 Búsqueda:", query);
    // Implementar búsqueda de bodegas/nodos
  }

  /**
   * Maneja cambios de filtro
   */
  handleFilterChange(filterName, value) {
    console.log(`🔽 Filtro ${filterName}:`, value);
    // Implementar filtros
  }

  /**
   * Ver transacciones de bodega
   */
  viewBodegaTransactions(bodegaId) {
    console.log("💰 Ver transacciones:", bodegaId);
    // Implementar vista de transacciones
  }

  /**
   * Ver inventario de bodega
   */
  viewBodegaInventory(bodegaId) {
    console.log("📦 Ver inventario:", bodegaId);
    // Implementar vista de inventario
  }

  /**
   * Verificar QR de bodega
   */
  verifyBodegaQR(bodegaId) {
    console.log("📱 Verificar QR:", bodegaId);
    // Implementar verificación QR
  }

  /**
   * Muestra notificación
   */
  showNotification(message, type = "info") {
    // Crear elemento de notificación
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Agregar al DOM
    document.body.appendChild(notification);

    // Auto-remover después de 3 segundos
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Carga datos de respaldo en caso de error
   */
  async loadFallbackData() {
    // Simplificación: sin datos de respaldo ni mocks
    console.warn("🔄 loadFallbackData: deshabilitado (sin mocks)");
    this.updateMetrics({ bodegas: [] }, null);
  }

  /**
   * Maneja errores de inicialización
   */
  handleInitializationError(error) {
    console.error("💥 Error crítico en inicialización:", error);

    // Mostrar mensaje de error al usuario
    const errorDiv = document.createElement("div");
    errorDiv.className = "initialization-error";
    errorDiv.innerHTML = `
            <h2>⚠️ Error de Inicialización</h2>
            <p>No se pudo inicializar CartoLMM completamente.</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <button onclick="location.reload()">🔄 Reintentar</button>
        `;

    document.body.appendChild(errorDiv);
  }

  /**
   * Inicia actualizaciones periódicas
   */
  startPeriodicUpdates() {
    // Actualizar cada 30 segundos
    this.updateInterval = setInterval(() => {
      this.periodicUpdate();
    }, 30000);
  }

  /**
   * Actualización periódica
   */
  async periodicUpdate() {
    try {
      if (window.blockchainService.isConnected) {
        const metrics = window.blockchainService.getMetrics();
        this.updateMetrics(null, metrics);
      }
      // Añadido para refrescar nodos conectados
      if (window.peersService) {
        await window.peersService.refresh();
      }
    } catch (error) {
      console.error("❌ Error en actualización periódica:", error);
    }
  }

  /**
   * Detiene actualizaciones periódicas
   */
  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Destruye el dashboard
   */
  destroy() {
    this.stopPeriodicUpdates();

    if (window.mapService) {
      window.mapService.destroy();
    }

    if (window.blockchainService) {
      window.blockchainService.disconnect();
    }

    this.isInitialized = false;
  }
}

// Instancia global
window.dashboardService = new DashboardService();
