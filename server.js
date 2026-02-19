
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
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar módulos locales
// IMPORTANT (ESM): los imports estáticos se evalúan ANTES del cuerpo del módulo.
// Para que `dotenv.config()` tenga efecto antes de leer `process.env`, cargamos
// los módulos locales con imports dinámicos dentro de startServer().

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Middleware para CORS (permitir comunicación entre proyectos)
const corsOriginsRaw = process.env.CORS_ORIGIN || '*';
const corsOrigins = String(corsOriginsRaw)
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
const corsAllowAll = corsOrigins.includes('*');

app.use((req, res, next) => {
    const origin = req.headers.origin;

    // Si no hay Origin (server-to-server), no forzamos nada.
    if (origin) {
        if (corsAllowAll) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
        } else if (corsOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Vary', 'Origin');
        }
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

// Middleware para parsear JSON
app.use(express.json());


// Servir archivos estáticos de Vite (dist) en producción
app.use(express.static(path.join(__dirname, 'dist')));

// (Opcional) Servir también public y src si necesitas acceso directo a esos recursos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images'))); // ✨ Agregar esta línea
app.use('/src', express.static(path.join(__dirname, 'src')));

// Función principal async
async function startServer() {
    try {
        // Cargar configuración y módulos locales DESPUÉS de dotenv.config()
        const [{ config }, { setupAPIRoutes }, { setupWebSocket }] = await Promise.all([
            import('./src/config/config.js'),
            import('./src/api/routes.js'),
            import('./src/websocket/events.js')
        ]);

        // Socket.IO debe inicializarse con la config ya resuelta
        const io = new SocketIOServer(server, config.socketCors);

        // Configurar rutas API (async)
        await setupAPIRoutes(app);

        // Servir archivos HTML adicionales desde public/ (list-winery.html, etc.)
        // IMPORTANTE: Debe estar ANTES del catch-all para que los .html sean accesibles
        app.use(express.static(path.join(__dirname, 'public'), {
            extensions: ['html'],
            index: false  // No servir index.html automáticamente
        }));

        // Para cualquier ruta NO-API y NO-archivo-estático, servir index.html (SPA).
        // Importante: debe estar DESPUÉS de registrar /api/* y archivos estáticos
        app.get(/^\/(?!api\/).*/, (req, res) => {
            const distIndex = path.join(__dirname, 'dist', 'index.html');
            const publicIndex = path.join(__dirname, 'public', 'index.html');
            const indexPath = fs.existsSync(distIndex) ? distIndex : publicIndex;
            res.sendFile(indexPath);
        });

        // Configurar WebSocket
        setupWebSocket(io);

        // Middleware de manejo de errores (al final)
        app.use((err, req, res, next) => {
            console.error('❌ Error en servidor:', err && err.stack ? err.stack : err);
            if (res.headersSent) return next(err);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor',
                timestamp: new Date().toISOString()
            });
        });

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
            console.log('   GET /api/users - Usuarios (proxy a magnumslocal)');
            console.log('   GET /api/users/:id - Usuario por ID');
            console.log('   GET /api/users/stats - Estadísticas de usuarios');
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