/**
 * 🗺️ CartoLMM Interactive Map - Visualización blockchain en tiempo real
 * Integra datos de magnumsmaster con mapas geográficos interactivos
 */

// Importar MagnusmasterAPI - se cargará dinámicamente
// import MagnusmasterAPI from '../api/magnusmasterAPI.js';

class CartoLMMMap {
    constructor(containerId = 'map') {
        this.containerId = containerId;
        this.map = null;
        this.magnusmasterAPI = null; // Se inicializará si el backend responde (sin mocks)
        this.layers = {
            nodes: null,
            heatmap: null
        };
        this.markers = {
            nodes: [],
        };
        this.isPlaying = false;
        this.currentTime = Date.now();
        this.timelineData = [];
        this.animationFrame = null;
        
        // Configuración del mapa
        this.config = {
            center: [40.4637, -3.7492], // Madrid, España
            zoom: 6,
            minZoom: 5,
            maxZoom: 18,
            zoomControl: true
        };
        
        // Colores para diferentes tipos de datos
        this.colors = {
            node: '#32CD32',        // Verde
            active: '#FF4500',      // Naranja activo
            inactive: '#808080'     // Gris inactivo
        };
    }

    /**
     * 🚀 Inicializar el mapa
     */
    async initialize() {
        try {
            console.log('🗺️ Inicializando CartoLMM Map...');
            
            // Inicializar Leaflet
            this.initializeLeaflet();
            
            // Inicializar API de magnumsmaster
            await this.initializeMagnusmasterAPI();
            
            // Configurar capas
            this.setupLayers();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            // Configurar eventos
            this.setupEventHandlers();
            
            // Iniciar actualizaciones en tiempo real
            this.startRealTimeUpdates();
            
            console.log('✅ CartoLMM Map inicializado exitosamente');
            
        } catch (error) {
            console.error('❌ Error inicializando mapa:', error);
            this.showError('Error inicializando el mapa');
        }
    }

