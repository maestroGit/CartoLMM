/**
 * security.js
 * Middleware centralizado de seguridad HTTP para CartoLMM
 * Hardening con Helmet, CSP estricta adaptada a visualizadores geoespaciales y control CORS corporativo
 */

import helmet from 'helmet';
import cors from 'cors';

const parseAllowedOrigins = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return [];
  return rawValue
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

export const registerSecurityMiddleware = (app, { isProduction = false } = {}) => {
  const envOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN);
  const allowCorsCredentials = process.env.CORS_ALLOW_CREDENTIALS !== 'false';
  const allowAnyOrigin = envOrigins.includes('*');

  // Nodos estándar de BlocksWine en desarrollo y producción
  const defaultAllowed = [
    'https://app.blockswine.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:6001',
    'http://localhost:8080'
  ];

  const allowedOrigins = Array.from(new Set([...envOrigins.filter(o => o !== '*'), ...defaultAllowed]));

  // Directivas CSP
  const connectSrc = [
    "'self'",
    ...allowedOrigins,
    'ws:',
    'wss:',
    'https://overpass-api.de',
    'https://*.basemaps.cartocdn.com',
    'https://*.tile.openstreetmap.org',
    'https://server.arcgisonline.com'
  ];

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Permitido para scripts de inicialización modulada y CDNs de mapas
    'https://unpkg.com',
    'https://d3js.org',
    'https://cdn.socket.io',
    ...allowedOrigins
  ];

  const styleSrc = [
    "'self'",
    "'unsafe-inline'",
    'https://unpkg.com',
    'https://fonts.googleapis.com'
  ];

  const imgSrc = [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http:' // Para tiles cartográficos locales y CDNs
  ];

  const fontSrc = [
    "'self'",
    'data:',
    'https://fonts.gstatic.com'
  ];

  const cspDirectives = [
    "default-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    `script-src ${scriptSrc.join(' ')}`,
    `style-src ${styleSrc.join(' ')}`,
    `img-src ${imgSrc.join(' ')}`,
    `font-src ${fontSrc.join(' ')}`,
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; ');

  // Aplicar Helmet base
  app.use(
    helmet({
      contentSecurityPolicy: false, // Inyectamos CSP explícita con las directivas de mapas
      crossOriginEmbedderPolicy: false // Necesario para cargar tiles cartográficos cross-origin
    })
  );

  // Inyectar cabeceras de seguridad explícitas
  app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', cspDirectives);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // CORS controlado
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowAnyOrigin && !isProduction) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Permitir cualquier puerto en localhost en entorno no-producción
      if (!isProduction && /^https?:\/\/localhost(:\d+)?$/i.test(origin)) {
        return callback(null, true);
      }

      console.warn(`[CORS] Origen bloqueado: ${origin}`);
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: allowCorsCredentials,
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    maxAge: 3600
  };

  app.use(cors(corsOptions));
};

export default registerSecurityMiddleware;
