/**
 * Configuración central para CartoLMM
 */

function parseOrigins(value) {
    if (!value) return '*';
    const trimmed = String(value).trim();
    if (trimmed === '*') return '*';

    const origins = trimmed
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);

    if (origins.length === 0) return '*';
    return origins.length === 1 ? origins[0] : origins;
}

export const config = {
    // Servidor
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // APIs - magnumsmaster (relay principal) y magnumslocal (nodo local)
    blockchainApiUrl: process.env.BLOCKCHAIN_API_URL || 'https://app.blockswine.com', // magnumsmaster producción
    blockchainLocalUrl: process.env.BLOCKCHAIN_LOCAL_URL || 'http://localhost:6001', // magnumslocal
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 10000, // 10s para requests remotos
    
    // WebSocket
    socketCors: {
        origin: parseOrigins(process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN || '*'),
        methods: ["GET", "POST"]
    },
    
    // Paths
    publicPath: 'public',
    srcPath: 'src',
    staticPaths: ['/public', '/src'],
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGS === 'true',
    
    // Performance
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    cacheMaxAge: parseInt(process.env.CACHE_MAX_AGE) || 3600000, // 1 hour
};

export const routes = {
    // API endpoints
    api: {
        blocks: '/api/blocks',
        peers: '/api/peers',
        transactions: '/api/transactions',
        balance: '/api/balance',
        verifyQR: '/api/verify-qr-proof'
    },
    
    // Static routes
    static: {
        root: '/',
        public: '/public',
        src: '/src'
    }
};

export default config;