    /**
     * 🗺️ Configurar Leaflet.js
     */
    initializeLeaflet() {
        // Crear el mapa
        this.map = L.map(this.containerId, {
            center: this.config.center,
            zoom: this.config.zoom,
            minZoom: this.config.minZoom,
            maxZoom: this.config.maxZoom,
            zoomControl: this.config.zoomControl,
            attributionControl: false
        });

        // Capa base - OpenStreetMap
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        // Capa satelital
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });

        // Capa topográfica
        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenTopoMap contributors'
        });

        // Control de capas base
        const baseMaps = {
            "🗺️ Mapa": osmLayer,
            "🛰️ Satélite": satelliteLayer,  
            "⛰️ Topográfico": topoLayer
        };

        // Guardar en la instancia para uso posterior (toggle, creación del control)
        this.baseMaps = baseMaps;

        // Añadir capa por defecto
        osmLayer.addTo(this.map);

    // Reservar el lugar para el control; lo crearemos en setupLayers donde
    // también conocemos las capas de overlay. De momento lo dejamos null.
    this.layersControl = null;

        // Control de escala
        L.control.scale({
            position: 'bottomleft',
            imperial: false
        }).addTo(this.map);

        console.log('✅ Leaflet inicializado');
    }

    /**
     * � Inicializar API de magnumsmaster
     */
    async initializeMagnusmasterAPI() {
        try {
            // Importar dinámicamente MagnusmasterAPI
            const { default: MagnusmasterAPI } = await import('../api/magnusmasterAPI.js');
            this.magnusmasterAPI = new MagnusmasterAPI();
            
            // Conectar con magnumsmaster
            await this.magnusmasterAPI.initialize();
            console.log('✅ MagnusmasterAPI inicializado');
            
        } catch (error) {
            // Simplificación: no usar mock. Solo log y mantener API nula.
            console.warn('⚠️ No se pudo conectar con magnumsmaster (mock deshabilitado):', error.message);
            this.magnusmasterAPI = null;
        }
    }

    // Mock API eliminado: se espera backend real. Si API falla, el mapa se
    // mantiene vacío y los métodos que dependen de magnusmasterAPI deben
    // comprobar null antes de usarla.

    /**
     * 📋 Configurar capas de datos
     */
    setupLayers() {
        // Capa de nodos blockchain
        this.layers.nodes = L.layerGroup();
        
        // NOTA: no añadimos las capas overlay al mapa por defecto. Queremos que
        // el mapa se cargue 'limpio' y que el usuario elija qué overlays activar
        // mediante el control que se mostrará al pulsar el botón.

        // Crear objeto overlays para el control de capas
        const overlays = {
            ' Nodos': this.layers.nodes
        };

    // Crear el control de capas (no lo añadimos al mapa todavía)
    this.layersControl = L.control.layers(this.baseMaps || null, overlays, { collapsed: false });

    // NOTE: do NOT add the control to the map here. The control should be
    // displayed only when the user explicitly toggles it via the UI button.
    // Previously this file added the control automatically which caused
    // race conditions with the global MapService. Leaving it un-attached
    // prevents unexpected auto-display.

        console.log('✅ Capas configuradas');
    }

    /**
     * 📊 Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            // Cargar datos geográficos (solo si hay API real)
            if (this.magnusmasterAPI && typeof this.magnusmasterAPI.getGeographicData === 'function') {
                const geoData = await this.magnusmasterAPI.getGeographicData();
                if (geoData?.success && Array.isArray(geoData.data?.nodes)) {
                    this.renderNodes(geoData.data.nodes);
                }
            }

            // Cargar datos blockchain (solo si hay API real)
            if (this.magnusmasterAPI && typeof this.magnusmasterAPI.getBlocks === 'function') {
                const blocks = await this.magnusmasterAPI.getBlocks();
                if (blocks?.success) {
                    this.processBlockchainData(blocks.data);
                }
            }

            console.log('✅ Datos iniciales cargados');

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
        }
    }

    // Métodos de bodegas eliminados como parte de la limpieza minimalista

    /**
     * 🔗 Renderizar nodos blockchain
     */
    renderNodes(nodes) {
        // Limpiar marcadores existentes
        this.clearMarkers('nodes');

        nodes.forEach(node => {
            // Determinar estado del nodo
            const isOnline = node.status === 'online';
            const nodeColor = isOnline ? this.colors.node : this.colors.inactive;

            // Icono de nodo
            const nodeIcon = L.divIcon({
                className: 'node-marker',
                html: `<div class="marker-node ${isOnline ? 'online' : 'offline'}">
                    <span class="marker-icon">🔗</span>
                    <span class="marker-pulse"></span>
                </div>`,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Crear marcador
            const marker = L.marker([node.lat, node.lng], {
                icon: nodeIcon
            });

            // Popup de nodo
            const popupContent = `
                <div class="node-popup">
                    <h3>🔗 ${node.name}</h3>
                    <p><strong>Estado:</strong> <span class="status ${node.status}">${node.status}</span></p>
                    <p><strong>Ciudad:</strong> ${node.city}</p>
                    <p><strong>Última conexión:</strong> ${new Date(node.lastSeen).toLocaleString()}</p>
                </div>
            `;

            marker.bindPopup(popupContent);
            
            // Añadir a la capa
            this.layers.nodes.addLayer(marker);
            this.markers.nodes.push(marker);
        });

        console.log(`✅ ${nodes.length} nodos renderizados`);
    }

    /**
     * 💰 Procesar datos blockchain para visualización
     */
    processBlockchainData(blocks) {
        if (!blocks || !Array.isArray(blocks)) return;

        // Procesar transacciones de los bloques
        const allTransactions = [];
        blocks.forEach(block => {
            if (block.data && Array.isArray(block.data)) {
                block.data.forEach(tx => {
                    allTransactions.push({
                        ...tx,
                        blockIndex: block.index,
                        timestamp: block.timestamp
                    });
                });
            }
        });

        this.timelineData = allTransactions;
        this.updateStats(blocks.length, allTransactions.length);
        
        console.log(`✅ ${blocks.length} bloques procesados, ${allTransactions.length} transacciones`);
    }

    /**
     * 📊 Actualizar estadísticas en tiempo real
     */
    updateStats(blockCount, txCount) {
        const blockCountEl = document.getElementById('block-count');
        const txCountEl = document.getElementById('tx-count');
        const nodeCountEl = document.getElementById('node-count');

        if (blockCountEl) blockCountEl.textContent = blockCount || 0;
        if (txCountEl) txCountEl.textContent = txCount || 0;
        if (nodeCountEl) nodeCountEl.textContent = this.markers.nodes.length || 0;
    }

    /**
     * 🔄 Limpiar marcadores de un tipo específico
     */
    clearMarkers(type) {
        if (this.markers[type]) {
            this.markers[type].forEach(marker => {
                if (this.layers[type]) {
                    this.layers[type].removeLayer(marker);
                }
            });
            this.markers[type] = [];
        }
    }

    /**
     * ⚡ Configurar eventos del mapa
     */
    setupEventHandlers() {
        // Timeline control
        const playPauseBtn = document.getElementById('play-pause');
        const timelineSlider = document.getElementById('timeline-slider');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        }

        if (timelineSlider) {
            timelineSlider.addEventListener('input', (e) => {
                this.updateTimelinePosition(parseInt(e.target.value));
            });
        }

        // Toggle layers control via UI button (starts hidden)
        const toggleLayersBtn = document.getElementById('toggle-layers');
        if (toggleLayersBtn) {
            // If another script already wired the button, skip to avoid duplicate handlers
            try {
                if (toggleLayersBtn.dataset && toggleLayersBtn.dataset.toggleWired === 'true') {
                    console.log('InteractiveMap: toggle-layers already wired by another script, skipping');
                } else {
                    toggleLayersBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.toggleLayersControl();
                    });
                }
            } catch (err) {
                // Fallback: attach listener if dataset access fails
                toggleLayersBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleLayersControl();
                });
            }
        }

        console.log('✅ Event handlers configurados');
    }

    /**
     * Mostrar / ocultar el control de capas
     */
    toggleLayersControl() {
        try {
            if (!this.layersControl) {
                // Si por alguna razón no está creado aún, crear un control basado
                // en las capas que tenemos configuradas.
                const overlays = {
                    ' Nodos': this.layers.nodes
                };
                this.layersControl = L.control.layers(this.baseMaps || null, overlays, { collapsed: false });
            }

            // Si el control está en el DOM (tiene map asociado), lo quitamos
            if (this.layersControl._map) {
                this.map.removeControl(this.layersControl);
                // También cerrar cualquier panel expandido (si aplica)
                const container = this.layersControl.getContainer && this.layersControl.getContainer();
                if (container) container.classList.remove('leaflet-control-layers-expanded');
            } else {
                // Añadir control al mapa (se abrirá con las opciones)
                this.layersControl.addTo(this.map);
            }
        } catch (err) {
            console.error('Error toggling layers control:', err);
        }
    }

    /**
     * ⏯️ Control de reproducción timeline
     */
    togglePlayPause() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('play-pause');
        
        if (this.isPlaying) {
            btn.textContent = '⏸️';
            this.startAnimation();
        } else {
            btn.textContent = '▶️';
            this.stopAnimation();
        }
    }

    /**
     * 🎬 Iniciar animación temporal
     */
    startAnimation() {
        if (this.animationFrame) return;

        const animate = () => {
            if (this.isPlaying) {
                // Actualizar posición del timeline
                // TODO: Implementar lógica de animación temporal
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * ⏹️ Detener animación
     */
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * 🔄 Iniciar actualizaciones en tiempo real
     */
    startRealTimeUpdates() {
        // Si no hay API, no iniciar el ciclo
        if (!this.magnusmasterAPI || typeof this.magnusmasterAPI.getDashboardMetrics !== 'function') {
            console.warn('⏭️ Actualizaciones en tiempo real deshabilitadas: API no disponible');
            return;
        }

        // Actualizar cada 10 segundos
        setInterval(async () => {
            try {
                const metrics = await this.magnusmasterAPI.getDashboardMetrics();
                if (metrics.success) {
                    this.updateConnectionStatus(true);
                    this.updateRealtimeData(metrics.data);
                } else {
                    this.updateConnectionStatus(false);
                }
            } catch (error) {
                console.error('Error actualizando datos:', error);
                this.updateConnectionStatus(false);
            }
        }, 10000);

        console.log('✅ Actualizaciones en tiempo real iniciadas');
    }

    /**
     * 🔌 Actualizar estado de conexión
     */
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        if (statusDot && statusText) {
            if (connected) {
                statusDot.className = 'status-dot online';
                statusText.textContent = 'Conectado';
            } else {
                statusDot.className = 'status-dot offline';
                statusText.textContent = 'Desconectado';
            }
        }
    }

    /**
     * 📊 Actualizar datos en tiempo real
     */
    updateRealtimeData(data) {
        if (data.blocks && data.blocks.success) {
            this.processBlockchainData(data.blocks.data);
        }

        // Actualizar otras métricas según necesidad
    }

    // Método legado conservado como no-op para compatibilidad
    viewBodegaDetails(bodegaId) {
        console.log('📋 Ver detalles de bodega (stub):', bodegaId);
    }

    /**
     * 💰 Ver transacciones de una dirección
     */
    async viewTransactions(address) {
        console.log('💰 Ver transacciones de:', address);
        try {
            const balance = await this.magnusmasterAPI.getAddressBalance(address);
            console.log('Balance:', balance);
            // TODO: Mostrar transacciones en panel lateral
        } catch (error) {
            console.error('Error obteniendo transacciones:', error);
        }
    }

    /**
     * 💰 Agregar marcador de transacción en tiempo real (WebSocket)
     */
    addTransactionMarker(transaction) {
        // Marcadores de transacción en tiempo real deshabilitados (simplificación).
        // Mantener firma para compatibilidad.
        return;
    }
    
    /**
     * 🔗 Agregar marcador de bloque en tiempo real (WebSocket)
     */
    addBlockMarker(block) {
        // Marcadores de bloque aleatorios deshabilitados (simplificación).
        return;
    }
    
    /**
     * 🌐 Actualizar nodos de red (WebSocket)
     */
    updateNetworkNodes(peerEvent) {
        console.log('🌐 Actualizando nodos de red:', peerEvent);
        
        // TODO: Implementar actualización visual de nodos
        // Por ahora solo log
    }
    
    

    /**
     * ❌ Mostrar error al usuario
     */
    showError(message) {
        console.error('🚨 Error:', message);
        // TODO: Implementar notificaciones de error
    }
}

// Exportar para uso global
export default CartoLMMMap;

// Hacer disponible globalmente para eventos HTML
window.CartoLMMMap = CartoLMMMap;