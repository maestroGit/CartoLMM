/**
 * Módulo WebSocket para CartoLMM - Integración blockchain en tiempo real
 * Maneja eventos push desde magnumsmaster y simulaciones
 */

import { config } from '../config/config.js';

// Variables globales para manejo de WebSocket
let globalIO = null;
let magnusmasterAPI = null;
let activeIntervals = new Map();
let connectedClients = new Set();

/**
 * Configurar WebSocket events con integración magnumsmaster
 */
export function setupWebSocket(io) {
    console.log('🔌 Configurando WebSocket con integración blockchain...');
    
    globalIO = io;
    
    io.on('connection', (socket) => {
        console.log('🔗 Cliente conectado:', socket.id);
        connectedClients.add(socket.id);
        
        // Inicializar conexión del cliente
        initializeClientConnection(socket);
        
        // Configurar handlers de eventos del cliente
        setupClientEventHandlers(socket);
        
        // Iniciar actualizaciones en tiempo real para este cliente
        startRealTimeUpdates(socket);
        
        // Cleanup al desconectar
        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado:', socket.id);
            cleanupClient(socket.id);
        });
    });
    
    // Inicializar integración con magnumsmaster
    initializeMagnusmasterIntegration();
    
    console.log('✅ WebSocket configurado con integración blockchain');
    return io;
}

/**
 * 🚀 Inicializar conexión del cliente
 */
