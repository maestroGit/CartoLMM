/**
 * Servidor simple para desarrollo del MVP CartoLMM
 * Sirve archivos estáticos y simula algunas APIs blockchain
 */

import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

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

// Middleware para parsear JSON
app.use(express.json());

// Middleware para servir archivos estáticos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Configurar rutas API
setupAPIRoutes(app);

// Configurar WebSocket
setupWebSocket(io);

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

// Iniciar servidor
server.listen(config.port, () => {
    console.log('🚀 Servidor CartoLMM iniciado en:', `http://${config.host}:${config.port}`);
    console.log('📊 Dashboard disponible en:', `http://${config.host}:${config.port}/`);
    console.log('🔍 APIs disponibles:');
    console.log('   GET /api/blocks - Información de bloques');
    console.log('   GET /api/peers - Información de nodos');
    console.log('   GET /api/transactions - Pool de transacciones');
    console.log('   GET /api/balance?address=<addr> - Balance de dirección');
    console.log('   POST /api/verify-qr-proof - Verificación QR');
    console.log('   GET /api/status - Estado del sistema');
    console.log('⚡ WebSocket activo para eventos en tiempo real');
    console.log(`🌍 Entorno: ${config.nodeEnv}`);
    console.log(`📝 Logging: ${config.logLevel}`);
});