/**
 * Blockchain Service para CartoLMM
 * Conecta con la API blockchain existente de Magnumsmaster
 * clase es el “puente” entre tu frontend y tu backend de blockchain, 
 * centralizando toda la comunicación, gestión de eventos en tiempo real 
 * y acceso a los datos críticos de la blockchain 
 * y la red P2P para tu aplicación CartoLMM.
Peticiones “normales” (HTTP) para histórico/balance/etc.
WebSockets para tiempo real.
Facilidad para disparar eventos que otras partes de la UI pueden subscribir.
Unifica el acceso, simplifica la UI.

 */

class BlockchainService {
    constructor() {
        this.apiBaseUrl = window.location.origin; // Usa la misma URL del servidor
        this.socket = null;
        this.isConnected = false;
        this.lastBlockData = null;
        this.networkData = null;
    }

    /**
     * Inicializa la conexión con el servidor blockchain
     */
    async initialize() {
        try {
            // Conectar WebSocket para tiempo real
            this.socket = io();
            
            this.socket.on('connect', () => {
                this.isConnected = true;
                console.log('🔗 CartoLMM conectado a blockchain');
            });

            this.socket.on('disconnect', () => {
                this.isConnected = false;
                console.log('❌ CartoLMM desconectado de blockchain');
            });

            // Escuchar eventos blockchain
            this.socket.on('blockchain:newBlock', (blockData) => {
                this.handleNewBlock(blockData);
            });

            this.socket.on('blockchain:newTransaction', (transactionData) => {
                this.handleNewTransaction(transactionData);
            });

            this.socket.on('blockchain:peerEvent', (peerData) => {
                this.handlePeerEvent('connected', peerData);
            });

            this.socket.on('system:metrics', (metricsData) => {
                this.handleMetricsUpdate(metricsData);
            });

            // Cargar datos iniciales
            await this.loadInitialData();
            
            return true;
        } catch (error) {
            console.error('❌ Error inicializando BlockchainService:', error);
            return false;
        }
    }

    /**
     * Carga datos iniciales del blockchain
     */
    async loadInitialData() {
        try {
            const [blocksData, peersData, transactionsData] = await Promise.all([
                this.getBlocks(),
                this.getPeers(),
                this.getTransactionsPool()
            ]);

            this.lastBlockData = blocksData;
            this.networkData = peersData;

            return {
                blocks: blocksData,
                peers: peersData,
                transactions: transactionsData
            };
        } catch (error) {
            console.error('❌ Error cargando datos iniciales:', error);
            throw error;
        }
    }

    /**
     * Obtiene información de bloques
     */
    async getBlocks() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/blocks`);
            if (!response.ok) throw new Error('Error obteniendo bloques');
            
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('❌ Error obteniendo bloques:', error);
            return [];
        }
    }

    /**
     * Obtiene información de peers/nodos
     */
    async getPeers() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/peers`);
            if (!response.ok) throw new Error('Error obteniendo peers');
            
            const result = await response.json();
            // La API devuelve result.peers, no result.data
            return result.success ? result.peers : [];
        } catch (error) {
            console.error('❌ Error obteniendo peers:', error);
            return [];
        }
    }

    /**
     * Obtiene pool de transacciones
     */
    async getTransactionsPool() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/transactions`);
            if (!response.ok) throw new Error('Error obteniendo transacciones');
            
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error('❌ Error obteniendo transacciones:', error);
            return [];
        }
    }

    /**
     * Obtiene balance de una dirección
     */
    async getBalance(address) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/balance?address=${address}`);
            if (!response.ok) throw new Error('Error obteniendo balance');
            
            const result = await response.json();
            return result.success ? result.data : { balance: 0 };
        } catch (error) {
            console.error('❌ Error obteniendo balance:', error);
            return { balance: 0 };
        }
    }

    /**
     * Verifica QR proof de una botella
     */
    async verifyQRProof(qrData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/api/verify-qr-proof`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ qrData })
            });

            if (!response.ok) throw new Error('Error verificando QR');
            
            const result = await response.json();
            return result.success ? result.data : { verified: false, error: 'Verificación fallida' };
        } catch (error) {
            console.error('❌ Error verificando QR:', error);
            return { verified: false, error: error.message };
        }
    }

    /**
     * Maneja nuevos bloques
     */
    handleNewBlock(blockData) {
        console.log('🔗 Nuevo bloque:', blockData);
        this.lastBlockData = blockData;
        
        // Disparar evento para la UI
        this.dispatchEvent('newBlock', blockData);
    }

    /**
     * Maneja nuevas transacciones
     */
    handleNewTransaction(transactionData) {
        console.log('⚡ Nueva transacción:', transactionData);
        
        // Disparar evento para la UI
        this.dispatchEvent('newTransaction', transactionData);
    }

    /**
     * Maneja eventos de peers
     */
    handlePeerEvent(eventType, peerData) {
        console.log(`🌐 Peer ${eventType}:`, peerData);
        
        // Disparar evento para la UI
        this.dispatchEvent('peerEvent', { type: eventType, peer: peerData });
    }

    /**
     * Maneja actualizaciones de métricas del sistema
     */
    handleMetricsUpdate(metricsData) {
        console.log('📊 Métricas actualizadas:', metricsData);
        this.metrics = metricsData;
        
        // Disparar evento para la UI
        this.dispatchEvent('metricsUpdate', metricsData);
    }

    /**
     * Sistema de eventos personalizado
     */
    dispatchEvent(eventType, data) {
        const event = new CustomEvent(`blockchain:${eventType}`, {
            detail: data
        });
        window.dispatchEvent(event);
    }

    /**
     * Obtiene métricas del sistema
     */
    getMetrics() {
        const blocks = this.lastBlockData || [];
        const peers = this.networkData || [];
        
        return {
            totalBlocks: Array.isArray(blocks) ? blocks.length : 0,
            activeNodes: Array.isArray(peers) ? peers.length : 0,
            lastBlockTime: blocks.length > 0 ? blocks[blocks.length - 1]?.timestamp : null,
            networkStatus: this.isConnected ? 'connected' : 'disconnected'
        };
    }

    /**
     * Simula datos cuando no hay conexión real
     */
    getMockData() {
        return {
            blocks: [
                {
                    index: 1247,
                    timestamp: new Date().toISOString(),
                    hash: '000abc123...',
                    transactions: 3
                }
            ],
            peers: [
                { id: 'genesis_node', status: 'active' },
                { id: 'node_ribera_001', status: 'active' },
                { id: 'node_rioja_002', status: 'active' }
            ],
            transactions: [
                {
                    id: 'tx_123',
                    from: 'bodega_001',
                    to: 'customer_001',
                    amount: 120,
                    type: 'wine_purchase'
                }
            ]
        };
    }

    /**
     * Cierra conexiones
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }
}

// Instancia global
window.blockchainService = new BlockchainService();