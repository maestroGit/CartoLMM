/**
 * Módulo de APIs REST para CartoLMM
 * Maneja todos los endpoints de la aplicación con integración a magnumsmaster
 */

// import { mockData } from '../config/config.js';
import MagnusmasterAPI from './magnusmasterAPI.js';
import coordinateService from '../services/coordinateService.js';

// Instancia global del cliente API
const magnusmasterClient = new MagnusmasterAPI();

/**
 * Configurar todas las rutas API
 */
export async function setupAPIRoutes(app) {
    // Inicializar conexión con magnumsmaster
    console.log('🔌 Inicializando conexión con magnumsmaster...');
    const connected = await magnusmasterClient.initialize();
    
    if (connected) {
        console.log('✅ Integración con magnumsmaster establecida');
    } else {
        console.log('⚠️ Ejecutando en modo standalone (sin magnumsmaster)');
    }
    
    // API: Obtener bloques
    app.get('/api/blocks', handleGetBlocks);
    
    // API: Obtener peers/nodos
    app.get('/api/peers', handleGetPeers);
    
    // API: Pool de transacciones
    app.get('/api/transactions', handleGetTransactions);
    
    // API: Balance de dirección
    app.get('/api/balance', handleGetBalance);

    // API: UTXOs de dirección
    app.get('/api/utxo-balance', handleGetUTXOBalance);
    
    // API: Verificar QR proof
    app.post('/api/verify-qr-proof', handleVerifyQR);
    
    // API: Estado del sistema
    app.get('/api/status', handleGetStatus);
    
    // API: Métricas del dashboard
    app.get('/api/dashboard-metrics', handleGetDashboardMetrics);
    
    // API: Datos geográficos
    app.get('/api/geographic-data', handleGetGeographicData);
    
    // API: Estado de conexión con magnumsmaster
    app.get('/api/magnumsmaster-status', handleGetMagnusmasterStatus);
    
    // API: Proxy a /system-info de magnumsmaster
    app.get('/api/system-info', handleGetSystemInfo);
    
    console.log('✅ API Routes configuradas');
}

/**
 * Handler: Obtener bloques (desde magnumsmaster o mock)
 */
