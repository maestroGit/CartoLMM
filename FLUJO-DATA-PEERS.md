# 🌐 Flujo de Datos entre Máquinas y Entornos

## 📋 Índice
1. [Arquitectura General](#arquitectura-general)
2. [Componentes del Sistema](#componentes-del-sistema)
3. [Flujo de Datos Detallado](#flujo-de-datos-detallado)
4. [Comunicación entre Máquinas](#comunicación-entre-máquinas)
5. [Escenarios de Despliegue](#escenarios-de-despliegue)
6. [Troubleshooting](#troubleshooting)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                           NAVEGADOR WEB                              │
│                        (Cliente Final)                               │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Frontend JavaScript (public/*.js)                          │    │
│  │  - app.js (event wiring)                                   │    │
│  │  - peersMetrics.js (UI de peers)                           │    │
│  │  - CartoLMMWebSocket.js (tiempo real)                      │    │
│  │  - mapService.js (Leaflet map)                             │    │
│  └────────────────────────────────────────────────────────────┘    │
│                              ▲  │                                    │
│                              │  │                                    │
│           HTTP Response ◄────┘  └───► HTTP Request                  │
│           (JSON data)                  fetch('/api/system-info')    │
│           WebSocket Events             Socket.io connection         │
└──────────────────────────────────────────┼───────────────────────────┘
                                           │
                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR CartoLMM (Node.js)                       │
│                    Puerto: 8080 (dev) / 80/443 (prod)               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  server.js (Express + Socket.io)                           │   │
│  │  - Sirve archivos estáticos (public/)                      │   │
│  │  - Configura rutas API (routes.js)                         │   │
│  │  - Maneja conexiones WebSocket                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ▲  │                                   │
│                              │  │                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  src/api/routes.js                                          │   │
│  │                                                             │   │
│  │  GET /api/system-info ───► handleGetSystemInfo()           │   │
│  │  GET /api/blocks      ───► handleGetBlocks()               │   │
│  │  GET /api/peers       ───► handleGetPeers()                │   │
│  │  GET /api/status      ───► handleGetStatus()               │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ▲  │                                   │
│                              │  │                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  src/api/magnusmasterAPI.js                                │   │
│  │  (Cliente HTTP para magnumsmaster)                         │   │
│  │                                                             │   │
│  │  constructor(baseURL = config.blockchainApiUrl)            │   │
│  │  - getSystemInfo()                                         │   │
│  │  - getBlocks()                                             │   │
│  │  - getPeers()                                              │   │
│  │  - makeRequest(endpoint, options)                          │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              ▲  │                                   │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  src/config/config.js                                       │   │
│  │                                                             │   │
│  │  blockchainApiUrl:                                         │   │
│  │    process.env.BLOCKCHAIN_API_URL ||                       │   │
│  │    'http://localhost:3001'                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              │ HTTP Request                         │
│                              │ GET /system-info                     │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SERVIDOR magnumsmaster (Blockchain)                     │
│              Puerto: 3001 (dev) / custom (prod)                     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  app/blockchain.js (Core blockchain)                        │   │
│  │  app/p2pServer.js (Red P2P)                                │   │
│  │  app/miner.js (Minería)                                    │   │
│  │                                                             │   │
│  │  Endpoint: GET /system-info                                │   │
│  │  Response: {                                               │   │
│  │    blockchain: {                                           │   │
│  │      nodeId: "Genesis",                                    │   │
│  │      httpUrl: "http://localhost:3001",                     │   │
│  │      network: {                                            │   │
│  │        peersHttp: [                                        │   │
│  │          "http://localhost:3002",                          │   │
│  │          "http://localhost:3003"                           │   │
│  │        ]                                                   │   │
│  │      }                                                     │   │
│  │    }                                                       │   │
│  │  }                                                         │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Componentes del Sistema

### 1. **Frontend (Navegador)**

**Ubicación:** `CartoLMM/public/`

**Archivos clave:**
- `peersMetrics.js`: Clase `PeersService` que solicita y renderiza peers
- `app.js`: Orquestación de eventos DOM
- `CartoLMMWebSocket.js`: Cliente WebSocket para tiempo real
- `mapService.js`: Visualización Leaflet del mapa

**Responsabilidades:**
- Renderizar UI en el navegador del usuario
- Hacer peticiones HTTP al servidor CartoLMM (puerto 8080)
- Mantener conexión WebSocket para eventos en tiempo real
- No tiene acceso directo a magnumsmaster (por seguridad y CORS)

**Ejemplo de petición:**
```javascript
// peersMetrics.js línea 12
const res = await fetch('/api/system-info');
const data = await res.json();
```

**URL completa:** `http://localhost:8080/api/system-info` (en desarrollo)

---

### 2. **Servidor CartoLMM (Node.js + Express)**

**Ubicación:** `CartoLMM/server.js` + `CartoLMM/src/`

**Puertos:**
- Desarrollo: `8080`
- Producción: `80` (HTTP) / `443` (HTTPS)

**Responsabilidades:**
- Servir archivos estáticos (HTML, CSS, JS del frontend)
- Exponer API REST bajo `/api/*` para el frontend
- Actuar como **proxy/intermediario** entre frontend y magnumsmaster
- Gestionar WebSocket para eventos blockchain en tiempo real
- Leer configuración de `.env` / `.env.production`

**Flujo interno:**
```javascript
// routes.js
app.get('/api/system-info', handleGetSystemInfo);

async function handleGetSystemInfo(req, res) {
  // Llama al cliente magnusmasterAPI
  const systemInfo = await magnusmasterClient.getSystemInfo();
  res.json(systemInfo);
}
```

**Cliente HTTP (magnusmasterAPI.js):**
```javascript
class MagnusmasterAPI {
  constructor(baseURL = config.blockchainApiUrl) {
    // baseURL viene de .env → BLOCKCHAIN_API_URL
    this.baseURL = baseURL; // http://localhost:3001 (dev)
  }

  async getSystemInfo() {
    const response = await fetch(`${this.baseURL}/system-info`);
    return await response.json();
  }
}
```

---

### 3. **Servidor magnumsmaster (Blockchain Backend)**

**Ubicación:** `magnumsmaster/` (repositorio separado)

**Puertos:**
- Desarrollo: `3001` (HTTP)
- Producción: Custom (ej: `443` con dominio `api.tudominio.com`)

**Responsabilidades:**
- Mantener la blockchain (bloques, transacciones)
- Coordinar red P2P entre nodos
- Exponer API REST pública:
  - `GET /system-info` → Info del nodo y peers
  - `GET /blockchain` → Cadena completa
  - `GET /nodes` → Nodos conectados
  - `POST /transactions` → Crear transacción

**Endpoint `/system-info` response:**
```json
{
  "blockchain": {
    "nodeId": "Genesis",
    "httpUrl": "http://localhost:3001",
    "network": {
      "peersHttp": [
        "http://localhost:3002",
        "http://localhost:3003"
      ],
      "peersP2P": [
        "ws://localhost:5002",
        "ws://localhost:5003"
      ]
    },
    "blockHeight": 42,
    "difficulty": 4
  }
}
```

---

## 🔄 Flujo de Datos Detallado

### **Escenario:** Usuario recarga la página y quiere ver los peers conectados

#### **Paso 1: Inicialización del Frontend**

```javascript
// public/app.js
document.addEventListener('DOMContentLoaded', () => {
  const peersService = new PeersService('/api/system-info');
  peersService.refresh();
});
```

**Ubicación:** Navegador del usuario
**Acción:** Crear instancia de `PeersService` con endpoint `/api/system-info`

---

#### **Paso 2: Petición HTTP desde el Frontend**

```javascript
// public/peersMetrics.js
fetchPeers = async () => {
  const res = await fetch(this.endpoint); // '/api/system-info'
  const data = await res.json();
  this.peers = data.blockchain?.network?.peersHttp || [];
  return this.peers;
}
```

**Request HTTP:**
```http
GET http://localhost:8080/api/system-info HTTP/1.1
Host: localhost:8080
Accept: application/json
```

**Ubicación:** Navegador → Servidor CartoLMM
**Protocolo:** HTTP
**Puerto destino:** 8080 (CartoLMM)

---

#### **Paso 3: Servidor CartoLMM recibe la petición**

```javascript
// src/api/routes.js
app.get('/api/system-info', handleGetSystemInfo);

async function handleGetSystemInfo(req, res) {
  console.log('📥 Request a /api/system-info desde frontend');
  
  try {
    const systemInfo = await magnusmasterClient.getSystemInfo();
    
    if (systemInfo && !systemInfo.error) {
      res.json(systemInfo);
    } else {
      res.status(503).json({
        success: false,
        error: 'Backend magnumsmaster no disponible'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

**Ubicación:** Servidor CartoLMM (puerto 8080)
**Acción:** 
1. Recibe request del navegador
2. Invoca `magnusmasterClient.getSystemInfo()`
3. Espera respuesta

---

#### **Paso 4: Cliente magnusmasterAPI hace petición al Backend**

```javascript
// src/api/magnusmasterAPI.js
class MagnusmasterAPI {
  constructor(baseURL = config.blockchainApiUrl) {
    this.baseURL = baseURL; // 'http://localhost:3001'
  }

  async getSystemInfo() {
    console.log(`🔗 Consultando ${this.baseURL}/system-info`);
    
    const response = await fetch(`${this.baseURL}/system-info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    return await response.json();
  }
}
```

**Request HTTP:**
```http
GET http://localhost:3001/system-info HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Ubicación:** Servidor CartoLMM → Servidor magnumsmaster
**Protocolo:** HTTP (node-fetch desde backend)
**Puerto origen:** 8080 (CartoLMM)
**Puerto destino:** 3001 (magnumsmaster)

**Configuración (dev):**
```bash
# .env
BLOCKCHAIN_API_URL=http://localhost:3001
```

**Configuración (prod):**
```bash
# .env.production
BLOCKCHAIN_API_URL=https://api.tudominio.com
```

---

#### **Paso 5: magnumsmaster procesa la petición**

```javascript
// magnumsmaster/server.js (o similar)
app.get('/system-info', (req, res) => {
  console.log('📊 Generando system-info...');
  
  const systemInfo = {
    blockchain: {
      nodeId: blockchain.nodeId,
      httpUrl: blockchain.httpUrl,
      network: {
        peersHttp: p2pServer.getPeersHttp(), // Array de URLs
        peersP2P: p2pServer.getPeersP2P()
      },
      blockHeight: blockchain.chain.length,
      difficulty: blockchain.difficulty
    }
  };
  
  res.json(systemInfo);
});
```

**Response HTTP:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "blockchain": {
    "nodeId": "Genesis",
    "httpUrl": "http://localhost:3001",
    "network": {
      "peersHttp": [
        "http://localhost:3002",
        "http://localhost:3003"
      ]
    },
    "blockHeight": 15,
    "difficulty": 4
  }
}
```

**Ubicación:** Servidor magnumsmaster (puerto 3001)
**Acción:** 
1. Consulta estado interno de la blockchain
2. Lista peers conectados por P2P
3. Genera JSON con toda la info
4. Envía respuesta HTTP 200

---

#### **Paso 6: magnusmasterAPI recibe la respuesta**

```javascript
// src/api/magnusmasterAPI.js
async getSystemInfo() {
  const response = await fetch(`${this.baseURL}/system-info`);
  const data = await response.json();
  
  console.log('✅ System info recibido:', data);
  return data; // Devuelve al handler de routes.js
}
```

**Ubicación:** Servidor CartoLMM
**Acción:** Parsear JSON y retornar objeto JavaScript

---

#### **Paso 7: Handler devuelve respuesta al Frontend**

```javascript
// src/api/routes.js
async function handleGetSystemInfo(req, res) {
  const systemInfo = await magnusmasterClient.getSystemInfo();
  
  // Aquí ya tenemos el JSON de magnumsmaster
  res.json(systemInfo); // Envía al navegador
}
```

**Response HTTP al navegador:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "blockchain": {
    "nodeId": "Genesis",
    "httpUrl": "http://localhost:3001",
    "network": {
      "peersHttp": [
        "http://localhost:3002",
        "http://localhost:3003"
      ]
    }
  }
}
```

**Ubicación:** Servidor CartoLMM → Navegador
**Acción:** Reenviar (proxy) la respuesta de magnumsmaster

---

#### **Paso 8: Frontend procesa y renderiza los datos**

```javascript
// public/peersMetrics.js
fetchPeers = async () => {
  const res = await fetch(this.endpoint);
  const data = await res.json();
  
  // Extrae peers del JSON
  this.peers = data.blockchain?.network?.peersHttp || [];
  console.log('👥 Peers recibidos:', this.peers);
  
  return this.peers;
}

renderMetricGrid = (selector) => {
  const grid = document.querySelector(selector);
  
  this.peers.forEach(peerUrl => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <div class="metric-label">Peer</div>
      <div class="metric-value">${peerUrl}</div>
    `;
    grid.appendChild(card);
  });
}
```

**Ubicación:** Navegador
**Acción:**
1. Recibe JSON con peers
2. Extrae array `peersHttp`
3. Crea elementos DOM para cada peer
4. Los inserta en la UI

**Resultado visual:**
```
┌─────────────────────────┐
│ 📊 Red Blockchain       │
├─────────────────────────┤
│ Peer                    │
│ http://localhost:3002   │
├─────────────────────────┤
│ Peer                    │
│ http://localhost:3003   │
└─────────────────────────┘
```

---

## 🌍 Comunicación entre Máquinas

### **Desarrollo (Todo en localhost)**

```
┌─────────────────────────────────────────────────┐
│              TU MÁQUINA (localhost)              │
│                                                  │
│  ┌──────────────────────────────────────┐      │
│  │ Navegador (puerto cualquiera)        │      │
│  │ http://localhost:8080                │      │
│  └──────────┬───────────────────────────┘      │
│             │ fetch('/api/system-info')         │
│             ▼                                    │
│  ┌──────────────────────────────────────┐      │
│  │ Servidor CartoLMM                    │      │
│  │ Puerto: 8080                         │      │
│  │ Process: npm start                   │      │
│  └──────────┬───────────────────────────┘      │
│             │ HTTP GET                          │
│             │ http://localhost:3001/system-info │
│             ▼                                    │
│  ┌──────────────────────────────────────┐      │
│  │ Servidor magnumsmaster               │      │
│  │ Puerto: 3001                         │      │
│  │ Process: npm start (otro terminal)   │      │
│  └──────────────────────────────────────┘      │
└─────────────────────────────────────────────────┘
```

**Todos los procesos corren en la misma máquina.**

**Comunicación:**
- Frontend → CartoLMM: `localhost:8080`
- CartoLMM → magnumsmaster: `localhost:3001`

---

### **Producción (Máquinas separadas)**

#### **Opción A: Backend en servidor separado**

```
┌─────────────────────────────────────────┐
│       USUARIO (Navegador)               │
│  https://tudominio.com                  │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│    SERVIDOR WEB (VPS/Cloud)             │
│    IP: 203.0.113.50                     │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │ Nginx (Reverse Proxy)            │  │
│  │ Puerto: 443 (HTTPS)              │  │
│  └──────┬───────────────────────────┘  │
│         │ proxy_pass                    │
│         ▼                                │
│  ┌──────────────────────────────────┐  │
│  │ Servidor CartoLMM                │  │
│  │ Puerto: 8080 (interno)           │  │
│  │ Process: PM2                     │  │
│  └──────┬───────────────────────────┘  │
│         │                                │
└─────────┼────────────────────────────────┘
          │ HTTPS
          │ https://api.tudominio.com/system-info
          ▼
┌─────────────────────────────────────────┐
│   SERVIDOR BLOCKCHAIN (Cloud)           │
│   IP: 203.0.113.100                     │
│   Dominio: api.tudominio.com            │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │ Nginx (SSL)                      │  │
│  │ Puerto: 443 (HTTPS)              │  │
│  └──────┬───────────────────────────┘  │
│         │ proxy_pass                    │
│         ▼                                │
│  ┌──────────────────────────────────┐  │
│  │ magnumsmaster                    │  │
│  │ Puerto: 3001 (interno)           │  │
│  │ Process: PM2                     │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Variables de entorno (.env.production en servidor CartoLMM):**
```bash
NODE_ENV=production
BLOCKCHAIN_API_URL=https://api.tudominio.com
CORS_ORIGIN=https://tudominio.com
```

**Comunicación:**
- Usuario → CartoLMM: `https://tudominio.com` (IP: 203.0.113.50)
- CartoLMM → magnumsmaster: `https://api.tudominio.com` (IP: 203.0.113.100)

---

#### **Opción B: Todo en el mismo servidor**

```
┌─────────────────────────────────────────┐
│       USUARIO (Navegador)               │
│  https://tudominio.com                  │
└──────────────┬──────────────────────────┘
               │ HTTPS
               ▼
┌─────────────────────────────────────────┐
│    SERVIDOR ÚNICO (VPS)                 │
│    IP: 203.0.113.50                     │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │ Nginx (Reverse Proxy)            │  │
│  │ Puerto: 443 (HTTPS)              │  │
│  │                                   │  │
│  │ Location / → localhost:8080      │  │
│  │ Location /blockchain-api/ →      │  │
│  │           localhost:3001         │  │
│  └──────┬───────────┬────────────────┘  │
│         │           │                    │
│         ▼           ▼                    │
│  ┌─────────────┐ ┌──────────────────┐  │
│  │ CartoLMM    │ │ magnumsmaster    │  │
│  │ :8080       │ │ :3001            │  │
│  └─────────────┘ └──────────────────┘  │
└─────────────────────────────────────────┘
```

**Variables de entorno (.env.production):**
```bash
NODE_ENV=production
# Misma máquina, localhost funciona
BLOCKCHAIN_API_URL=http://localhost:3001
# O usar path proxy de Nginx
# BLOCKCHAIN_API_URL=https://tudominio.com/blockchain-api
CORS_ORIGIN=https://tudominio.com
```

---

## 📊 Escenarios de Despliegue

### **1. Desarrollo Local (actual)**

| Componente | Ubicación | Puerto | URL |
|------------|-----------|--------|-----|
| Frontend | Navegador | - | `http://localhost:8080` |
| CartoLMM Server | Terminal 1 | 8080 | `http://localhost:8080` |
| magnumsmaster | Terminal 2 | 3001 | `http://localhost:3001` |

**Comandos:**
```bash
# Terminal 1 (CartoLMM)
cd CartoLMM
npm start

# Terminal 2 (magnumsmaster)
cd magnumsmaster
npm start
```

**Archivo `.env` (CartoLMM):**
```bash
NODE_ENV=development
PORT=8080
BLOCKCHAIN_API_URL=http://localhost:3001
```

---

### **2. Staging (servidor de pruebas)**

| Componente | Ubicación | Puerto | URL |
|------------|-----------|--------|-----|
| Frontend | Navegador | - | `http://staging.tudominio.com` |
| CartoLMM Server | VPS staging | 8080 | interno |
| magnumsmaster | VPS staging | 3001 | interno |

**Archivo `.env.staging`:**
```bash
NODE_ENV=staging
PORT=8080
BLOCKCHAIN_API_URL=http://localhost:3001
CORS_ORIGIN=http://staging.tudominio.com
```

---

### **3. Producción (servidores separados)**

| Componente | Ubicación | Puerto | URL |
|------------|-----------|--------|-----|
| Frontend | Navegador | - | `https://tudominio.com` |
| CartoLMM Server | VPS 1 | 8080 | `https://tudominio.com` |
| magnumsmaster | VPS 2 | 443 | `https://api.tudominio.com` |

**Archivo `.env.production` (en VPS 1):**
```bash
NODE_ENV=production
PORT=8080
HOST=0.0.0.0
BLOCKCHAIN_API_URL=https://api.tudominio.com
CORS_ORIGIN=https://tudominio.com
SOCKET_CORS_ORIGIN=https://tudominio.com
```

**Despliegue:**
```bash
# En VPS 1 (CartoLMM)
pm2 start server.js --name cartolmm --env production

# En VPS 2 (magnumsmaster)
pm2 start server.js --name magnumsmaster --env production
```

---

## 🔍 Troubleshooting

### **Error: 404 en /api/system-info**

**Síntoma:**
```
GET http://localhost:8080/api/system-info 404 (Not Found)
```

**Causas posibles:**

1. **Ruta no configurada en routes.js:**
   ```javascript
   // routes.js debe tener:
   app.get('/api/system-info', handleGetSystemInfo);
   ```

2. **Handler no implementado:**
   ```javascript
   async function handleGetSystemInfo(req, res) {
     const systemInfo = await magnusmasterClient.getSystemInfo();
     res.json(systemInfo);
   }
   ```

3. **Frontend usa endpoint incorrecto:**
   ```javascript
   // ❌ Incorrecto
   fetch('/system-info')
   
   // ✅ Correcto
   fetch('/api/system-info')
   ```

---

### **Error: ECONNREFUSED al backend**

**Síntoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Causas:**

1. **magnumsmaster no está corriendo:**
   ```bash
   # Verificar
   curl http://localhost:3001/system-info
   
   # Si falla, arrancar magnumsmaster
   cd magnumsmaster
   npm start
   ```

2. **Puerto incorrecto en .env:**
   ```bash
   # Verificar
   cat .env | grep BLOCKCHAIN_API_URL
   
   # Debe ser:
   BLOCKCHAIN_API_URL=http://localhost:3001
   ```

3. **Firewall bloqueando:**
   ```bash
   # Windows
   netstat -ano | findstr :3001
   
   # Linux/Mac
   lsof -i :3001
   ```

---

### **Error: CORS en producción**

**Síntoma:**
```
Access to fetch at 'https://api.tudominio.com/system-info' 
from origin 'https://tudominio.com' has been blocked by CORS policy
```

**Solución en magnumsmaster:**
```javascript
// magnumsmaster/server.js
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://tudominio.com',
  credentials: true
}));
```

**Variables (.env en magnumsmaster):**
```bash
CORS_ORIGIN=https://tudominio.com
```

---

### **Error: Unexpected token '<' not valid JSON**

**Síntoma:**
```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

**Causa:** 
El servidor devuelve HTML (página de error 404) en lugar de JSON.

**Debugging:**
```javascript
// peersMetrics.js
fetchPeers = async () => {
  const res = await fetch(this.endpoint);
  
  // Verificar status
  console.log('Status:', res.status);
  
  // Leer como texto primero
  const text = await res.text();
  console.log('Response:', text);
  
  // Si es HTML, hay un 404
  if (text.startsWith('<!DOCTYPE')) {
    console.error('❌ Endpoint devuelve HTML (404)');
    return [];
  }
  
  const data = JSON.parse(text);
  // ...resto del código
}
```

**Solución:** Verificar que la ruta existe en `routes.js`.

---

## 📝 Resumen del Flujo Completo

```
1. Usuario abre http://localhost:8080 en navegador
   └─► Nginx/Express sirve index.html

2. index.html carga app.js
   └─► app.js inicializa PeersService

3. PeersService.fetchPeers() hace fetch('/api/system-info')
   └─► Request HTTP a CartoLMM servidor (puerto 8080)

4. Express recibe GET /api/system-info
   └─► routes.js llama handleGetSystemInfo()

5. handleGetSystemInfo() invoca magnusmasterClient.getSystemInfo()
   └─► magnusmasterAPI.js hace fetch a http://localhost:3001/system-info

6. magnumsmaster recibe GET /system-info
   └─► Lee blockchain.nodeId, p2pServer.getPeers(), etc.
   └─► Devuelve JSON con toda la info

7. magnusmasterAPI.js recibe JSON
   └─► Lo parsea y retorna a handleGetSystemInfo()

8. handleGetSystemInfo() reenvía JSON al navegador
   └─► res.json(systemInfo)

9. PeersService.fetchPeers() recibe respuesta
   └─► Extrae data.blockchain.network.peersHttp

10. PeersService.renderMetricGrid() crea elementos DOM
    └─► Usuario ve peers en la UI ✅
```

---

**Última actualización:** 12 noviembre 2025  
**Versión:** 1.0.0

¡Correcto!
Ahora que has solucionado la comunicación de frontend <-> backend por el puerto correcto, tienes estas dos formas principales de recibir datos de peers/métricas en tu frontend:

1. Vía petición HTTP directa
Cuando tu frontend hace:

JavaScript
fetch('http://localhost:3001/system-info')
…recibe un snapshot JSON con la información actual de todo tu nodo: peers, bloques, métricas, etc.

Ventaja: Lo puedes pedir cuando quieras (al cargar, al refrescar, cada X segundos…)
Uso típico: Llamadas periódicas o bajo demanda desde tu código JS.
2. Vía WebSocket (en tiempo real)
Si tienes un WebSocket abierto con el backend, como:

JavaScript
const socket = io('http://localhost:3001');
// o simplemente io() si está en el mismo origen

socket.on('system:metrics', (metrics) => {
  // Aquí recibes las métricas de sistema, posiblemente ¡actualizadas en tiempo real!
});
…el backend puede empujar nuevos datos en tiempo real al frontend cada vez que algo relevante cambia (nuevo bloque, nueva transacción, nuevo peer, etc).

Ventaja: ¡Actualización instantánea! El usuario ve los cambios sin refrescar.
Uso típico: Dashboards y paneles “vivos”, notificaciones y animaciones.
Resumen (y cómo usarlo en tu código)
Ambos métodos son completamente compatibles y combinables.
Puedes usar el fetch inicial para cargar el estado base, y luego escuchar eventos por socket para actualizar la UI en tiempo real.
O sólo usar fetch si no quieres trabajar con WebSocket.
Ejemplo de ambos juntos:

JavaScript
// Al cargar, snapshot del estado
fetch('http://localhost:3001/system-info').then(res => res.json()).then(pintarMétricas);

// Luego, en tiempo real:
socket.on('system:metrics', pintarMétricas);

// Donde pintarMétricas es tu función de actualización de UI
