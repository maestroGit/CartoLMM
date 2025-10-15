/**
 * Map Service para CartoLMM
 * Maneja la interacción con Leaflet y visualización de datos
 */

class MapService {
    constructor() {
        this.map = null;
        this.markers = {};
        this.layers = {};
        this.animations = [];
        this.defaultCenter = [40.4168, -3.7038]; // Madrid como centro de España
        this.defaultZoom = 6;
    }

    /**
     * Inicializa el mapa Leaflet
     */
    initialize(containerId = 'map') {
        try {
            // Crear el mapa
            this.map = L.map(containerId, {
                center: this.defaultCenter,
                zoom: this.defaultZoom,
                zoomControl: true,
                attributionControl: true
            });

            // Definir capas base
            const baseLayers = {
                "🗺️ OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors',
                    maxZoom: 18
                }),
                "🛰️ Satélite": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri',
                    maxZoom: 18
                })
            };

            // Agregar capa por defecto (OpenStreetMap)
            baseLayers["🗺️ OpenStreetMap"].addTo(this.map);

            // Guardar las capas base para el control
            this.baseLayers = baseLayers;

            // Crear capas organizadas
            this.setupLayers();

            // Configurar eventos
            this.setupEventListeners();

            console.log('🗺️ Mapa CartoLMM inicializado');
            return true;
        } catch (error) {
            console.error('❌ Error inicializando mapa:', error);
            return false;
        }
    }

    /**
     * Configura las capas del mapa
     */
    setupLayers() {
        // Capa de bodegas
        this.layers.bodegas = L.layerGroup().addTo(this.map);
        
        // Capa de nodos blockchain
        this.layers.blockchain = L.layerGroup().addTo(this.map);
        
        // Capa de conexiones/transacciones
        this.layers.connections = L.layerGroup().addTo(this.map);
        
        // Capa de animaciones
        this.layers.animations = L.layerGroup().addTo(this.map);

        // Control de capas
        const overlays = {
            "🍷 Bodegas": this.layers.bodegas,
            "⛓️ Red Blockchain": this.layers.blockchain
        };

        L.control.layers(this.baseLayers, overlays, { 
            position: 'topright',
            collapsed: false 
        }).addTo(this.map);
    }

    /**
     * Configura listeners de eventos
     */
    setupEventListeners() {
        // Eventos del mapa
        this.map.on('zoomend', () => {
            this.handleZoomChange();
        });

        this.map.on('moveend', () => {
            this.handleMapMove();
        });

        // Eventos blockchain
        window.addEventListener('blockchain:newBlock', (event) => {
            this.handleNewBlock(event.detail);
        });

        window.addEventListener('blockchain:newTransaction', (event) => {
            this.handleNewTransaction(event.detail);
        });

        window.addEventListener('blockchain:peerEvent', (event) => {
            this.handlePeerEvent(event.detail);
        });
    }

    /**
     * Carga y muestra las bodegas en el mapa
     */
    async loadBodegas(bodegasData) {
        try {
            if (!Array.isArray(bodegasData)) {
                console.warn('⚠️ Datos de bodegas no válidos');
                return;
            }

            this.layers.bodegas.clearLayers();

            bodegasData.forEach(bodega => {
                this.createBodegaMarker(bodega);
            });

            console.log(`🍷 ${bodegasData.length} bodegas cargadas en el mapa`);
        } catch (error) {
            console.error('❌ Error cargando bodegas:', error);
        }
    }

    /**
     * Crea marker para una bodega
     */
    createBodegaMarker(bodega) {
        const icon = L.divIcon({
            className: 'bodega-marker',
            html: `
                <div class="marker-container">
                    <div class="marker-icon" style="background-color: ${bodega.color || '#722F37'}">
                        🍷
                    </div>
                    <div class="marker-pulse"></div>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const marker = L.marker([bodega.location.lat, bodega.location.lng], { icon })
            .bindPopup(this.createBodegaPopup(bodega))
            .addTo(this.layers.bodegas);

        // Eventos del marker
        marker.on('click', () => {
            this.selectBodega(bodega);
        });

        this.markers[`bodega_${bodega.id}`] = marker;
    }

    /**
     * Crea popup para bodega
     */
    createBodegaPopup(bodega) {
        return `
            <div class="bodega-popup">
                <h3>${bodega.name}</h3>
                <p><strong>Región:</strong> ${bodega.region}</p>
                <p><strong>Blockchain:</strong> ${bodega.blockchain?.status || 'Desconocido'}</p>
                <div class="bodega-actions">
                    <button onclick="mapService.viewBodegaDetails('${bodega.id}')">
                        Ver Detalles
                    </button>
                    <button onclick="mapService.viewBodegaTransactions('${bodega.id}')">
                        Transacciones
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Carga nodos blockchain en el mapa
     */
    loadBlockchainNodes(nodesData) {
        try {
            this.layers.blockchain.clearLayers();

            if (!Array.isArray(nodesData)) {
                console.warn('⚠️ Datos de nodos no válidos');
                return;
            }

            nodesData.forEach(node => {
                this.createNodeMarker(node);
            });

            console.log(`⛓️ ${nodesData.length} nodos blockchain cargados`);
        } catch (error) {
            console.error('❌ Error cargando nodos:', error);
        }
    }

    /**
     * Crea marker para nodo blockchain
     */
    createNodeMarker(node) {
        const icon = L.divIcon({
            className: 'node-marker',
            html: `
                <div class="node-container ${node.status}">
                    <div class="node-icon">
                        ⛓️
                    </div>
                    <div class="node-status"></div>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker([node.lat, node.lng], { icon })
            .bindPopup(this.createNodePopup(node))
            .addTo(this.layers.blockchain);

        this.markers[`node_${node.id}`] = marker;
    }

    /**
     * Crea popup para nodo
     */
    createNodePopup(node) {
        return `
            <div class="node-popup">
                <h3>Nodo: ${node.id}</h3>
                <p><strong>Estado:</strong> <span class="status ${node.status}">${node.status}</span></p>
                <p><strong>Puerto:</strong> ${node.port || 'N/A'}</p>
                <p><strong>Peers:</strong> ${node.peers || 0}</p>
                <p><strong>Último bloque:</strong> ${node.lastBlock || 'N/A'}</p>
            </div>
        `;
    }

    /**
     * Anima una transacción entre dos puntos
     */
    animateTransaction(fromPoint, toPoint, transactionData) {
        try {
            const from = L.latLng(fromPoint.lat, fromPoint.lng);
            const to = L.latLng(toPoint.lat, toPoint.lng);

            // Crear línea de conexión
            const line = L.polyline([from, to], {
                color: '#10B981',
                weight: 3,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(this.layers.connections);

            // Crear partícula animada
            const particle = L.circleMarker(from, {
                radius: 8,
                color: '#F7931A',
                fillColor: '#FFB800',
                fillOpacity: 0.8
            }).addTo(this.layers.animations);

            // Animar partícula
            this.animateParticle(particle, from, to, 2000, () => {
                // Limpiar al completar
                this.layers.connections.removeLayer(line);
                this.layers.animations.removeLayer(particle);
            });

            // Auto-limpiar línea después de 5 segundos
            setTimeout(() => {
                if (this.layers.connections.hasLayer(line)) {
                    this.layers.connections.removeLayer(line);
                }
            }, 5000);

        } catch (error) {
            console.error('❌ Error animando transacción:', error);
        }
    }

    /**
     * Anima una partícula entre dos puntos
     */
    animateParticle(marker, from, to, duration, callback) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Interpolación lineal
            const lat = from.lat + (to.lat - from.lat) * progress;
            const lng = from.lng + (to.lng - from.lng) * progress;
            
            marker.setLatLng([lat, lng]);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else if (callback) {
                callback();
            }
        };
        
        animate();
    }

    /**
     * Maneja nuevos bloques
     */
    handleNewBlock(blockData) {
        console.log('🔗 Nuevo bloque en mapa:', blockData);
        
        // Crear efecto visual
        this.createBlockEffect();
        
        // Actualizar métricas
        this.updateMapMetrics();
    }

    /**
     * Maneja nuevas transacciones
     */
    handleNewTransaction(transactionData) {
        console.log('⚡ Nueva transacción en mapa:', transactionData);
        
        // Intentar animar la transacción si tenemos coordenadas
        this.tryAnimateTransaction(transactionData);
    }

    /**
     * Intenta animar una transacción basada en los datos
     */
    tryAnimateTransaction(transactionData) {
        try {
            // Buscar coordenadas de origen y destino
            const fromMarker = this.findMarkerByAddress(transactionData.from);
            const toMarker = this.findMarkerByAddress(transactionData.to);
            
            if (fromMarker && toMarker) {
                this.animateTransaction(
                    fromMarker.getLatLng(),
                    toMarker.getLatLng(),
                    transactionData
                );
            }
        } catch (error) {
            console.error('❌ Error animando transacción:', error);
        }
    }

    /**
     * Busca marker por dirección
     */
    findMarkerByAddress(address) {
        // Implementar lógica para encontrar markers por dirección blockchain
        // Por ahora retorna null
        return null;
    }

    /**
     * Crea efecto visual para nuevo bloque
     */
    createBlockEffect() {
        // Efecto de pulso en todos los nodos activos
        Object.values(this.markers).forEach(marker => {
            if (marker._icon && marker._icon.classList.contains('node-marker')) {
                marker._icon.classList.add('new-block-pulse');
                setTimeout(() => {
                    marker._icon.classList.remove('new-block-pulse');
                }, 1000);
            }
        });
    }

    /**
     * Selecciona una bodega
     */
    selectBodega(bodega) {
        console.log('🍷 Bodega seleccionada:', bodega);
        
        // Centrar mapa en la bodega
        this.map.setView([bodega.location.lat, bodega.location.lng], 10);
        
        // Disparar evento
        const event = new CustomEvent('bodega:selected', { detail: bodega });
        window.dispatchEvent(event);
    }

    /**
     * Ver detalles de bodega
     */
    viewBodegaDetails(bodegaId) {
        console.log('📋 Ver detalles de bodega:', bodegaId);
        // Implementar modal de detalles
    }

    /**
     * Ver transacciones de bodega
     */
    viewBodegaTransactions(bodegaId) {
        console.log('💰 Ver transacciones de bodega:', bodegaId);
        // Implementar vista de transacciones
    }

    /**
     * Maneja cambios de zoom
     */
    handleZoomChange() {
        const zoom = this.map.getZoom();
        
        // Ajustar tamaño de markers según zoom
        if (zoom < 8) {
            // Zoom out: markers más pequeños
            document.documentElement.style.setProperty('--marker-scale', '0.8');
        } else if (zoom > 12) {
            // Zoom in: markers más grandes
            document.documentElement.style.setProperty('--marker-scale', '1.2');
        } else {
            // Zoom normal
            document.documentElement.style.setProperty('--marker-scale', '1');
        }
    }

    /**
     * Maneja movimiento del mapa
     */
    handleMapMove() {
        // Lógica para carga bajo demanda de datos según región visible
    }

    /**
     * Actualiza métricas en el mapa
     */
    updateMapMetrics() {
        if (window.dashboardService) {
            window.dashboardService.updateMetrics();
        }
    }

    /**
     * Maneja eventos de peers
     */
    handlePeerEvent(eventData) {
        const { type, peer } = eventData;
        
        if (type === 'connected') {
            console.log('🟢 Peer conectado:', peer);
        } else if (type === 'disconnected') {
            console.log('🔴 Peer desconectado:', peer);
        }
        
        // Actualizar visualización de nodos
        this.updateNodeStatus(peer.id, type === 'connected' ? 'active' : 'inactive');
    }

    /**
     * Actualiza estado de un nodo
     */
    updateNodeStatus(nodeId, status) {
        const marker = this.markers[`node_${nodeId}`];
        if (marker && marker._icon) {
            marker._icon.className = marker._icon.className.replace(
                /(active|inactive)/g, 
                status
            );
        }
    }

    /**
     * Limpiar todas las capas
     */
    clearAllLayers() {
        Object.values(this.layers).forEach(layer => {
            layer.clearLayers();
        });
        this.markers = {};
    }

    /**
     * Destruye el mapa
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        this.markers = {};
        this.layers = {};
    }
}

// Instancia global
window.mapService = new MapService();