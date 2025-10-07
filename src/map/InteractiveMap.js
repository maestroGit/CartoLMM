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
        this.magnusmasterAPI = null; // Se inicializará después
        this.layers = {
            bodegas: null,
            transactions: null,
            nodes: null,
            heatmap: null
        };
        this.markers = {
            bodegas: [],
            nodes: [],
            transactions: []
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
            bodega: '#8B0000',      // Vino tinto
            transaction: '#FFD700',  // Oro
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

        // Añadir capa por defecto
        osmLayer.addTo(this.map);

        // Control de capas
        L.control.layers(baseMaps).addTo(this.map);

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
            console.warn('⚠️ No se pudo conectar con magnumsmaster, usando datos mock:', error.message);
            this.magnusmasterAPI = this.createMockAPI();
        }
    }

    /**
     * 🎭 Crear API mock para desarrollo sin magnumsmaster
     */
    createMockAPI() {
        return {
            async getGeographicData() {
                return {
                    success: true,
                    data: {
                        nodes: [
                            {
                                id: 'mock-node-1',
                                name: 'Nodo Madrid',
                                lat: 40.4168,
                                lng: -3.7038,
                                city: 'Madrid',
                                status: 'online',
                                lastSeen: new Date().toISOString()
                            }
                        ]
                    }
                };
            },
            async getBlocks() {
                return {
                    success: true,
                    data: [
                        {
                            index: 0,
                            timestamp: new Date().toISOString(),
                            data: []
                        }
                    ]
                };
            },
            async getDashboardMetrics() {
                return {
                    success: true,
                    data: {
                        blocks: { success: true, data: [] },
                        transactions: { success: true, data: [] }
                    }
                };
            },
            async getAddressBalance(address) {
                return {
                    success: true,
                    data: { balance: 1000, address }
                };
            }
        };
    }

    /**
     * �📋 Configurar capas de datos
     */
    setupLayers() {
        // Capa de bodegas
        this.layers.bodegas = L.layerGroup();
        
        // Capa de transacciones
        this.layers.transactions = L.layerGroup();
        
        // Capa de nodos blockchain
        this.layers.nodes = L.layerGroup();
        
        // Añadir capas al mapa
        this.layers.bodegas.addTo(this.map);
        this.layers.transactions.addTo(this.map);
        this.layers.nodes.addTo(this.map);

        console.log('✅ Capas configuradas');
    }

    /**
     * 📊 Cargar datos iniciales
     */
    async loadInitialData() {
        try {
            // Cargar datos geográficos
            const geoData = await this.magnusmasterAPI.getGeographicData();
            if (geoData.success) {
                this.renderNodes(geoData.data.nodes);
            }

            // Cargar datos blockchain
            const blocks = await this.magnusmasterAPI.getBlocks();
            if (blocks.success) {
                this.processBlockchainData(blocks.data);
            }

            // Cargar bodegas (datos mock por ahora)
            this.loadBodegasData();

            console.log('✅ Datos iniciales cargados');

        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
        }
    }

    /**
     * 🍇 Cargar datos de bodegas españolas
     */
    loadBodegasData() {
        const bodegas = [
            {
                id: 'bodega-1',
                name: 'Bodegas Rioja Alta',
                lat: 42.4834,
                lng: -2.7451,
                region: 'La Rioja',
                tipo: 'Crianza',
                blockchain_address: '0x123...abc'
            },
            {
                id: 'bodega-2', 
                name: 'Marqués de Riscal',
                lat: 42.4961,
                lng: -2.6103,
                region: 'La Rioja',
                tipo: 'Reserva',
                blockchain_address: '0x456...def'
            },
            {
                id: 'bodega-3',
                name: 'Freixenet',
                lat: 41.3402,
                lng: 1.7058,
                region: 'Cataluña',
                tipo: 'Cava',
                blockchain_address: '0x789...ghi'
            },
            {
                id: 'bodega-4',
                name: 'Bodegas Vega Sicilia',
                lat: 41.6519,
                lng: -4.7245,
                region: 'Ribera del Duero',
                tipo: 'Gran Reserva',
                blockchain_address: '0xabc...123'
            },
            {
                id: 'bodega-5',
                name: 'Bodegas Torres',
                lat: 41.3167,
                lng: 1.6833,
                region: 'Cataluña', 
                tipo: 'Ecológico',
                blockchain_address: '0xdef...456'
            }
        ];

        this.renderBodegas(bodegas);
    }

    /**
     * 🍇 Renderizar bodegas en el mapa
     */
    renderBodegas(bodegas) {
        // Limpiar marcadores existentes
        this.clearMarkers('bodegas');

        bodegas.forEach(bodega => {
            // Icono personalizado para bodegas
            const bodegaIcon = L.divIcon({
                className: 'bodega-marker',
                html: `<div class="marker-bodega">
                    <span class="marker-icon">🍷</span>
                    <span class="marker-label">${bodega.name}</span>
                </div>`,
                iconSize: [120, 40],
                iconAnchor: [60, 40]
            });

            // Crear marcador
            const marker = L.marker([bodega.lat, bodega.lng], {
                icon: bodegaIcon
            });

            // Popup con información
            const popupContent = `
                <div class="bodega-popup">
                    <h3>🍷 ${bodega.name}</h3>
                    <p><strong>Región:</strong> ${bodega.region}</p>
                    <p><strong>Tipo:</strong> ${bodega.tipo}</p>
                    <p><strong>Blockchain:</strong> <code>${bodega.blockchain_address}</code></p>
                    <div class="popup-actions">
                        <button onclick="window.cartoMap.viewBodegaDetails('${bodega.id}')">Ver Detalles</button>
                        <button onclick="window.cartoMap.viewTransactions('${bodega.blockchain_address}')">Transacciones</button>
                    </div>
                </div>
            `;

            marker.bindPopup(popupContent);
            
            // Añadir a la capa
            this.layers.bodegas.addLayer(marker);
            this.markers.bodegas.push(marker);
        });

        console.log(`✅ ${bodegas.length} bodegas renderizadas`);
    }

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
                this.layers[type].removeLayer(marker);
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

        console.log('✅ Event handlers configurados');
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

    /**
     * 👁️ Ver detalles de bodega
     */
    viewBodegaDetails(bodegaId) {
        console.log('📋 Ver detalles de bodega:', bodegaId);
        // TODO: Implementar panel de detalles
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