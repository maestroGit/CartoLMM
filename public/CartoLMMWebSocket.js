/**
 * CartoLMMWebSocket - Cliente WebSocket
 * Integración en tiempo real con blockchain magnumsmaster
 * Extraído de app.js para mantener responsabilidades separadas.
 */

class CartoLMMWebSocket {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        
        // Elementos DOM para feedback visual
        this.connectionStatus = document.getElementById('connection-status');
        this.metricsDisplay = document.getElementById('metrics-display');
        // Eliminados: controles de timeline y filtros
        
        this.init();
    }
    
    /**
     * 🚀 Inicializar conexión WebSocket
     */
    init() {
        console.log('🔌 Inicializando WebSocket CartoLMM...');
        
        try {
            // Detectar si estamos en Live Server o CartoLMM server
            const socketUrl = typeof apiBaseUrl !== 'undefined' ? apiBaseUrl : undefined;
            console.log('🔌 Conectando WebSocket a:', socketUrl || 'mismo servidor');
            
            // Inicializar Socket.io
            this.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true
            });
            
            this.setupEventHandlers();
            
        } catch (error) {
            console.error('❌ Error inicializando WebSocket:', error);
            this.updateConnectionStatus('error', 'Error de conexión');
        }
    }
    
    /**
     * 📡 Configurar handlers de eventos
     * (Eliminados: listeners de controles de timeline y filtros)
     */
    setupEventHandlers() {
        // Conexión establecida
        this.socket.on('connect', () => {
            console.log('✅ WebSocket conectado:', this.socket.id);
            console.log('🔗 URL conectada:', this.socket.io.engine.hostname + ':' + this.socket.io.engine.port);
            this.connected = true;
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected', 'Conectado en tiempo real');
            
            // Solicitar datos iniciales
            this.requestInitialData();
        });
        
        // Desconexión
        this.socket.on('disconnect', (reason) => {
            console.log('❌ WebSocket desconectado:', reason);
            this.connected = false;
            this.updateConnectionStatus('disconnected', `Desconectado: ${reason}`);
            
            // Intentar reconexión automática
            this.handleReconnection();
        });
        
        // Errores de conexión
        this.socket.on('connect_error', (error) => {
            console.error('🔴 Error de conexión WebSocket:', error);
            console.error('🔴 Detalles del error:', {
                message: error.message,
                type: error.type,
                description: error.description
            });
            this.updateConnectionStatus('error', 'Error de conexión');
        });
        
        // Sistema: Estado inicial
        this.socket.on('system:connected', (data) => {
            console.log('🎉 Sistema conectado:', data);
            // Mensaje de bienvenida eliminado
        });

        // Blockchain: Datos iniciales
        this.socket.on('blockchain:initial-data', (data) => {
            console.log('[DEBUG] Evento blockchain:initial-data recibido:', data);
            if (data && data.data) {
                const blocks = Array.isArray(data.data.blocks) ? data.data.blocks : [];
                const transactions = Array.isArray(data.data.transactions) ? data.data.transactions : [];
                console.log(`[DEBUG] Bloques recibidos: ${blocks.length}`);
                console.log(`[DEBUG] Transacciones recibidas: ${transactions.length}`);
                const blocksCounter = document.getElementById('blocks-counter');
                if (blocksCounter) {
                    blocksCounter.textContent = blocks.length;
                    console.log(`[DEBUG] blocks-counter actualizado a: ${blocks.length}`);
                } else {
                    console.warn('[DEBUG] No se encontró el elemento blocks-counter');
                }
                const txCounter = document.getElementById('transactions-counter');
                if (txCounter) {
                    txCounter.textContent = transactions.length;
                    console.log(`[DEBUG] transactions-counter actualizado a: ${transactions.length}`);
                } else {
                    console.warn('[DEBUG] No se encontró el elemento transactions-counter');
                }
            } else {
                console.warn('[DEBUG] No se recibieron datos válidos en blockchain:initial-data');
            }
            this.handleInitialData(data);
        });
        
        // Sistema: Métricas
        this.socket.on('system:metrics', (metrics) => {
            console.log('📈 Métricas del sistema:', metrics);
            this.updateMetrics(metrics);
        });
        
        // Actualizar contador de bloques en tiempo real
        let lastBlocksCount = null;
        this.socket.on('blockchain:blocks-update', (data) => {
            const blocksCounter = document.getElementById('blocks-counter');
            if (data && typeof data.error === 'string' && data.error.includes('429')) {
                // Mantener el último valor válido
                if (blocksCounter && lastBlocksCount !== null) {
                    blocksCounter.textContent = lastBlocksCount;
                }
                return;
            }
            if (data && Array.isArray(data.blocks)) {
                if (blocksCounter) {
                    blocksCounter.textContent = data.blocks.length;
                    lastBlocksCount = data.blocks.length;
                }
            }
        });

        // Actualizar contador de transacciones en tiempo real
        let lastTxCount = null;
        this.socket.on('blockchain:transactions-update', (data) => {
            const txCounter = document.getElementById('transactions-counter');
            if (data && typeof data.error === 'string' && data.error.includes('429')) {
                // Mantener el último valor válido
                if (txCounter && lastTxCount !== null) {
                    txCounter.textContent = lastTxCount;
                }
                return;
            }
            if (data && Array.isArray(data.transactions)) {
                if (txCounter) {
                    txCounter.textContent = data.transactions.length;
                    lastTxCount = data.transactions.length;
                }
            }
        });
        
        this.socket.on('data:transactions', (data) => {
            console.log('💸 Datos de transacciones:', data);
            this.updateTransactionsDisplay(data);
        });
        
        this.socket.on('data:blocks', (data) => {
            console.log('🧱 Datos de bloques:', data);
            this.updateBlocksDisplay(data);
        });
        
        // Ping/Pong para mantener conexión
        this.socket.on('pong', (data) => {
            console.log('🏓 Pong recibido:', data.timestamp);
        });
    }
    
    /**
     * 🔄 Manejo de reconexión
     * (Eliminados: funciones de play/pause, slider, filtros)
     */
    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`🔄 Reintentando conexión ${this.reconnectAttempts}/${this.maxReconnectAttempts} en ${delay}ms...`);
            this.updateConnectionStatus('reconnecting', `Reconectando... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (!this.connected) {
                    this.socket.connect();
                }
            }, delay);
        } else {
            console.error('💀 Máximo de reintentos alcanzado');
            this.updateConnectionStatus('failed', 'Conexión fallida');
        }
    }
    
    /**
     * 📄 Solicitar datos iniciales
     */
    requestInitialData() {
        // Suscribirse a actualizaciones en tiempo real
        this.socket.emit('client:subscribe', { 
            channel: 'blockchain-updates',
            events: ['newTransaction', 'newBlock', 'peerEvent']
        });
        
        // Iniciar ping periódico
        this.startPingInterval();
    }
    
    /**
     * 🏓 Iniciar ping periódico
     */
    startPingInterval() {
        setInterval(() => {
            if (this.connected) {
                this.socket.emit('ping');
            }
        }, 30000); // Ping cada 30 segundos
    }
    
    /**
     * 🎯 Actualizar estado de conexión visual
     */
    updateConnectionStatus(status, message) {
        if (!this.connectionStatus) return;
        
        const statusColors = {
            connected: '#4CAF50',
            disconnected: '#FF9800',
            error: '#F44336',
            reconnecting: '#2196F3',
            failed: '#B71C1C'
        };
        
        const statusIcons = {
            connected: '🟢',
            disconnected: '🟡',
            error: '🔴',
            reconnecting: '🔄',
            failed: '💀'
        };
        
        this.connectionStatus.style.backgroundColor = statusColors[status] || '#666';
        this.connectionStatus.innerHTML = `
            ${statusIcons[status] || '⚪'} ${message}
        `;
        
        // Animación para estados transitorios
        if (status === 'reconnecting') {
            this.connectionStatus.classList.add('pulse');
        } else {
            this.connectionStatus.classList.remove('pulse');
        }
    }
    
    /**
     * 🎉 Mostrar mensaje de bienvenida
     */
    displayWelcomeMessage(data) {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'welcome-message';
        welcomeDiv.innerHTML = `
            <div class="welcome-content">
                <h3>🎉 ${data.message}</h3>
                <p><strong>Cliente ID:</strong> ${data.clientId}</p>
                <p><strong>Características disponibles:</strong></p>
                <ul>
                    ${Object.entries(data.features).map(([key, value]) => 
                        `<li>${value ? '✅' : '❌'} ${key}</li>`
                    ).join('')}
                </ul>
                <small>Conectado: ${new Date(data.timestamp).toLocaleString()}</small>
            </div>
        `;
        
        // Mostrar temporalmente y luego ocultar
        document.body.appendChild(welcomeDiv);
        setTimeout(() => {
            welcomeDiv.classList.add('fade-out');
            setTimeout(() => welcomeDiv.remove(), 3000);
        }, 5000);
    }
    
    /**
     * ⚠️ Mostrar error
     */
    displayError(data) {
        console.error('Sistema error:', data);
        // Implementar notificación de error visual
    }
    
    /**
     * 💰 Manejar nueva transacción
     */
    handleNewTransaction(transaction) {
        console.log('🔥 Procesando nueva transacción:', transaction);
        
        // Actualizar mapa si tiene coordenadas y el mapa está disponible
        if (transaction.lat && transaction.lng && window.cartoLMMMap) {
            console.log('🗺️ Agregando transacción al mapa...');
            window.cartoLMMMap.addTransactionMarker(transaction);
        } else if (window.cartoLMMMap) {
            console.log('⚠️ Transacción sin coordenadas:', transaction);
        } else {
            console.log('⚠️ Mapa aún no inicializado');
        }
        
        // Mostrar notificación
        this.showNotification(
            'Nueva Transacción', 
            `💰 ${transaction.amount} - ${transaction.metadata?.wine || transaction.type}`,
            'success'
        );
        
        // Actualizar estadísticas
        this.incrementCounter('transactions');
        
        // Agregar a actividad reciente
        this.addToRecentActivity('transaction', transaction);
    }
    
    /**
     * 🔗 Manejar nuevo bloque
     */
    handleNewBlock(block) {
        console.log('🔗 Procesando nuevo bloque:', block);
        
        // Actualizar mapa
        if (window.cartoLMMMap) {
            console.log('🗺️ Agregando bloque al mapa...');
            window.cartoLMMMap.addBlockMarker(block);
        }
        
        // Mostrar notificación
        this.showNotification(
            'Nuevo Bloque', 
            `🔗 Bloque #${block.index} - ${block.miner}`,
            'info'
        );
        
        // Actualizar estadísticas
        this.incrementCounter('blocks');
        this.updateLastBlock(block);
        
        // Agregar a actividad reciente
        this.addToRecentActivity('block', block);
    }
    
    /**
     * 🌐 Manejar evento de peer
     */
    handlePeerEvent(peerEvent) {
        const messages = {
            connected: `Nodo ${peerEvent.peer.id} conectado`,
            disconnected: `Nodo ${peerEvent.peer.id} desconectado`,
            sync_started: `Sincronización iniciada con ${peerEvent.peer.id}`,
            sync_completed: `Sincronización completada con ${peerEvent.peer.id}`
        };
        
        this.showNotification('Red', messages[peerEvent.type] || 'Evento de red', 'network');
    }
    
    /**
     * 📊 Manejar datos iniciales
     */
    handleInitialData(data) {
        console.log('Procesando datos iniciales...');
        // Actualizar dashboard con datos iniciales
        if (data.data && typeof window.updateDashboard === 'function') {
            window.updateDashboard(data.data);
        }
        // Inicializar contadores si hay datos
        if (data.data && data.data.blocks) {
            const blocksCounter = document.getElementById('blocks-counter');
            if (blocksCounter) {
                blocksCounter.textContent = data.data.blocks.length;
            }
        }
        if (data.data && data.data.transactions) {
            const txCounter = document.getElementById('transactions-counter');
            if (txCounter) {
                txCounter.textContent = data.data.transactions.length;
            }
        }
    }
    
    /**
     * 📈 Actualizar métricas
     */
    updateMetrics(metrics) {
        if (!this.metricsDisplay) return;
        // Mostrar el panel si está oculto
        this.metricsDisplay.style.display = '';
        // Update individual values in the overlay instead of injecting full cards
        // Keep the overlay element present so other scripts can reference it.
        // If specific sub-elements are present, update them; otherwise keep the panel visible.
        try {
            // Example: if there are elements for quick display, update them.
            const overlayNodesEl = this.metricsDisplay.querySelector('.overlay-nodes');
            if (overlayNodesEl) overlayNodesEl.textContent = metrics.network.activeNodes;

            const overlayBlocksEl = this.metricsDisplay.querySelector('.overlay-blocks');
            if (overlayBlocksEl) overlayBlocksEl.textContent = metrics.network.blockHeight;

            const overlayTxEl = this.metricsDisplay.querySelector('.overlay-tx');
            if (overlayTxEl) overlayTxEl.textContent = metrics.network.totalTransactions;
        } catch (err) {
            console.warn('Error updating overlay metric elements:', err);
        }

        const networkData = metrics?.network || {};
        const ipsFromArray = Array.isArray(networkData.activeNodeIps)
            ? networkData.activeNodeIps
                .filter((ip) => typeof ip === 'string' && ip.trim().length > 0)
                .map((ip) => ip.trim())
            : [];

        const ipsFromDetails = Array.isArray(networkData.activeNodeDetails)
            ? networkData.activeNodeDetails
                .map((node) => {
                    if (typeof node?.ip === 'string' && node.ip.trim().length > 0) {
                        return node.ip.trim();
                    }
                    if (typeof node?.httpUrl === 'string' && node.httpUrl.trim().length > 0) {
                        try {
                            return new URL(node.httpUrl.trim()).hostname;
                        } catch {
                            return null;
                        }
                    }
                    return null;
                })
                .filter(Boolean)
            : [];

        const nodeEntries = Array.isArray(networkData.activeNodeDetails)
            ? networkData.activeNodeDetails
                .map((node, index) => {
                    let resolvedIp = null;
                    if (typeof node?.ip === 'string' && node.ip.trim().length > 0) {
                        resolvedIp = node.ip.trim();
                    } else if (typeof node?.httpUrl === 'string' && node.httpUrl.trim().length > 0) {
                        try {
                            resolvedIp = new URL(node.httpUrl.trim()).hostname;
                        } catch {
                            resolvedIp = null;
                        }
                    }

                    if (!resolvedIp) return null;

                    const resolvedNodeId =
                        typeof node?.nodeId === 'string' && node.nodeId.trim().length > 0
                            ? node.nodeId.trim()
                            : `peer-${index + 1}`;

                    return {
                        nodeId: resolvedNodeId,
                        ip: resolvedIp,
                    };
                })
                .filter(Boolean)
            : [];

        const uniqueNodeEntries = [];
        const seenNodeKeys = new Set();
        for (const entry of nodeEntries) {
            const key = `${entry.nodeId}|${entry.ip}`;
            if (!seenNodeKeys.has(key)) {
                uniqueNodeEntries.push(entry);
                seenNodeKeys.add(key);
            }
        }

        const uniqueIps = [...new Set([...ipsFromArray, ...ipsFromDetails])];
        const inferredActiveNodes = uniqueIps.length;
        const activeNodesValue =
            typeof networkData.activeNodes === 'number'
                ? networkData.activeNodes
                : (networkData.activeNodes !== '-' && networkData.activeNodes != null
                    ? networkData.activeNodes
                    : inferredActiveNodes || '-');

        // Actualizar el valor de nodos activos en el panel principal (sidebar)
        // Aumentar reintentos y delay para asegurar sincronización con el DOM
        function setActiveNodesValue(val, retries = 15) {
            const el = document.getElementById('active-nodes');
            if (el) {
                el.textContent = val;
            } else if (retries > 0) {
                setTimeout(() => setActiveNodesValue(val, retries - 1), 200);
            }
        }
        setActiveNodesValue(activeNodesValue);

        const activeNodeIpsEl = document.getElementById('active-node-ips');
        if (activeNodeIpsEl) {
            const nodesText = uniqueNodeEntries.length
                ? uniqueNodeEntries.map((entry) => `${entry.nodeId} (${entry.ip})`).join(', ')
                : (uniqueIps.length ? uniqueIps.join(', ') : '-');

            const expectedCount = Number.isFinite(Number(activeNodesValue))
                ? Number(activeNodesValue)
                : null;
            const detailedCount = uniqueNodeEntries.length || uniqueIps.length;
            const mismatchText =
                expectedCount !== null && detailedCount > 0 && expectedCount !== detailedCount
                    ? ` | ⚠️ desajuste: detalle ${detailedCount}/${expectedCount}`
                    : '';

            activeNodeIpsEl.textContent = `Nodos/IP activas: ${nodesText}${mismatchText}`;
        }
        // Se eliminó actualización del modal de bodega (feature retirada)
    }
    
    // Método updateBodegasDisplay eliminado (feature bodegas retirada)
    
    /**
     * 💸 Actualizar display de transacciones
     */
    updateTransactionsDisplay(data) {
        // Implementar lista de transacciones
    }
    
    /**
     * 🧱 Actualizar display de bloques
     */
    updateBlocksDisplay(data) {
        // Implementar lista de bloques
    }
    
    /**
     * 🔔 Mostrar notificación
     */
    showNotification(title, message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="notification-close">×</button>
        `;
        
        // Agregar al DOM
        document.body.appendChild(notification);
        
        // Auto-cerrar después de 5 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Botón de cerrar
        notification.querySelector('.notification-close').onclick = () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        };
    }
    
    /**
     * 🔢 Incrementar contador
     */
    incrementCounter(type) {
        const counterElement = document.getElementById(`${type}-counter`);
        if (counterElement) {
            const current = parseInt(counterElement.textContent) || 0;
            counterElement.textContent = current + 1;
        }
    }
    
    /**
     * 🔗 Actualizar último bloque
     */
    updateLastBlock(block) {
        const lastBlockElement = document.getElementById('last-block');
        if (lastBlockElement) {
            lastBlockElement.innerHTML = `
                <strong>Último Bloque:</strong> #${block.index}<br>
                <small>Hash: ${block.hash?.substring(0, 16)}...</small><br>
                <small>Minero: ${block.miner}</small><br>
                <small>Transacciones: ${block.transactions}</small>
            `;
        }
    }
    
    /**
     * 📝 Agregar a actividad reciente
     */
    addToRecentActivity(type, data) {
        const recentActivities = document.getElementById('recent-activities');
        if (!recentActivities) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        
        let content = '';
        switch (type) {
            case 'transaction':
                content = `
                    <div class="activity-icon">💰</div>
                    <div class="activity-content">
                        <strong>Nueva Transacción</strong>
                        <p>${data.metadata?.wine || data.type} - ${data.amount}</p>
                        <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
                    </div>
                `;
                break;
            case 'block':
                content = `
                    <div class="activity-icon">🔗</div>
                    <div class="activity-content">
                        <strong>Nuevo Bloque #${data.index}</strong>
                        <p>Minado por ${data.miner}</p>
                        <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
                    </div>
                `;
                break;
            case 'peer':
                content = `
                    <div class="activity-icon">🌐</div>
                    <div class="activity-content">
                        <strong>Evento de Red</strong>
                        <p>${data.type} - ${data.peer?.id}</p>
                        <small>${new Date(data.timestamp).toLocaleTimeString()}</small>
                    </div>
                `;
                break;
        }
        
        activityItem.innerHTML = content;
        
        // Agregar al inicio de la lista
        recentActivities.insertBefore(activityItem, recentActivities.firstChild);
        
        // Limitar a 10 elementos
        const items = recentActivities.querySelectorAll('.activity-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
        
        // Animación de entrada
        activityItem.style.opacity = '0';
        activityItem.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            activityItem.style.transition = 'all 0.3s ease';
            activityItem.style.opacity = '1';
            activityItem.style.transform = 'translateY(0)';
        }, 50);
    }
}

// Exponer globalmente para scripts no-modulares
window.CartoLMMWebSocket = CartoLMMWebSocket;
