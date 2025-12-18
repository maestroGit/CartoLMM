# 🔧 Configuración de Puertos y Variables de Entorno - Backend Integration

## 📋 Índice
1. [Problema Original](#problema-original)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Variables de Entorno](#variables-de-entorno)
4. [Configuración por Entornos](#configuración-por-entornos)
5. [Scripts de Arranque](#scripts-de-arranque)
6. [Despliegue en Producción](#despliegue-en-producción)
7. [Troubleshooting](#troubleshooting)

---

## 🔍 Problema Original

### ¿Por qué necesitamos configuración de entorno?

**Situación inicial:**
- Frontend CartoLMM corriendo en `localhost:8080`
- Backend magnumsmaster corriendo en `localhost:3001`
- El cliente API (`magnusmasterAPI.js`) tenía hard-coded `http://localhost:3000` ❌ (puerto incorrecto)
- Resultado: Error 404 en `/system-info` y otros endpoints

**Problema de producción:**
- En desarrollo: Backend en `localhost:3001`
- En producción: Backend en `https://api.tudominio.com`
- Cambiar código manualmente cada vez = **MALA PRÁCTICA**

**Solución:**
Variables de entorno que se adaptan automáticamente según el contexto (dev/prod).

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    CartoLMM Frontend                         │
│                  (localhost:8080 / prod)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Browser (public/index.html + app.js)              │    │
│  │  - Leaflet Map                                      │    │
│  │  - WebSocket Client (Socket.io)                    │    │
│  └────────────────────────────────────────────────────┘    │
│                          ▲                                   │
│                          │ HTTP + WebSocket                 │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Node.js Server (server.js)                        │    │
│  │  - Express (puerto 8080)                           │    │
│  │  - Socket.io Server                                │    │
│  │  - Routes (src/api/routes.js)                      │    │
│  └────────────────────────────────────────────────────┘    │
│                          ▲                                   │
│                          │ HTTP Requests                    │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  magnusmasterAPI Client                            │    │
│  │  (src/api/magnusmasterAPI.js)                      │    │
│  │                                                     │    │
│  │  constructor(baseURL = config.blockchainApiUrl)    │    │
│  │                                                     │    │
│  │  Lee de: src/config/config.js                      │    │
│  │  que obtiene: process.env.BLOCKCHAIN_API_URL       │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────│───────────────────────────────────┘
                           │ HTTP/HTTPS
                           ▼
        ┌──────────────────────────────────────┐
        │   magnumsmaster Blockchain Backend   │
        │                                       │
        │   DEV:  http://localhost:3001        │
        │   PROD: https://api.tudominio.com    │
        │                                       │
        │   Endpoints:                          │
        │   - GET /system-info                 │
        │   - GET /blockchain                  │
        │   - GET /nodes                       │
        │   - POST /transactions               │
        └──────────────────────────────────────┘
```

### Flujo de Comunicación

1. **Usuario** accede a CartoLMM frontend (navegador)
2. **Frontend** se conecta al servidor Node.js local (puerto 8080)
3. **Servidor Node.js** usa `magnusmasterAPI` para consultar blockchain
4. **magnusmasterAPI** lee `BLOCKCHAIN_API_URL` del entorno
5. **Backend magnumsmaster** responde con datos blockchain
6. **Datos** se envían via WebSocket al mapa en tiempo real

---

## 🌍 Variables de Entorno

### Archivo: `src/config/config.js`

```javascript
export const config = {
  // Puerto del servidor web CartoLMM
  port: parseInt(process.env.PORT, 10) || 8080,
  
  // Host del servidor
  host: process.env.HOST || 'localhost',
  
  // Modo de ejecución
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // 🔗 URL del backend magnumsmaster (LA MÁS IMPORTANTE)
  blockchainApiUrl: process.env.BLOCKCHAIN_API_URL || 'http://localhost:3001',
  
  // Timeout para peticiones HTTP
  apiTimeout: parseInt(process.env.API_TIMEOUT, 10) || 30000,
  
  // CORS para API
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  
  // CORS para WebSocket
  socketCors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3001',
    credentials: true
  }
};
```

### Variables Críticas

| Variable | Descripción | Dev | Producción |
|----------|-------------|-----|------------|
| `NODE_ENV` | Modo de ejecución | `development` | `production` |
| `PORT` | Puerto servidor CartoLMM | `8080` | `8080` o `80/443` |
| `HOST` | Host del servidor | `localhost` | `0.0.0.0` |
| **`BLOCKCHAIN_API_URL`** | **URL backend magnumsmaster** | `http://localhost:3001` | `https://api.tudominio.com` |
| `CORS_ORIGIN` | Origen permitido para CORS | `http://localhost:3001` | `https://tudominio.com` |
| `SOCKET_CORS_ORIGIN` | Origen WebSocket | `http://localhost:3001` | `https://tudominio.com` |

---

## ⚙️ Configuración por Entornos

### 📁 Estructura de Archivos

```
CartoLMM/
├── .env                    # Desarrollo (git ignored)
├── .env.production         # Producción (git ignored)
├── .env.example            # Plantilla documentada (git tracked)
├── src/
│   ├── config/
│   │   └── config.js       # Lee process.env
│   └── api/
│       └── magnusmasterAPI.js  # Usa config.blockchainApiUrl
└── server.js               # Arranca con dotenv
```

### 1️⃣ `.env` - Desarrollo Local

```bash
# 🌐 Desarrollo Local
NODE_ENV=development
PORT=8080
HOST=localhost

# 🔗 Backend magnumsmaster local
BLOCKCHAIN_API_URL=http://localhost:3001

# 🕐 Timeouts
API_TIMEOUT=30000

# 🔐 CORS
CORS_ORIGIN=http://localhost:3001
SOCKET_CORS_ORIGIN=http://localhost:3001
```

**Cuándo usar:**
- Desarrollo en tu máquina local
- Backend magnumsmaster corriendo en puerto 3001
- Testing de funcionalidades
- Debug con logs completos

### 2️⃣ `.env.production` - Producción

```bash
# 🌐 Producción
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# 🔗 Backend magnumsmaster en producción
# ⚠️ CAMBIA ESTOS VALORES ANTES DE DESPLEGAR
BLOCKCHAIN_API_URL=https://api.tudominio.com

# 🕐 Timeouts
API_TIMEOUT=30000

# 🔐 CORS (tu dominio real)
CORS_ORIGIN=https://tudominio.com
SOCKET_CORS_ORIGIN=https://tudominio.com
```

**Cuándo usar:**
- Servidor en producción (VPS, cloud, etc.)
- URLs públicas con HTTPS
- Backend magnumsmaster desplegado en servidor remoto
- HOST `0.0.0.0` permite acceso desde cualquier IP

### 3️⃣ `.env.example` - Documentación

```bash
# 🔧 Configuración de Variables de Entorno - CartoLMM
# Copia este archivo como .env y ajusta los valores según tu entorno

# 🌐 Puerto del Servidor Web
PORT=8080

# 🏠 Host del Servidor
HOST=localhost

# 🚀 Modo de Ejecución
NODE_ENV=development

# 🔗 URL de la API de magnumsmaster Blockchain
BLOCKCHAIN_API_URL=http://localhost:3001

# 🕐 Timeout de Peticiones API (ms)
API_TIMEOUT=30000

# 🔐 CORS Origin
CORS_ORIGIN=http://localhost:3001

# 📊 WebSocket Configuration
SOCKET_CORS_ORIGIN=http://localhost:3001

# Ejemplo para producción:
# NODE_ENV=production
# BLOCKCHAIN_API_URL=https://api.tudominio.com
# CORS_ORIGIN=https://tudominio.com
# SOCKET_CORS_ORIGIN=https://tudominio.com
```

**Propósito:**
- Documentar todas las variables disponibles
- Plantilla para nuevos desarrolladores
- Se versiona en Git (sin valores sensibles)

---

## 🚀 Scripts de Arranque

### `package.json` (actualizar scripts)

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "NODE_ENV=development node server.js",
    "prod": "NODE_ENV=production node server.js",
    "start:prod": "npm run prod"
  }
}
```

### Comandos de Ejecución

#### Desarrollo (automático)

```bash
# Lee .env automáticamente
npm start
```

**Resultado:**
- Carga `.env`
- `NODE_ENV=development`
- `BLOCKCHAIN_API_URL=http://localhost:3001`
- Servidor en `http://localhost:8080`

#### Desarrollo (explícito)

```bash
npm run dev
```

#### Producción (opción 1: variable en comando)

```bash
NODE_ENV=production npm start
```

**Resultado:**
- Node.js detecta `NODE_ENV=production`
- Carga `.env.production` automáticamente (si usas dotenv-flow o similar)
- `BLOCKCHAIN_API_URL=https://api.tudominio.com`

#### Producción (opción 2: script dedicado)

```bash
npm run prod
```

#### Producción (opción 3: variables inline)

```bash
BLOCKCHAIN_API_URL=https://api.miservidor.com PORT=3000 npm start
```

---

## 🌐 Despliegue en Producción

### Pre-requisitos

1. **Backend magnumsmaster desplegado y accesible**
   - Ejemplo: `https://api.tudominio.com`
   - Verificar con: `curl https://api.tudominio.com/system-info`

2. **Dominio configurado**
   - Frontend: `https://tudominio.com`
   - Backend API: `https://api.tudominio.com`

3. **Certificados SSL**
   - Let's Encrypt (recomendado)
   - Cloudflare (alternativa)

### Paso a Paso

#### 1. Editar `.env.production`

```bash
# En tu servidor de producción
cd /ruta/a/CartoLMM
nano .env.production
```

Actualizar valores:

```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# ⚠️ CAMBIAR POR TUS URLs REALES
BLOCKCHAIN_API_URL=https://api.tudominio.com
CORS_ORIGIN=https://tudominio.com
SOCKET_CORS_ORIGIN=https://tudominio.com
```

#### 2. Verificar `server.js` carga dotenv

```javascript
// Al inicio de server.js
import dotenv from 'dotenv';
dotenv.config();

// O con dotenv-flow para soporte automático de .env.production
import dotenv from 'dotenv-flow';
dotenv.config();
```

#### 3. Instalar dependencias

```bash
npm install
```

Si usas `dotenv-flow`:

```bash
npm install dotenv-flow
```

#### 4. Arrancar en producción

**Opción A: PM2 (recomendado)**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Arrancar con .env.production
pm2 start server.js --name cartolmm --env production

# Ver logs
pm2 logs cartolmm

# Reiniciar
pm2 restart cartolmm

# Auto-arranque en boot
pm2 startup
pm2 save
```

**Opción B: systemd**

Crear `/etc/systemd/system/cartolmm.service`:

```ini
[Unit]
Description=CartoLMM Blockchain Visualizer
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/a/CartoLMM
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Activar:

```bash
sudo systemctl enable cartolmm
sudo systemctl start cartolmm
sudo systemctl status cartolmm
```

**Opción C: Docker**

Crear `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Copiar .env.production como .env
COPY .env.production .env

EXPOSE 8080

CMD ["node", "server.js"]
```

Construir y ejecutar:

```bash
docker build -t cartolmm:latest .
docker run -d -p 8080:8080 \
  -e BLOCKCHAIN_API_URL=https://api.tudominio.com \
  --name cartolmm \
  cartolmm:latest
```

#### 5. Configurar Nginx (reverse proxy)

`/etc/nginx/sites-available/cartolmm`:

```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    # Redirigir a HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tudominio.com;
    
    ssl_certificate /etc/letsencrypt/live/tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tudominio.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/cartolmm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Verificar funcionamiento

```bash
# Desde el servidor
curl http://localhost:8080

# Desde internet
curl https://tudominio.com

# Ver logs del backend
pm2 logs cartolmm
# o
journalctl -u cartolmm -f
```

---

## 🔧 Troubleshooting

### Error 404 en `/system-info`

**Síntoma:**
```
GET http://localhost:8080/system-info 404 (Not Found)
```

**Causa:**
Frontend intenta hacer fetch a sí mismo en lugar del backend.

**Solución:**
Verificar que `magnusmasterAPI.js` usa correctamente el config:

```javascript
import { config } from '../config/config.js';

class MagnusmasterAPI {
  constructor(baseURL = config.blockchainApiUrl) {  // ✅ Correcto
    this.baseURL = baseURL;
  }
}
```

NO:
```javascript
constructor(baseURL = 'http://localhost:3000') {  // ❌ Hard-coded
```

### Backend no responde en producción

**Síntoma:**
```
Error: connect ECONNREFUSED
```

**Verificaciones:**

1. **Backend magnumsmaster está corriendo:**
   ```bash
   curl https://api.tudominio.com/system-info
   ```

2. **Variable correcta en .env.production:**
   ```bash
   cat .env.production | grep BLOCKCHAIN_API_URL
   # Debe mostrar: BLOCKCHAIN_API_URL=https://api.tudominio.com
   ```

3. **Variables cargadas en runtime:**
   ```javascript
   // Añadir temporalmente en server.js
   console.log('BLOCKCHAIN_API_URL:', process.env.BLOCKCHAIN_API_URL);
   ```

4. **CORS configurado en backend:**
   - magnumsmaster debe permitir requests desde `https://tudominio.com`

### WebSocket no conecta

**Síntoma:**
```
WebSocket connection to 'wss://tudominio.com/socket.io/' failed
```

**Solución:**
1. Verificar Nginx tiene configuración WebSocket (ver arriba)
2. Verificar `SOCKET_CORS_ORIGIN` en `.env.production`
3. Certificado SSL válido

### Variables no se cargan

**Síntoma:**
App usa valores por defecto en lugar de `.env.production`

**Soluciones:**

1. **Instalar dotenv-flow:**
   ```bash
   npm install dotenv-flow
   ```

2. **Actualizar server.js:**
   ```javascript
   import dotenvFlow from 'dotenv-flow';
   dotenvFlow.config();
   ```

3. **Forzar .env.production:**
   ```javascript
   import dotenv from 'dotenv';
   import path from 'path';
   
   if (process.env.NODE_ENV === 'production') {
     dotenv.config({ path: path.resolve('.env.production') });
   } else {
     dotenv.config();
   }
   ```

### Puerto ya en uso

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solución:**
```bash
# Encontrar proceso
lsof -i :8080
# o en Windows
netstat -ano | findstr :8080

# Matar proceso
kill -9 <PID>

# O cambiar puerto en .env
PORT=8081
```

---

## 📊 Comparativa de Configuraciones

| Aspecto | Desarrollo | Producción |
|---------|-----------|------------|
| **Archivo** | `.env` | `.env.production` |
| **NODE_ENV** | `development` | `production` |
| **Backend URL** | `http://localhost:3001` | `https://api.tudominio.com` |
| **HOST** | `localhost` | `0.0.0.0` |
| **Protocolo** | HTTP | HTTPS |
| **CORS** | Permisivo (localhost) | Restrictivo (dominio específico) |
| **Logs** | Verbose | Minimal |
| **Arranque** | `npm start` | `pm2 start` / systemd |

---

## 🎯 Checklist Pre-Producción

- [ ] Backend magnumsmaster desplegado y accesible
- [ ] `.env.production` creado con URLs correctas
- [ ] Certificados SSL instalados
- [ ] CORS configurado en backend
- [ ] Nginx/Apache configurado como reverse proxy
- [ ] PM2 o systemd configurado para auto-restart
- [ ] Firewall permite puertos 80/443
- [ ] DNS apunta a servidor correcto
- [ ] Backups configurados
- [ ] Monitoreo activo (logs, uptime)

---

## 📚 Referencias

- [dotenv documentation](https://github.com/motdotla/dotenv)
- [dotenv-flow](https://github.com/kerimdzhanov/dotenv-flow)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Nginx Reverse Proxy](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Let's Encrypt SSL](https://letsencrypt.org/)

---

**Última actualización:** 12 noviembre 2025
**Versión:** 1.0.0
