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
            networkStatus: 'disconnected'
        };
        this.updateInterval = null;
    }

    /**
     * Inicializa el dashboard completo
     */
    async initialize() {
        try {
            console.log('🚀 Inicializando CartoLMM Dashboard...');

            // 1. Inicializar servicios base
            await this.initializeServices();

            // 2. Cargar datos iniciales
            await this.loadInitialData();

            // 3. Configurar interfaz
            this.setupUI();

            // 4. Configurar actualizaciones automáticas
            this.startPeriodicUpdates();

            this.isInitialized = true;
            console.log('✅ CartoLMM Dashboard inicializado correctamente');

            return true;
        } catch (error) {
            console.error('❌ Error inicializando dashboard:', error);
            this.handleInitializationError(error);
            return false;
        }
    }

    /**
     * Inicializa todos los servicios necesarios
     */
    async initializeServices() {
        // Inicializar mapa
        const mapInitialized = window.mapService.initialize('map');
        if (!mapInitialized) {
            throw new Error('No se pudo inicializar el servicio de mapas');
        }

        // Inicializar blockchain (puede fallar si no hay servidor)
        try {
            await window.blockchainService.initialize();
        } catch (error) {
            console.warn('⚠️ Blockchain no disponible, usando datos mock');
        }

        console.log('✅ Servicios inicializados');
    }

    /**
     * Carga datos iniciales
     */
    async loadInitialData() {
        try {
            // Cargar datos de bodegas
            const bodegasResponse = await fetch('/src/data/bodegas.json');
            const bodegasData = await bodegasResponse.json();
            
            // Cargar bodegas en el mapa
            await window.mapService.loadBodegas(bodegasData.bodegas);

            // Cargar datos blockchain (real o mock)
            let blockchainData;
            if (window.blockchainService.isConnected) {
                blockchainData = await window.blockchainService.loadInitialData();
            } else {
                blockchainData = window.blockchainService.getMockData();
            }

            // Cargar nodos en el mapa
            if (blockchainData.peers) {
                const nodesWithCoords = this.assignCoordinatesToNodes(blockchainData.peers, bodegasData.bodegas);
                window.mapService.loadBlockchainNodes(nodesWithCoords);
            }

            // Actualizar métricas
            this.updateMetrics(bodegasData, blockchainData);

            console.log('✅ Datos iniciales cargados');
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            // Cargar datos de respaldo
            await this.loadFallbackData();
        }
    }

    /**
     * Asigna coordenadas a nodos blockchain basándose en bodegas
     */
    assignCoordinatesToNodes(nodes, bodegas) {
        return nodes.map((node, index) => {
            // Usar coordenadas de bodegas o generar aleatorias cerca
            const bodega = bodegas[index % bodegas.length];
            
            return {
                ...node,
                lat: bodega ? bodega.location.lat + (Math.random() - 0.5) * 0.1 : 40.4168 + (Math.random() - 0.5) * 2,
                lng: bodega ? bodega.location.lng + (Math.random() - 0.5) * 0.1 : -3.7038 + (Math.random() - 0.5) * 2,
                port: 3001 + index,
                status: 'active'
            };
        });
    }

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
        window.addEventListener('bodega:selected', (event) => {
            this.handleBodegaSelected(event.detail);
        });

        // Eventos blockchain
        window.addEventListener('blockchain:newBlock', (event) => {
            this.handleNewBlock(event.detail);
        });

        window.addEventListener('blockchain:newTransaction', (event) => {
            this.handleNewTransaction(event.detail);
        });

        // Controles de timeline
        const timelineRange = document.getElementById('timelineRange');
        if (timelineRange) {
            timelineRange.addEventListener('input', (e) => {
                this.handleTimelineChange(e.target.value);
            });
        }

        // Botón de timeline play/pause
        const timelinePlay = document.getElementById('timelinePlay');
        if (timelinePlay) {
            timelinePlay.addEventListener('click', () => {
                this.toggleTimelinePlayback();
            });
        }

        // Filtros de capas
        document.querySelectorAll('.layer-filter').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.toggleLayer(e.target.dataset.layer, e.target.checked);
            });
        });
    }

    /**
     * Configura controles adicionales
     */
    setupControls() {
        // Configurar búsqueda
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Configurar filtros
        const filterSelects = document.querySelectorAll('.filter-select');
        filterSelects.forEach(select => {
            select.addEventListener('change', (e) => {
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
        const modal = document.getElementById('bodegaModal');
        const closeBtn = modal?.querySelector('.close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeBodegaModal();
            });
        }

        // Cerrar al hacer click fuera
        window.addEventListener('click', (e) => {
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
        const modal = document.getElementById('bodegaModal');
        const content = modal?.querySelector('.modal-content');
        
        if (content) {
            content.innerHTML = `
                <span class="close">&times;</span>
                <div class="bodega-details">
                    <header class="bodega-header">
                        <h2>${bodega.nombre}</h2>
                        <span class="bodega-status ${bodega.blockchain?.status}">
                            ${bodega.blockchain?.status || 'Desconocido'}
                        </span>
                    </header>
                    
                    <div class="bodega-info">
                        <div class="info-section">
                            <h3>📍 Ubicación</h3>
                            <p><strong>Región:</strong> ${bodega.region}</p>
                            <p><strong>Coordenadas:</strong> ${bodega.ubicacion.lat.toFixed(4)}, ${bodega.ubicacion.lng.toFixed(4)}</p>
                        </div>
                        
                        <div class="info-section">
                            <h3>🍷 Inventario</h3>
                            <p><strong>Botellas:</strong> ${bodega.inventario?.botellas || 0}</p>
                            <p><strong>Variedades:</strong> ${bodega.inventario?.variedades || 0}</p>
                            <p><strong>Valor total:</strong> €${bodega.inventario?.valorTotal || 0}</p>
                        </div>
                        
                        <div class="info-section">
                            <h3>⛓️ Blockchain</h3>
                            <p><strong>Estado:</strong> ${bodega.blockchain?.status || 'N/A'}</p>
                            <p><strong>Dirección:</strong> ${bodega.blockchain?.address || 'N/A'}</p>
                            <p><strong>Último bloque:</strong> ${bodega.blockchain?.lastBlock || 'N/A'}</p>
                        </div>
                    </div>
                    
                    <div class="bodega-actions">
                        <button onclick="dashboardService.viewBodegaTransactions('${bodega.id}')">
                            Ver Transacciones
                        </button>
                        <button onclick="dashboardService.viewBodegaInventory('${bodega.id}')">
                            Ver Inventario
                        </button>
                        <button onclick="dashboardService.verifyBodegaQR('${bodega.id}')">
                            Verificar QR
                        </button>
                    </div>
                </div>
            `;
            
            // Reconfigurar el botón close
            const closeBtn = content.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.closeBodegaModal();
                });
            }
        }
        
        if (modal) {
            modal.style.display = 'block';
        }
    }

    /**
     * Cierra modal de bodega
     */
    closeBodegaModal() {
        const modal = document.getElementById('bodegaModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Actualiza sidebar con información de bodega
     */
    updateSidebarWithBodega(bodega) {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        // Crear sección de bodega seleccionada si no existe
        let selectedSection = sidebar.querySelector('.selected-bodega');
        if (!selectedSection) {
            selectedSection = document.createElement('div');
            selectedSection.className = 'selected-bodega';
            sidebar.insertBefore(selectedSection, sidebar.firstChild);
        }

        selectedSection.innerHTML = `
            <h3>🍷 Bodega Seleccionada</h3>
            <div class="selected-bodega-info">
                <h4>${bodega.nombre}</h4>
                <p>${bodega.region}</p>
                <div class="quick-stats">
                    <div class="stat">
                        <span class="stat-value">${bodega.inventario?.botellas || 0}</span>
                        <span class="stat-label">Botellas</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">${bodega.blockchain?.status || 'N/A'}</span>
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
        this.showNotification('Nuevo bloque minado', 'success');
    }

    /**
     * Maneja nuevas transacciones
     */
    handleNewTransaction(transactionData) {
        this.metrics.pendingTransactions = (this.metrics.pendingTransactions || 0) + 1;
        this.updateMetricsDisplay();
        
        // Mostrar notificación
        this.showNotification('Nueva transacción detectada', 'info');
    }

    /**
     * Actualiza métricas del sistema
     */
    updateMetrics(bodegasData = null, blockchainData = null) {
        if (bodegasData) {
            this.metrics.totalBodegas = bodegasData.bodegas?.length || 0;
            this.metrics.activeBodegas = bodegasData.bodegas?.filter(b => 
                b.blockchain?.status === 'active'
            ).length || 0;
        }

        if (blockchainData) {
            this.metrics.totalBlocks = blockchainData.blocks?.length || 0;
            this.metrics.activeNodes = blockchainData.peers?.length || 0;
            this.metrics.pendingTransactions = blockchainData.transactions?.length || 0;
        }

        this.metrics.networkStatus = window.blockchainService.isConnected ? 'connected' : 'disconnected';
        
        this.updateMetricsDisplay();
    }

    /**
     * Actualiza visualización de métricas
     */
    updateMetricsDisplay() {
        // Actualizar contadores en sidebar
        this.updateCounter('.total-bodegas .metric-value', this.metrics.totalBodegas);
        this.updateCounter('.active-bodegas .metric-value', this.metrics.activeBodegas);
        this.updateCounter('.total-blocks .metric-value', this.metrics.totalBlocks);
        this.updateCounter('.active-nodes .metric-value', this.metrics.activeNodes);
        this.updateCounter('.pending-transactions .metric-value', this.metrics.pendingTransactions);

        // Actualizar estado de conexión
        const statusElement = document.querySelector('.network-status .metric-value');
        if (statusElement) {
            statusElement.textContent = this.metrics.networkStatus;
            statusElement.className = `metric-value ${this.metrics.networkStatus}`;
        }
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
        console.log('📅 Timeline cambiado a:', value);
        // Implementar filtrado temporal
    }

    /**
     * Toggle reproducción del timeline
     */
    toggleTimelinePlayback() {
        const button = document.getElementById('timelinePlay');
        if (button) {
            const isPlaying = button.textContent === '⏸️';
            button.textContent = isPlaying ? '▶️' : '⏸️';
            
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
        console.log('▶️ Iniciando reproducción timeline');
    }

    /**
     * Detiene reproducción del timeline
     */
    stopTimelinePlayback() {
        console.log('⏸️ Deteniendo reproducción timeline');
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
        console.log('🔍 Búsqueda:', query);
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
        console.log('💰 Ver transacciones:', bodegaId);
        // Implementar vista de transacciones
    }

    /**
     * Ver inventario de bodega
     */
    viewBodegaInventory(bodegaId) {
        console.log('📦 Ver inventario:', bodegaId);
        // Implementar vista de inventario
    }

    /**
     * Verificar QR de bodega
     */
    verifyBodegaQR(bodegaId) {
        console.log('📱 Verificar QR:', bodegaId);
        // Implementar verificación QR
    }

    /**
     * Muestra notificación
     */
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
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
        console.log('🔄 Cargando datos de respaldo...');
        
        // Datos de respaldo básicos
        const fallbackBodegas = [
            {
                id: 'emergency_001',
                nombre: 'Bodega Demo',
                region: 'Sistema',
                ubicacion: { lat: 40.4168, lng: -3.7038 },
                blockchain: { status: 'demo' },
                inventario: { botellas: 100, variedades: 5, valorTotal: 5000 }
            }
        ];

        await window.mapService.loadBodegas(fallbackBodegas);
        
        this.updateMetrics(
            { bodegas: fallbackBodegas },
            window.blockchainService.getMockData()
        );
    }

    /**
     * Maneja errores de inicialización
     */
    handleInitializationError(error) {
        console.error('💥 Error crítico en inicialización:', error);
        
        // Mostrar mensaje de error al usuario
        const errorDiv = document.createElement('div');
        errorDiv.className = 'initialization-error';
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
        } catch (error) {
            console.error('❌ Error en actualización periódica:', error);
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