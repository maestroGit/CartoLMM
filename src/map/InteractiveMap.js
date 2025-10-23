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
            attributionControl: true
        });

        // Capa base - OpenStreetMap
        const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        });

        // Capa satelital
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
        });

        // Capa topográfica
        const topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a> contributors'
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
        
        // NOTA: no añadimos las capas overlay al mapa por defecto. Queremos que
        // el mapa se cargue 'limpio' y que el usuario elija qué overlays activar
        // mediante el control que se mostrará al pulsar el botón.

        // Crear objeto overlays para el control de capas
        const overlays = {
            '🍷 Bodegas': this.layers.bodegas,
            '💸 Transacciones': this.layers.transactions,
            '🔗 Nodos': this.layers.nodes
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
     * 🍇 Cargar datos de bodegas españolas desde archivo JSON
     */
    async loadBodegasData() {
        try {
            console.log('🍇 Cargando datos de bodegas desde JSON...');
            
            // Cargar datos del archivo JSON completo
            const response = await fetch('/src/data/bodegas.json');
            
            if (!response.ok) {
                throw new Error(`Error cargando bodegas: ${response.status}`);
            }
            
            const data = await response.json();
            const bodegas = data.bodegas;
            
            console.log(`✅ Cargadas ${bodegas.length} bodegas desde JSON`);
            
            // Crear marcadores para cada bodega
            bodegas.forEach((bodega, index) => {
                this.createBodegaMarker(bodega, index);
            });

            // Además, si el JSON contiene definición de nodos de red, renderizarlos
            // Esto permite que nodos que no estén asociados a una bodega (por ejemplo
            // ubicaciones en islas) se muestren en el mapa.
            if (data.network && Array.isArray(data.network.nodes) && data.network.nodes.length > 0) {
                try {
                    const nodes = data.network.nodes
                        .filter(n => typeof n.lat === 'number' && typeof n.lng === 'number')
                        .map(n => ({
                            lat: n.lat,
                            lng: n.lng,
                            name: n.nodeId || n.nodeId || n.node || 'Nodo',
                            status: n.status === 'idle' ? 'offline' : (n.status || 'offline'),
                            city: n.region || n.city || '',
                            lastSeen: n.lastSeen || new Date().toISOString()
                        }));

                    if (nodes.length > 0) {
                        console.log(`✅ Renderizando ${nodes.length} nodos desde JSON de red`);
                        this.renderNodes(nodes);
                    }
                } catch (err) {
                    console.warn('⚠️ Error procesando data.network.nodes:', err);
                }
            }
            
        } catch (error) {
            console.error('❌ Error cargando datos de bodegas:', error);
            console.log('🔄 Usando datos de fallback...');
            
            // Fallback: usar datos hardcodeados básicos
            this.loadFallbackBodegasData();
        }
    }
    
    /**
     * 🔄 Datos de fallback si no se puede cargar el JSON
     */
    loadFallbackBodegasData() {
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
     * 🍷 Crear marcador individual para bodega (desde JSON completo)
     */
    createBodegaMarker(bodega, index) {
        try {
            const lat = bodega.location.lat;
            const lng = bodega.location.lng;
            
            // Determinar icono y color según el tipo
            const icon = bodega.visual?.icon || '🍷';
            const color = bodega.visual?.color || '#722F37';
            const isGenesis = bodega.blockchain?.isGenesis || false;
            
            // Crear icono personalizado
            const bodegaIcon = L.divIcon({
                className: `bodega-marker ${isGenesis ? 'genesis-node' : 'winery-node'}`,
                html: `
                    <div class="marker-container">
                        <div class="marker-pulse" style="background: ${color}40;"></div>
                        <div class="marker-icon" style="background: ${color};">
                            ${icon}
                        </div>
                    </div>
                `,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            // Crear marcador
            const marker = L.marker([lat, lng], {
                icon: bodegaIcon
            });

            // Popup con información completa
            const popupContent = this.generateBodegaPopup(bodega);
            marker.bindPopup(popupContent);
            
            // Añadir a la capa correspondiente (no al mapa directamente) y arrays
            this.layers.bodegas.addLayer(marker);
            this.markers.bodegas.push(marker);
            
            console.log(`✅ Marcador creado: ${bodega.name} (${lat}, ${lng})`);
            
        } catch (error) {
            console.error(`❌ Error creando marcador para bodega ${bodega.name}:`, error);
        }
    }
    
    /**
     * 📋 Generar contenido del popup para bodega
     */
    generateBodegaPopup(bodega) {
        const isGenesis = bodega.blockchain?.isGenesis || false;
        const wines = bodega.wines || [];
        const inventory = bodega.inventory || {};
        
        return `
            <div class="bodega-popup">
                <h3>${bodega.visual?.icon || '🍷'} ${bodega.name}</h3>
                
                <div class="bodega-info">
                    <p><strong>📍 Región:</strong> ${bodega.region}</p>
                    <p><strong>🏷️ D.O.:</strong> ${bodega.denomination}</p>
                    ${bodega.contact?.terroir ? `<p><strong>🌱 Terroir:</strong> ${bodega.contact.terroir}</p>` : ''}
                    ${bodega.contact?.establecido ? `<p><strong>📅 Establecido:</strong> ${bodega.contact.establecido}</p>` : ''}
                </div>
                
                ${isGenesis ? `
                    <div class="genesis-info">
                        <h4>⛓️ Nodo Génesis</h4>
                        <p><strong>Puerto HTTP:</strong> ${bodega.blockchain.httpPort}</p>
                        <p><strong>Puerto P2P:</strong> ${bodega.blockchain.p2pPort}</p>
                        <p><strong>Estado:</strong> <span class="status ${bodega.blockchain.status}">${bodega.blockchain.status}</span></p>
                    </div>
                ` : `
                    <div class="inventory-info">
                        <h4>📦 Inventario</h4>
                        <p><strong>Stock:</strong> ${inventory.stockCustodiado || 0} botellas</p>
                        <p><strong>Valor:</strong> ${inventory.valorCustodia || '0 €'}</p>
                        <p><strong>Transacciones:</strong> ${inventory.transaccionesActivas || 0}</p>
                    </div>
                `}
                
                ${wines.length > 0 ? `
                    <div class="wines-info">
                        <h4>🍷 Vinos Disponibles</h4>
                        ${wines.slice(0, 3).map(wine => `
                            <div class="wine-item">
                                <strong>${wine.nombre}</strong> - ${wine.precio}
                                <small>(Stock: ${wine.stock})</small>
                            </div>
                        `).join('')}
                        ${wines.length > 3 ? `<small>... y ${wines.length - 3} más</small>` : ''}
                    </div>
                ` : ''}
                
                <div class="popup-actions">
                    <button onclick="window.cartoLMMMap.viewBodegaDetails('${bodega.id}')">📊 Ver Detalles</button>
                    ${bodega.blockchain?.nodeId ? `
                        <button onclick="window.cartoLMMMap.viewTransactions('${bodega.blockchain.nodeId}')">⛓️ Blockchain</button>
                    ` : ''}
                </div>
            </div>
        `;
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
                    '🍷 Bodegas': this.layers.bodegas,
                    '💸 Transacciones': this.layers.transactions,
                    '🔗 Nodos': this.layers.nodes
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
     * 💰 Agregar marcador de transacción en tiempo real (WebSocket)
     */
    addTransactionMarker(transaction) {
        console.log('🔥 Nueva transacción en mapa:', transaction);
        
        // Solo mostrar si tiene coordenadas
        if (!transaction.lat || !transaction.lng) {
            console.log('⚠️ Transacción sin coordenadas, skipping...');
            return;
        }
        
        try {
            // Crear marcador animado
            const marker = L.marker([transaction.lat, transaction.lng], {
                icon: L.divIcon({
                    className: 'transaction-marker realtime-marker',
                    html: `
                        <div class="marker-container">
                            <div class="marker-pulse"></div>
                            <div class="marker-icon" style="background: ${this.colors.transaction};">
                                💸
                            </div>
                        </div>
                    `,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                })
            });
            
            // Popup con información de transacción
            marker.bindPopup(`
                <div class="transaction-popup">
                    <h4>💰 Nueva Transacción</h4>
                    <p><strong>ID:</strong> ${transaction.id}</p>
                    <p><strong>Cantidad:</strong> ${transaction.amount}</p>
                    <p><strong>Tipo:</strong> ${transaction.type}</p>
                    ${transaction.bodega ? `<p><strong>Bodega:</strong> ${transaction.bodega}</p>` : ''}
                    ${transaction.metadata?.wine ? `<p><strong>Vino:</strong> ${transaction.metadata.wine}</p>` : ''}
                    <p><strong>Hora:</strong> ${new Date(transaction.timestamp).toLocaleString()}</p>
                </div>
            `).openPopup();
            
            // Añadir a la capa de transacciones (overlay)
            this.layers.transactions.addLayer(marker);
            this.markers.transactions.push(marker);

            // Auto-remover después de 30 segundos
            setTimeout(() => {
                try {
                    this.layers.transactions.removeLayer(marker);
                } catch (e) {
                    // ignore
                }
                const index = this.markers.transactions.indexOf(marker);
                if (index > -1) {
                    this.markers.transactions.splice(index, 1);
                }
            }, 30000);
            
            // Animar zoom a la transacción
            this.map.flyTo([transaction.lat, transaction.lng], 10, {
                animate: true,
                duration: 1.5
            });
            
        } catch (error) {
            console.error('❌ Error agregando marcador de transacción:', error);
        }
    }
    
    /**
     * 🔗 Agregar marcador de bloque en tiempo real (WebSocket)
     */
    addBlockMarker(block) {
        console.log('🔗 Nuevo bloque:', block);
        
        // Generar coordenadas aleatorias en España para demostración
        const lat = 40.0 + (Math.random() - 0.5) * 6;
        const lng = -4.0 + (Math.random() - 0.5) * 8;
        
        try {
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'block-marker realtime-marker',
                    html: `
                        <div class="marker-container">
                            <div class="marker-pulse block-pulse"></div>
                            <div class="marker-icon" style="background: ${this.colors.node};">
                                🔗
                            </div>
                        </div>
                    `,
                    iconSize: [35, 35],
                    iconAnchor: [17, 17]
                })
            });
            
            marker.bindPopup(`
                <div class="block-popup">
                    <h4>🔗 Nuevo Bloque</h4>
                    <p><strong>Índice:</strong> ${block.index}</p>
                    <p><strong>Hash:</strong> ${block.hash?.substring(0, 16)}...</p>
                    <p><strong>Transacciones:</strong> ${block.transactions}</p>
                    <p><strong>Minero:</strong> ${block.miner}</p>
                    <p><strong>Recompensa:</strong> ${block.reward}</p>
                    <p><strong>Hora:</strong> ${new Date(block.timestamp).toLocaleString()}</p>
                </div>
            `);
            
            // Añadir a la capa de nodos (overlay)
            this.layers.nodes.addLayer(marker);
            this.markers.nodes.push(marker);

            // Auto-remover después de 60 segundos
            setTimeout(() => {
                try {
                    this.layers.nodes.removeLayer(marker);
                } catch (e) {
                    // ignore
                }
                const index = this.markers.nodes.indexOf(marker);
                if (index > -1) {
                    this.markers.nodes.splice(index, 1);
                }
            }, 60000);
            
        } catch (error) {
            console.error('❌ Error agregando marcador de bloque:', error);
        }
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
     * 📊 Ver detalles de bodega
     */
    viewBodegaDetails(bodegaId) {
        console.log('📊 Ver detalles de bodega:', bodegaId);
        // TODO: Implementar panel lateral con detalles completos
        // Por ahora solo mostrar en consola
        
        // Buscar la bodega en los datos
        // En el futuro esto vendrá de una base de datos
        alert(`🍷 Detalles de bodega: ${bodegaId}\n\n📊 Panel de detalles próximamente disponible.\n\n🔧 Funcionalidad planificada para el CRUD de bodegas.`);
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