/**
 * Módulo WebSocket para CartoLMM
 * Maneja eventos en tiempo real
 */

import { config } from '../config/config.js';

/**
 * Configurar WebSocket events
 */
export function setupWebSocket(io) {
    console.log('🔌 Configurando WebSocket...');
    
    io.on('connection', (socket) => {
        console.log('🔗 Cliente conectado:', socket.id);
        
        // Enviar estado inicial
        socket.emit('system:connected', {
            message: 'Conectado a CartoLMM',
            timestamp: new Date().toISOString(),
            clientId: socket.id
        });
        
        // Configurar simulación de eventos
        const intervalId = setupEventSimulation(socket);
        
        // Manejar eventos del cliente
        setupClientEventHandlers(socket);
        
        // Cleanup al desconectar
        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado:', socket.id);
            if (intervalId) {
                clearInterval(intervalId);
            }
        });
    });
    
    console.log('✅ WebSocket configurado');
    return io;
}

/**
 * Configurar simulación de eventos blockchain
 */
function setupEventSimulation(socket) {
    const intervalId = setInterval(() => {
        // Simular nueva transacción (70% probabilidad cada 30s)
        if (Math.random() > 0.3) {
            emitNewTransaction(socket);
        }
        
        // Simular nuevo bloque (5% probabilidad cada 30s = ~10 min promedio)
        if (Math.random() > 0.95) {
            emitNewBlock(socket);
        }
        
        // Simular evento de peer (10% probabilidad)
        if (Math.random() > 0.9) {
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