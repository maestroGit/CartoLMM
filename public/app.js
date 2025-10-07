/**
 * CartoLMM - Cliente WebSocket 
 * Integración en tiempo real con blockchain magnumsmaster
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
        
        this.init();
    }
    
    /**
     * 🚀 Inicializar conexión WebSocket
     */
    init() {
        console.log('🔌 Inicializando WebSocket CartoLMM...');
        
        try {
            // Detectar si estamos en Live Server o CartoLMM server
            const socketUrl = window.location.port === '5500' ? 'http://localhost:8080' : undefined;
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
            this.displayWelcomeMessage(data);
        });
        
        // Sistema: Error
        this.socket.on('system:error', (data) => {
            console.error('⚠️ Error del sistema:', data);
            this.displayError(data);
        });
        
        // Blockchain: Nueva transacción
        this.socket.on('blockchain:newTransaction', (transaction) => {
            console.log('💰 Nueva transacción:', transaction);
            this.handleNewTransaction(transaction);
        });
        
        // Blockchain: Nuevo bloque
        this.socket.on('blockchain:newBlock', (block) => {
            console.log('🔗 Nuevo bloque:', block);
            this.handleNewBlock(block);
        });
        
        // Blockchain: Evento de peer
        this.socket.on('blockchain:peerEvent', (peerEvent) => {
            console.log('🌐 Evento peer:', peerEvent);
            this.handlePeerEvent(peerEvent);
        });
        
        // Blockchain: Datos iniciales
        this.socket.on('blockchain:initial-data', (data) => {
            console.log('📊 Datos iniciales blockchain:', data);
            this.handleInitialData(data);
        });
        
        // Sistema: Métricas
        this.socket.on('system:metrics', (metrics) => {
            console.log('📈 Métricas del sistema:', metrics);
            this.updateMetrics(metrics);
        });
        
        // Respuesta a solicitudes de datos
        this.socket.on('data:bodegas', (data) => {
            console.log('🍷 Datos de bodegas:', data);
            this.updateBodegasDisplay(data);
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
        // Solicitar datos de bodegas
        this.socket.emit('client:requestData', { type: 'bodegas' });
        
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
    }
    
    /**
     * 📈 Actualizar métricas
     */
    updateMetrics(metrics) {
        if (!this.metricsDisplay) return;
        
        const metricsHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>🌐 Red</h4>
                    <p>Nodos: ${metrics.network.activeNodes}</p>
                    <p>Altura: ${metrics.network.blockHeight}</p>
                    <p>Hash Rate: ${metrics.network.hashRate}</p>
                </div>
                <div class="metric-card">
                    <h4>🍷 Bodegas</h4>
                    <p>Total: ${metrics.bodegas.total}</p>
                    <p>Activas: ${metrics.bodegas.active}</p>
                    <p>Producción: ${metrics.bodegas.totalProduction.toLocaleString()}</p>
                </div>
                <div class="metric-card">
                    <h4>💰 Transacciones</h4>
                    <p>Total: ${metrics.network.totalTransactions.toLocaleString()}</p>
                    <p>Pendientes: ${metrics.network.pendingTransactions}</p>
                </div>
            </div>
        `;
        
        this.metricsDisplay.innerHTML = metricsHTML;
    }
    
    /**
     * 🍷 Actualizar display de bodegas
     */
    updateBodegasDisplay(data) {
        // Implementar actualización de bodegas en el mapa
    }
    
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

// Inicializar WebSocket cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando CartoLMM WebSocket Client...');
    window.cartoLMMWebSocket = new CartoLMMWebSocket();
});