async function initializeClientConnection(socket) {
    try {
        // Enviar estado inicial
        socket.emit('system:connected', {
            message: 'Conectado a CartoLMM - Blockchain Visualization',
            timestamp: new Date().toISOString(),
            clientId: socket.id,
            features: {
                realTimeBlocks: true,
                realTimeTransactions: true,
                geographicUpdates: true,
                blockchainMetrics: true
            }
        });

        // Enviar datos iniciales si magnusmmaster está disponible
        if (magnusmasterAPI) {
            const dashboardData = await magnusmasterAPI.getDashboardMetrics();
            if (dashboardData.success) {
                socket.emit('blockchain:initial-data', {
                    data: dashboardData.data,
                    timestamp: new Date().toISOString()
                });
            }
        }

        console.log(`✅ Cliente ${socket.id} inicializado`);

    } catch (error) {
        console.error('❌ Error inicializando cliente:', error);
        socket.emit('system:error', {
            message: 'Error de inicialización',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * 🔄 Inicializar integración con magnumsmaster
 */
async function initializeMagnusmasterIntegration() {
    try {
        const { default: MagnusmasterAPI } = await import('../api/magnusmasterAPI.js');
        magnusmasterAPI = new MagnusmasterAPI();
        
        const connected = await magnusmasterAPI.initialize();
        if (connected) {
            console.log('✅ WebSocket integrado con magnumsmaster');
            startGlobalBlockchainMonitoring();
        } else {
            console.log('⚠️ WebSocket en modo standalone (sin magnumsmaster)');
            startSimulationMode();
        }
        
    } catch (error) {
        console.warn('⚠️ No se pudo integrar magnumsmaster, usando simulación:', error.message);
        startSimulationMode();
    }
}

/**
 * 🌐 Iniciar monitoreo global de blockchain
 */
function startGlobalBlockchainMonitoring() {
    console.log('📡 Iniciando monitoreo blockchain global...');
    
    // Monitorear cambios en bloques cada 5 segundos
    const blockMonitor = setInterval(async () => {
        try {
            if (connectedClients.size === 0) return;
            
            const blocksData = await magnusmasterAPI.getBlocks();
            if (blocksData.success) {
                broadcastToAllClients('blockchain:blocks-update', {
                    blocks: blocksData.data,
                    count: blocksData.data.length,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error monitoreando bloques:', error);
        }
    }, 5000);

    // Monitorear transacciones cada 3 segundos
    const txMonitor = setInterval(async () => {
        try {
            if (connectedClients.size === 0) return;
            
            const txData = await magnusmasterAPI.getTransactionsPool();
            if (txData.success) {
                broadcastToAllClients('blockchain:transactions-update', {
                    transactions: txData.data,
                    count: txData.data.length,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error monitoreando transacciones:', error);
        }
    }, 3000);

    // Monitorear métricas del sistema cada 10 segundos
    const systemMonitor = setInterval(async () => {
        try {
            if (connectedClients.size === 0) return;
            
            const systemData = await magnusmasterAPI.getSystemInfo();
            if (systemData.success) {
                broadcastToAllClients('blockchain:system-update', {
                    system: systemData.data,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error monitoreando sistema:', error);
        }
    }, 10000);

    // Guardar intervalos para limpieza
    activeIntervals.set('blocks', blockMonitor);
    activeIntervals.set('transactions', txMonitor);
    activeIntervals.set('system', systemMonitor);
}

/**
 * 🎭 Iniciar modo simulación (sin magnumsmaster)
 */
function startSimulationMode() {
    console.log('🎬 Iniciando modo simulación blockchain...');
    
    const simulationInterval = setInterval(() => {
        if (connectedClients.size === 0) return;
        
        // Simular nueva transacción (70% probabilidad cada 10s)
        if (Math.random() > 0.3) {
            const mockTransaction = generateMockTransaction();
            broadcastToAllClients('blockchain:newTransaction', mockTransaction);
        }
        
        // Simular nuevo bloque (20% probabilidad cada 10s)
        if (Math.random() > 0.8) {
            const mockBlock = generateMockBlock();
            broadcastToAllClients('blockchain:newBlock', mockBlock);
        }
        
    }, 10000);

    activeIntervals.set('simulation', simulationInterval);
}

/**
 * ⏰ Iniciar actualizaciones individuales para un cliente
 */
function startRealTimeUpdates(socket) {
    // Ping cada 30 segundos para mantener conexión
    const pingInterval = setInterval(() => {
        if (socket.connected) {
            socket.emit('system:ping', {
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        } else {
            clearInterval(pingInterval);
        }
    }, 30000);

    // SIMULACIÓN DESHABILITADA: Comentado para evitar inicio automático
    // const mockDataInterval = startMockDataSimulation(socket);
    
    // Guardar referencias para limpieza (sin mock data)
    activeIntervals.set(socket.id, {
        ping: pingInterval
        // mockData: mockDataInterval
    });
}

/**
 * 📢 Broadcast a todos los clientes conectados
 */
function broadcastToAllClients(eventName, data) {
    if (globalIO && connectedClients.size > 0) {
        globalIO.emit(eventName, data);
        console.log(`📡 ${eventName} enviado a ${connectedClients.size} clientes`);
    }
}

/**
 * 🎲 Generar transacción mock
 */
function generateMockTransaction() {
    const addresses = [
        '0x123...abc', '0x456...def', '0x789...ghi', '0xabc...123', '0xdef...456'
    ];
    
    return {
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: addresses[Math.floor(Math.random() * addresses.length)],
        to: addresses[Math.floor(Math.random() * addresses.length)],
        amount: Math.floor(Math.random() * 1000) + 1,
        timestamp: new Date().toISOString(),
        type: 'wine_transfer',
        bodega: `Bodega ${Math.floor(Math.random() * 5) + 1}`,
        lat: 40.4 + (Math.random() - 0.5) * 4, // España aprox
        lng: -3.7 + (Math.random() - 0.5) * 8
    };
}

/**
 * 🧱 Generar bloque mock
 */
function generateMockBlock() {
    return {
        index: Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString(),
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        previousHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        transactions: Math.floor(Math.random() * 10) + 1,
        miner: `Node_${Math.floor(Math.random() * 5) + 1}`,
        difficulty: Math.floor(Math.random() * 5) + 1
    };
}

/**
 * 🧹 Limpiar cliente desconectado
 */
function cleanupClient(clientId) {
    connectedClients.delete(clientId);
    
    if (activeIntervals.has(clientId)) {
        const intervals = activeIntervals.get(clientId);
        
        // Si es el formato nuevo con objetos
        if (typeof intervals === 'object' && intervals.ping) {
            clearInterval(intervals.ping);
            if (intervals.mockData) {
                clearInterval(intervals.mockData);
            }
        } else {
            // Formato legacy
            clearInterval(intervals);
        }
        
        activeIntervals.delete(clientId);
    }
}

/**
 * 🔄 Iniciar simulación de datos mock
 */
function startMockDataSimulation(socket) {
    console.log(`🎲 Iniciando simulación mock para cliente ${socket.id} - Intervalo: ${config.mockDataInterval}ms`);
    
    const intervalId = setInterval(() => {
        if (!socket.connected) {
            console.log(`⚠️ Cliente ${socket.id} desconectado, deteniendo simulación`);
            clearInterval(intervalId);
            return;
        }
        
        console.log(`🎲 Ejecutando simulación mock para ${socket.id}`);
        
        // Simular nueva transacción (30% probabilidad)
        if (Math.random() > 0.7) {
            console.log(`💰 Enviando nueva transacción a ${socket.id}`);
            emitNewTransaction(socket);
        }
        
        // Simular nuevo bloque (5% probabilidad cada 30s = ~10 min promedio)
        if (Math.random() > 0.95) {
            console.log(`🔗 Enviando nuevo bloque a ${socket.id}`);
            emitNewBlock(socket);
        }
        
        // Simular evento de peer (10% probabilidad)
        if (Math.random() > 0.9) {
            console.log(`🌐 Enviando evento peer a ${socket.id}`);
            emitPeerEvent(socket);
        }
        
        // Simular métricas del sistema (siempre)
        emitSystemMetrics(socket);
        
    }, config.mockDataInterval);
    
    return intervalId;
}

/**
 * Emitir nueva transacción
 */
function emitNewTransaction(socket) {
    const bodegas = ['ribera_001', 'rioja_002', 'navarra_003', 'jerez_004', 'rias_005'];
    const wines = [
        'Ribera del Duero Reserva 2020',
        'Rioja Gran Reserva 2018',
        'Navarra Rosado 2023',
        'Jerez Fino',
        'Rías Baixas Albariño 2022'
    ];
    
    const newTransaction = {
        id: `tx_live_${Date.now()}`,
        from: `bodega_${bodegas[Math.floor(Math.random() * bodegas.length)]}`,
        to: `customer_${Math.floor(Math.random() * 100) + 1}`,
        amount: Math.floor(Math.random() * 100) + 10,
        type: Math.random() > 0.8 ? 'bulk_sale' : 'wine_purchase',
        timestamp: new Date().toISOString(),
        fee: parseFloat((Math.random() * 0.01).toFixed(4)),
        metadata: {
            wine: wines[Math.floor(Math.random() * wines.length)],
            bottles: Math.floor(Math.random() * 24) + 1,
            qr_verified: Math.random() > 0.1
        }
    };
    
    socket.emit('blockchain:newTransaction', newTransaction);
    console.log('📡 Nueva transacción emitida:', newTransaction.id);
}

/**
 * Emitir nuevo bloque
 */
function emitNewBlock(socket) {
    const newBlock = {
        index: Math.floor(Math.random() * 1000) + 100,
        timestamp: new Date().toISOString(),
        hash: '0x' + Math.random().toString(16).substr(2, 40),
        previousHash: '0x' + Math.random().toString(16).substr(2, 40),
        transactions: Math.floor(Math.random() * 5) + 1,
        nonce: Math.floor(Math.random() * 4294967295),
        difficulty: Math.floor(Math.random() * 5) + 1,
        miner: `node_${Math.floor(Math.random() * 3) + 1}`,
        reward: 50
    };
    
    socket.emit('blockchain:newBlock', newBlock);
    console.log('🔗 Nuevo bloque emitido:', newBlock.index);
}

/**
 * Emitir evento de peer
 */
function emitPeerEvent(socket) {
    const eventTypes = ['connected', 'disconnected', 'sync_started', 'sync_completed'];
    const peers = ['node_ribera_001', 'node_rioja_002', 'node_navarra_003'];
    
    const peerEvent = {
        type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        peer: {
            id: peers[Math.floor(Math.random() * peers.length)],
            address: `192.168.1.${Math.floor(Math.random() * 255)}`,
            port: 3000 + Math.floor(Math.random() * 10),
            version: '1.0.0'
        },
        timestamp: new Date().toISOString()
    };
    
    socket.emit('blockchain:peerEvent', peerEvent);
    console.log(`🌐 Evento peer emitido: ${peerEvent.type} - ${peerEvent.peer.id}`);
}

/**
 * Emitir métricas del sistema
 */
function emitSystemMetrics(socket) {
    const metrics = {
        timestamp: new Date().toISOString(),
        network: {
            activeNodes: Math.floor(Math.random() * 5) + 3,
            totalTransactions: Math.floor(Math.random() * 1000) + 5000,
            pendingTransactions: Math.floor(Math.random() * 20),
            blockHeight: Math.floor(Math.random() * 1000) + 2000,
            hashRate: Math.floor(Math.random() * 100) + 50
        },
        bodegas: {
            total: 5,
            active: Math.floor(Math.random() * 2) + 4,
            totalProduction: Math.floor(Math.random() * 10000) + 50000,
            verifiedBottles: Math.floor(Math.random() * 5000) + 25000
        },
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: Math.random() * 100
        }
    };
    
    socket.emit('system:metrics', metrics);
}

/**
 * Configurar handlers para eventos del cliente
 */
function setupClientEventHandlers(socket) {
    // Cliente solicita datos específicos
    socket.on('client:requestData', (data) => {
        console.log('📥 Cliente solicita datos:', data);
        
        switch (data.type) {
            case 'bodegas':
                socket.emit('data:bodegas', generateBodegasData());
                break;
            case 'transactions':
                socket.emit('data:transactions', generateTransactionsData());
                break;
            case 'blocks':
                socket.emit('data:blocks', generateBlocksData());
                break;
            default:
                socket.emit('error', { message: 'Tipo de datos no reconocido' });
        }
    });
    
    // Cliente se suscribe a actualizaciones específicas
    socket.on('client:subscribe', (subscription) => {
        console.log('📋 Cliente suscrito a:', subscription);
        socket.join(subscription.channel);
    });
    
    // Cliente se desuscribe
    socket.on('client:unsubscribe', (subscription) => {
        console.log('📤 Cliente desuscrito de:', subscription);
        socket.leave(subscription.channel);
    });
    
    // Ping/Pong para mantener conexión
    socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
    });
}

/**
 * Generar datos de bodegas
 */
function generateBodegasData() {
    return {
        timestamp: new Date().toISOString(),
        bodegas: [
            { id: 'ribera_001', status: 'active', production: Math.floor(Math.random() * 1000) },
            { id: 'rioja_002', status: 'active', production: Math.floor(Math.random() * 1500) },
            { id: 'navarra_003', status: 'active', production: Math.floor(Math.random() * 800) }
        ]
    };
}

/**
 * Generar datos de transacciones
 */
function generateTransactionsData() {
    const transactions = [];
    for (let i = 0; i < 5; i++) {
        transactions.push({
            id: `tx_${Date.now()}_${i}`,
            amount: Math.floor(Math.random() * 100),
            timestamp: new Date().toISOString()
        });
    }
    return { timestamp: new Date().toISOString(), transactions };
}

/**
 * Generar datos de bloques
 */
function generateBlocksData() {
    const blocks = [];
    for (let i = 0; i < 3; i++) {
        blocks.push({
            index: Math.floor(Math.random() * 1000) + i,
            hash: '0x' + Math.random().toString(16).substr(2, 40),
            timestamp: new Date().toISOString()
        });
    }
    return { timestamp: new Date().toISOString(), blocks };
}