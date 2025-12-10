/**
 * Configuración central para CartoLMM
 */

export const config = {
    // Servidor
    port: process.env.PORT || 8080,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // APIs
    blockchainApiUrl: process.env.BLOCKCHAIN_API_URL || 'http://localhost:3000',
    apiTimeout: parseInt(process.env.API_TIMEOUT) || 5000,
    
    // WebSocket
    socketCors: {
        origin: process.env.CORS_ORIGIN || "*",
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