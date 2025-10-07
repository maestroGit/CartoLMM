/**
 * Módulo de APIs REST para CartoLMM
 * Maneja todos los endpoints de la aplicación
 */

import { mockData } from '../config/config.js';

/**
 * Configurar todas las rutas API
 */
export function setupAPIRoutes(app) {
    // API: Obtener bloques
    app.get('/api/blocks', handleGetBlocks);
    
    // API: Obtener peers/nodos
    app.get('/api/peers', handleGetPeers);
    
    // API: Pool de transacciones
    app.get('/api/transactions', handleGetTransactions);
    
    // API: Balance de dirección
    app.get('/api/balance', handleGetBalance);
    
    // API: Verificar QR proof
    app.post('/api/verify-qr-proof', handleVerifyQR);
    
    // API: Estado del sistema
    app.get('/api/status', handleGetStatus);
    
    console.log('✅ API Routes configuradas');
}

/**
 * Handler: Obtener bloques
 */
async function handleGetBlocks(req, res) {
    try {
        const mockBlocks = [
            {
                index: 0,
                timestamp: '2024-01-01T00:00:00.000Z',
                hash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
                previousHash: '0',
                transactions: [],
                nonce: 2083236893,
                difficulty: 1
            },
            {
                index: 1,
                timestamp: new Date(Date.now() - 600000).toISOString(),
                hash: '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048',
                previousHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
                transactions: [
                    {
                        id: 'tx_001',
                        from: 'genesis',
                        to: 'bodega_ribera_001',
                        amount: 100,
                        type: 'mining_reward',
                        timestamp: new Date(Date.now() - 590000).toISOString()
                    }
                ],
                nonce: 2573394689,
                difficulty: 2
            },
            {
                index: 2,
                timestamp: new Date(Date.now() - 300000).toISOString(),
                hash: '000000006a625f06636b8bb6ac7b960a8d03705d1ace08b1a19da3fdcc99ddbd',
                previousHash: '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048',
                transactions: [
                    {
                        id: 'tx_002',
                        from: 'bodega_ribera_001',
                        to: 'customer_001',
                        amount: 25,
                        type: 'wine_purchase',
                        timestamp: new Date(Date.now() - 290000).toISOString(),
                        metadata: {
                            wine: 'Ribera del Duero Reserva 2020',
                            bottles: 12,
                            qr_verified: true,
                            denomination: 'D.O. Ribera del Duero'
                        }
                    }
                ],
                nonce: 1829472156,
                difficulty: 3
            }
        ];
        
        res.json({
            success: true,
            data: mockBlocks,
            count: mockBlocks.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo bloques');
    }
}

/**
 * Handler: Obtener peers/nodos
 */
async function handleGetPeers(req, res) {
    try {
        const mockPeers = [
            {
                id: 'genesis_node',
                status: 'active',
                port: 3001,
                host: 'localhost',
                lastSeen: new Date().toISOString(),
                blocks: 3,
                peers: 2,
                version: '1.0.0',
                region: 'Madrid'
            },
            {
                id: 'node_ribera_001',
                status: 'active',
                port: 3002,
                host: '192.168.1.100',
                lastSeen: new Date().toISOString(),
                blocks: 3,
                peers: 2,
                version: '1.0.0',
                region: 'Castilla y León'
            },
            {
                id: 'node_rioja_002',
                status: 'active',
                port: 3003,
                host: '192.168.1.101',
                lastSeen: new Date(Date.now() - 30000).toISOString(),
                blocks: 2,
                peers: 1,
                version: '1.0.0',
                region: 'La Rioja'
            }
        ];
        
        res.json({
            success: true,
            data: mockPeers,
            count: mockPeers.length,
            activeCount: mockPeers.filter(p => p.status === 'active').length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo peers');
    }
}

/**
 * Handler: Pool de transacciones
 */
async function handleGetTransactions(req, res) {
    try {
        const mockTransactions = [
            {
                id: 'tx_pending_001',
                from: 'bodega_rioja_002',
                to: 'customer_002',
                amount: 45,
                type: 'wine_purchase',
                timestamp: new Date().toISOString(),
                status: 'pending',
                fee: 0.001,
                metadata: {
                    wine: 'Rioja Gran Reserva 2018',
                    bottles: 6,
                    denomination: 'D.O.Ca. Rioja'
                }
            },
            {
                id: 'tx_pending_002',
                from: 'bodega_navarra_003',
                to: 'distributor_001',
                amount: 150,
                type: 'bulk_sale',
                timestamp: new Date(Date.now() - 60000).toISOString(),
                status: 'pending',
                fee: 0.005,
                metadata: {
                    wine: 'Navarra Rosado 2023',
                    bottles: 144,
                    denomination: 'D.O. Navarra'
                }
            }
        ];
        
        res.json({
            success: true,
            data: mockTransactions,
            count: mockTransactions.length,
            pendingCount: mockTransactions.filter(t => t.status === 'pending').length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo transacciones');
    }
}

/**
 * Handler: Balance de dirección
 */
async function handleGetBalance(req, res) {
    try {
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Dirección requerida',
                code: 'MISSING_ADDRESS'
            });
        }
        
        const mockBalance = {
            address: address,
            balance: Math.floor(Math.random() * 1000) + 100,
            balanceFormatted: `${(Math.floor(Math.random() * 1000) + 100).toLocaleString()} LMM`,
            lastUpdated: new Date().toISOString(),
            transactionCount: Math.floor(Math.random() * 50) + 5,
            type: address.includes('bodega') ? 'winery' : 'customer'
        };
        
        res.json({
            success: true,
            data: mockBalance,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo balance');
    }
}

/**
 * Handler: Verificar QR proof
 */
async function handleVerifyQR(req, res) {
    try {
        const { qrData } = req.body;
        
        if (!qrData) {
            return res.status(400).json({
                success: false,
                error: 'Datos QR requeridos',
                code: 'MISSING_QR_DATA'
            });
        }
        
        // Simular verificación (90% éxito)
        const isVerified = Math.random() > 0.1;
        
        const mockVerification = {
            verified: isVerified,
            bottle: {
                id: qrData || `bottle_${Date.now()}`,
                winery: 'Bodegas Ejemplo S.L.',
                vintage: '2020',
                variety: 'Tempranillo',
                region: 'Ribera del Duero',
                denomination: 'D.O. Ribera del Duero',
                alcohol: '14.5%',
                volume: '750ml',
                blockchain_hash: '0x' + Math.random().toString(16).substr(2, 40),
                production_date: '2020-09-15',
                bottling_date: '2023-03-20'
            },
            verification: {
                timestamp: new Date().toISOString(),
                method: 'blockchain_proof',
                confidence: isVerified ? Math.random() * 0.2 + 0.8 : Math.random() * 0.3,
                block_confirmed: isVerified
            }
        };
        
        res.json({
            success: true,
            data: mockVerification,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error verificando QR');
    }
}

/**
 * Handler: Estado del sistema
 */
async function handleGetStatus(req, res) {
    try {
        const status = {
            service: 'CartoLMM',
            version: '1.0.0',
            status: 'operational',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            environment: process.env.NODE_ENV || 'development',
            timestamp: new Date().toISOString(),
            features: {
                realtime: true,
                blockchain: true,
                mapping: true,
                qr_verification: true
            }
        };
        
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo estado');
    }
}

/**
 * Manejo centralizado de errores API
 */
function handleAPIError(res, error, message) {
    console.error(`❌ ${message}:`, error);
    
    res.status(500).json({
        success: false,
        error: message,
        details: error.message,
        timestamp: new Date().toISOString()
    });
}