async function handleGetBlocks(req, res) {
    try {
        // Intentar obtener datos reales de magnumsmaster
        const blocksResponse = await magnusmasterClient.getBlocks();
        
        if (blocksResponse.success) {
            res.json({
                success: true,
                data: blocksResponse.data,
                source: 'magnumsmaster',
                timestamp: blocksResponse.timestamp
            });
            return;
        }
        
        // Fallback a datos mock si magnumsmaster no está disponible
        console.log('⚠️ Usando datos mock para bloques:', blocksResponse.error);
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

// el backend solo devolverá nodos activos reales (de lo que MagnusmasterAPI detecte), 
// y si no hay nodos, el array será vacío y el frontend mostrará “-”.
/**
 * Handler: Obtener peers/nodos con información detallada
 * Consulta el nodo principal y luego enriquece la información de cada peer
 */
async function handleGetPeers(req, res) {
  try {
    // 1. Obtener system-info del nodo principal
    const systemInfo = await magnusmasterClient.getSystemInfo();
    
    if (!systemInfo.success) {
      return res.status(503).json({
        success: false,
        error: 'Backend magnumsmaster no disponible',
        details: systemInfo.error,
        timestamp: new Date().toISOString()
      });
    }

    const blockchain = systemInfo.data?.blockchain;
    if (!blockchain) {
      return res.status(500).json({
        success: false,
        error: 'Datos de blockchain no disponibles',
        timestamp: new Date().toISOString()
      });
    }

        // 2. Extraer info del nodo local con sus datos reales
        const localNode = {
            nodeId: blockchain.nodeId || 'unknown',
            httpUrl: (blockchain.server?.httpUrl || blockchain.httpUrl || 'unknown').toString().trim(),
            p2pUrl: (blockchain.server?.p2pUrl || blockchain.p2pUrl || 'unknown').toString().trim(),
            isLocal: true,
            status: 'online',
            blockHeight: blockchain.blockHeight || 0,
            difficulty: blockchain.difficulty || 0,
            lastSeen: new Date().toISOString(),
            responseTime: 0
        };

    // 3. Extraer peers remotos (pueden ser strings o objetos)
    const network = blockchain.network || {};
    const peersHttpRaw = network.peersHttp || [];
    const peersP2P = network.peersP2P || [];
    const p2pPeers = network.p2pPeers || []; // Array detallado si existe

    // Normalizar peersHttp: puede ser array de strings o array de objetos {nodeId, httpUrl, lastSeen}
    const peersHttp = peersHttpRaw.map(peer => {
      if (typeof peer === 'string') {
        return { httpUrl: peer, nodeId: null, lastSeen: null };
      } else if (peer && typeof peer === 'object') {
        return {
          httpUrl: peer.httpUrl || peer.url || 'unknown',
          nodeId: peer.nodeId || null,
          lastSeen: peer.lastSeen || null
        };
      }
      return { httpUrl: 'unknown', nodeId: null, lastSeen: null };
    });

    console.log(`📡 Consultando ${peersHttp.length} peers remotos...`);

    // 4. Enriquecer cada peer con información detallada
    const peersDetailed = await Promise.allSettled(
      peersHttp.map(async (peer, index) => {
        const startTime = Date.now();
        const peerHttpUrl = peer.httpUrl.trim(); // Eliminar espacios
        
                try {
                    // Hacer petición a /system-info de cada peer
                    const peerResponse = await fetch(`${peerHttpUrl}/system-info`, {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: AbortSignal.timeout(5000) // Timeout 5 segundos
                    });

                    if (!peerResponse.ok) {
                        throw new Error(`HTTP ${peerResponse.status}`);
                    }

                    const peerData = await peerResponse.json();
                    const responseTime = Date.now() - startTime;

                    // Extraer datos del peer
                    const peerBlockchain = peerData.blockchain || peerData.data?.blockchain || {};

                    // Generar nodeId único y consistente
                    let nodeId = peer.nodeId || peerBlockchain.nodeId;
                    if (!nodeId || nodeId === 'unknown') {
                        // Usa el host:puerto como fallback único
                        try {
                            const urlObj = new URL(peerHttpUrl);
                            nodeId = `node_${urlObj.port || urlObj.hostname.replace(/\W/g, '')}`;
                        } catch {
                            nodeId = `node_${index + 1}`;
                        }
                    }

                    return {
                        nodeId,
                        httpUrl: peerHttpUrl,
                        p2pUrl: peersP2P[index]?.url || peersP2P[index] || 'unknown',
                        isLocal: false,
                        status: 'online',
                        blockHeight: peerBlockchain.blockHeight || 0,
                        difficulty: peerBlockchain.difficulty || 0,
                        lastSeen: peer.lastSeen ? new Date(peer.lastSeen).toISOString() : new Date().toISOString(),
                        responseTime: responseTime,
                        // Info adicional si existe
                        version: peerBlockchain.version || '1.0.0',
                        peers: peerBlockchain.network?.peersHttp?.length || 0,
                        // Datos originales de magnumsmaster
                        originalData: {
                            nodeId: peer.nodeId,
                            lastSeenTimestamp: peer.lastSeen
                        }
                    };
                } catch (error) {
                    // Peer no disponible o timeout
                    let nodeId = peer.nodeId;
                    if (!nodeId || nodeId === 'unknown') {
                        try {
                            const urlObj = new URL(peerHttpUrl);
                            nodeId = `node_${urlObj.port || urlObj.hostname.replace(/\W/g, '')}`;
                        } catch {
                            nodeId = `node_${index + 1}`;
                        }
                    }
                    return {
                        nodeId,
                        httpUrl: peerHttpUrl,
                        p2pUrl: peersP2P[index]?.url || peersP2P[index] || 'unknown',
                        isLocal: false,
                        status: 'offline',
                        blockHeight: 0,
                        difficulty: 0,
                        lastSeen: peer.lastSeen ? new Date(peer.lastSeen).toISOString() : null,
                        responseTime: Date.now() - startTime,
                        error: error.message,
                        originalData: {
                            nodeId: peer.nodeId,
                            lastSeenTimestamp: peer.lastSeen
                        }
                    };
                }
      })
    );

    // 5. Procesar resultados (fulfilled y rejected)
    const peersProcessed = peersDetailed.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // En caso de error completo en Promise
        return {
          nodeId: 'unknown',
          httpUrl: 'unknown',
          p2pUrl: 'unknown',
          isLocal: false,
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });


                // 6. Combinar nodo local + peers remotos y filtrar por httpUrl único (ignorar nodeId duplicados)
                const allNodesRaw = [localNode, ...peersProcessed];
                const allNodes = [];
                const seenHttpUrls = new Set();
                for (const node of allNodesRaw) {
                    const url = node.httpUrl || node.nodeId;
                    if (!seenHttpUrls.has(url)) {
                        allNodes.push(node);
                        seenHttpUrls.add(url);
                    }
                }

        // 7. Calcular estadísticas
        const nodesWithBlocks = allNodes.filter(p => p.blockHeight > 0);
        const stats = {
            total: allNodes.length,
            online: allNodes.filter(p => p.status === 'online').length,
            offline: allNodes.filter(p => p.status === 'offline').length,
            error: allNodes.filter(p => p.status === 'error').length,
            avgResponseTime: Math.round(
                allNodes
                    .filter(p => p.status === 'online')
                    .reduce((sum, p) => sum + (p.responseTime || 0), 0) / 
                (allNodes.filter(p => p.status === 'online').length || 1)
            ),
            maxBlockHeight: nodesWithBlocks.length > 0 ? Math.max(...nodesWithBlocks.map(p => p.blockHeight)) : 0,
            minBlockHeight: nodesWithBlocks.length > 0 ? Math.min(...nodesWithBlocks.map(p => p.blockHeight)) : 0
        };

    console.log(`✅ Peers consultados: ${stats.online}/${stats.total} online`);

    // 8. Enriquecer peers con coordenadas geográficas
    const peersWithCoordinates = await coordinateService.assignCoordinates(allNodes);

    res.json({
      success: true,
      peers: peersWithCoordinates,
      stats: stats,
      network: {
        localNode: localNode.nodeId,
        p2pConnections: network.p2pConnections || 0,
        totalPeers: allNodes.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    handleAPIError(res, error, 'Error obteniendo peers');
  }
}

/**
 * Handler: Obtener peers/nodos
 * 
 
 * El “3” proviene del mock hardcodeado en tu backend, no de nodos reales.
 */
// async function handleGetPeers(req, res) {
//     try {
//         const mockPeers = [
//             {
//                 id: 'genesis_node',
//                 status: 'active',
//                 port: 3001,
//                 host: 'localhost',
//                 lastSeen: new Date().toISOString(),
//                 blocks: 3,
//                 peers: 2,
//                 version: '1.0.0',
//                 region: 'Madrid'
//             },
//             {
//                 id: 'node_ribera_001',
//                 status: 'active',
//                 port: 3002,
//                 host: '192.168.1.100',
//                 lastSeen: new Date().toISOString(),
//                 blocks: 3,
//                 peers: 2,
//                 version: '1.0.0',
//                 region: 'Castilla y León'
//             },
//             {
//                 id: 'node_rioja_002',
//                 status: 'active',
//                 port: 3003,
//                 host: '192.168.1.101',
//                 lastSeen: new Date(Date.now() - 30000).toISOString(),
//                 blocks: 2,
//                 peers: 1,
//                 version: '1.0.0',
//                 region: 'La Rioja'
//             }
//         ];
        
//         res.json({
//             success: true,
//             data: mockPeers,
//             count: mockPeers.length,
//             activeCount: mockPeers.filter(p => p.status === 'active').length,
//             timestamp: new Date().toISOString()
//         });
//     } catch (error) {
//         handleAPIError(res, error, 'Error obteniendo peers');
//     }
// }

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
        console.log(`[API] /api/balance - address recibida:`, address);
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Dirección requerida',
                code: 'MISSING_ADDRESS'
            });
        }

        // Llama siempre a magnumsmaster para obtener el balance real
        // Asegura que la dirección se envía como POST JSON
        const response = await magnusmasterClient.getAddressBalance(address);
        console.log(`[API] /api/balance - respuesta de magnumsmaster:`, response);
        if (response && response.success && response.data) {
            // Si hay datos reales, devuélvelos tal cual
            return res.json({
                success: true,
                data: response.data,
                timestamp: response.timestamp || new Date().toISOString()
            });
        } else {
            // Si no hay datos reales, devuelve balance cero
            return res.json({
                success: true,
                data: {
                    address: address,
                    balance: 0,
                    balanceFormatted: '0 LMM',
                    lastUpdated: new Date().toISOString(),
                    transactionCount: 0,
                    type: address.includes('bodega') ? 'winery' : 'customer'
                },
                timestamp: new Date().toISOString()
            });
        }
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
 * Handler: Métricas del dashboard
 */
async function handleGetDashboardMetrics(req, res) {
    try {
        // 1. Obtenemos la info de sistema para capturar la IP/URL real
        const systemInfoResponse = await magnusmasterClient.getSystemInfo();
        const nodeHttpUrl = systemInfoResponse?.data?.blockchain?.server?.httpUrl || '';

        // 2. Luego, obtenemos las métricas dashboard
        const metricsResponse = await magnusmasterClient.getDashboardMetrics();

        if (metricsResponse.success) {
            // 3. Nos aseguramos de que la estructura network exista
            if (!metricsResponse.metrics.network) {
                metricsResponse.metrics.network = {};
            }
            // 4. Añadimos el campo con la IP/URL detectada
            metricsResponse.metrics.network.nodeHttpUrl = nodeHttpUrl;

            res.json({
                success: true,
                data: metricsResponse.metrics,
                source: 'magnumsmaster',
                errors: metricsResponse.errors || [],
                timestamp: new Date().toISOString()
            });
        } else {
            // Fallback a métricas mock en caso de error
            const mockMetrics = {
                blocks: { success: true, data: { length: 42 } },
                transactions: { success: true, data: { length: 15 } },
                systemInfo: { success: true, data: { status: 'mock' } },
                balance: { success: true, data: { balance: 1000 } },
                connectionStatus: false,
                lastUpdate: new Date().toISOString(),
                network: { nodeHttpUrl: nodeHttpUrl } // Incluimos también la url en mocks
            };

            res.json({
                success: true,
                data: mockMetrics,
                source: 'mock',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo métricas del dashboard');
    }
}

/**
 * Handler: Datos geográficos
 */
async function handleGetGeographicData(req, res) {
    try {
        const geoResponse = await magnusmasterClient.getGeographicData();
        
        if (geoResponse.success) {
            res.json({
                success: true,
                data: geoResponse.data,
                source: 'magnumsmaster',
                timestamp: geoResponse.timestamp
            });
        } else {
            // Datos mock geográficos
            const mockGeoData = {
                nodes: [
                    {
                        id: 'mock-node-1',
                        name: 'Nodo Mock Madrid',
                        lat: 40.4168,
                        lng: -3.7038,
                        city: 'Madrid',
                        status: 'offline',
                        lastSeen: new Date().toISOString()
                    }
                ],
                transactions: [],
                coverage: 'Spain (Mock Data)'
            };
            
            res.json({
                success: true,
                data: mockGeoData,
                source: 'mock',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo datos geográficos');
    }
}

/**
 * Handler: Estado de conexión con magnumsmaster
 */
async function handleGetMagnusmasterStatus(req, res) {
    try {
        const connectionStatus = magnusmasterClient.getConnectionStatus();
        const healthCheck = await magnusmasterClient.checkHealth();
        
        res.json({
            success: true,
            data: {
                ...connectionStatus,
                healthCheck: healthCheck,
                endpoints: {
                    blocks: `${connectionStatus.baseURL}/blocks`,
                    transactions: `${connectionStatus.baseURL}/transactionsPool`,
                    balance: `${connectionStatus.baseURL}/balance`,
                    systemInfo: `${connectionStatus.baseURL}/system-info`
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error verificando estado de magnumsmaster');
    }
}

/**
 * Handler: System Info (proxy a magnumsmaster)
 */
async function handleGetSystemInfo(req, res) {
    try {
        const systemInfo = await magnusmasterClient.getSystemInfo();
        
        if (systemInfo && !systemInfo.error) {
            res.json(systemInfo);
        } else {
            res.status(503).json({
                success: false,
                error: 'Backend magnumsmaster no disponible',
                details: systemInfo?.error || 'No se pudo conectar'
            });
        }
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo system-info');
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

/**
 * Handler: UTXOs/balance por dirección
 */
async function handleGetUTXOBalance(req, res) {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({
                success: false,
                error: 'Dirección requerida',
                code: 'MISSING_ADDRESS'
            });
        }

        const response = await magnusmasterClient.getUTXOBalance(address);

        if (response && response.success) {
            const raw = response.data;
            // Normalizar: puede venir como array o como objeto { utxos, balance }
            const utxos = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.utxos) ? raw.utxos : []);
            const balance = raw && typeof raw.balance !== 'undefined'
                ? raw.balance
                : utxos.reduce((sum, u) => sum + (Number(u.amount) || 0), 0);

            return res.json({
                success: true,
                data: { utxos, balance },
                timestamp: response.timestamp || new Date().toISOString()
            });
        }

        // Fallback seguro
        return res.json({
            success: true,
            data: { utxos: [], balance: 0 },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        handleAPIError(res, error, 'Error obteniendo UTXOs');
    }
}