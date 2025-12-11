
/**
 * Servidor principal para CartoLMM
 * Arquitectura ES Modules - Del Terruño al Ciberespacio
 */

import dotenv from 'dotenv';
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar módulos locales
import { config } from './src/config/config.js';
import { setupAPIRoutes } from './src/api/routes.js';
import { setupWebSocket } from './src/websocket/events.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, config.socketCors);

// Middleware para CORS (permitir comunicación entre proyectos)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Middleware para parsear JSON
app.use(express.json());


// Servir archivos estáticos de Vite (dist) en producción
app.use(express.static(path.join(__dirname, 'dist')));

// (Opcional) Servir también public y src si necesitas acceso directo a esos recursos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Para cualquier ruta no API, servir index.html de dist (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error en servidor:', err.stack);
    res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor',
        timestamp: new Date().toISOString()
    });
});

// Función principal async
async function startServer() {
    try {
        // Configurar rutas API (async)
        await setupAPIRoutes(app);

        // Configurar WebSocket
        setupWebSocket(io);

        // Iniciar servidor
        server.listen(config.port, () => {
            console.log('🍷 =====================================');
            console.log('🚀 CartoLMM - Large Magnum Master');
            console.log('🌍 Del Terruño al Ciberespacio');
            console.log('🍷 =====================================');
            console.log(`📊 Dashboard: http://${config.host}:${config.port}/`);
            console.log(`🌐 Entorno: ${config.nodeEnv}`);
            console.log(`📝 Logging: ${config.logLevel}`);
            console.log('');
            console.log('🔍 APIs disponibles:');
            console.log('   GET /api/blocks - Información de bloques');
            console.log('   GET /api/peers - Información de nodos');
            console.log('   GET /api/transactions - Pool de transacciones');
            console.log('   GET /api/balance?address=<addr> - Balance de dirección');
            console.log('   POST /api/verify-qr-proof - Verificación QR');
            console.log('   GET /api/status - Estado del sistema');
            console.log('   GET /api/dashboard-metrics - Métricas integradas');
            console.log('   GET /api/geographic-data - Datos geográficos');
            console.log('   GET /api/magnumsmaster-status - Estado de conexión');
            console.log('');
            console.log('⚡ WebSocket activo para eventos en tiempo real');
            console.log('🍷 =====================================');
        });

    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Iniciar el servidor
startServer();