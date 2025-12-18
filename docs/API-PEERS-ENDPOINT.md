# 🌐 API Endpoint: /api/peers

## 📋 Descripción

Endpoint mejorado que devuelve información **detallada** de todos los nodos de la red blockchain, incluyendo el nodo local y todos los peers remotos.

A diferencia del endpoint básico `/api/system-info` que solo devuelve URLs simples, este endpoint:
- ✅ Consulta cada peer individualmente
- ✅ Verifica estado en tiempo real (online/offline)
- ✅ Mide tiempo de respuesta
- ✅ Obtiene altura de bloque y dificultad de cada nodo
- ✅ Calcula estadísticas globales de red

---

## 🔗 Endpoint

```
GET /api/peers
```

**URL completa (desarrollo):**
```
http://localhost:8080/api/peers
```

**URL completa (producción):**
```
https://tudominio.com/api/peers
```

---

## 📥 Request

### Headers
```http
GET /api/peers HTTP/1.1
Host: localhost:8080
Accept: application/json
```

### Query Parameters
Ninguno (por ahora).

---

## 📤 Response

### Success Response (200 OK)

```json
{
  "success": true,
  "peers": [
    {
      "nodeId": "Genesis",
      "httpUrl": "http://localhost:3001",
      "p2pUrl": "ws://localhost:5001",
      "isLocal": true,
      "status": "online",
      "blockHeight": 42,
      "difficulty": 4,
      "lastSeen": "2025-11-12T10:30:00.000Z",
      "responseTime": 0,
      "version": "1.0.0",
      "peers": 2
    },
    {
      "nodeId": "Nodo-Madrid",
      "httpUrl": "http://localhost:3002",
      "p2pUrl": "ws://localhost:5002",
      "isLocal": false,
      "status": "online",
      "blockHeight": 42,
      "difficulty": 4,
      "lastSeen": "2025-11-12T10:30:05.000Z",
      "responseTime": 145,
      "version": "1.0.0",
      "peers": 2
    },
    {
      "nodeId": "Nodo-Barcelona",
      "httpUrl": "http://localhost:3003",
      "p2pUrl": "ws://localhost:5003",
      "isLocal": false,
      "status": "offline",
      "blockHeight": 0,
      "difficulty": 0,
      "lastSeen": null,
      "responseTime": 5003,
      "error": "Request timeout"
    }
  ],
  "stats": {
    "total": 3,
    "online": 2,
    "offline": 1,
    "error": 0,
    "avgResponseTime": 73,
    "maxBlockHeight": 42,
    "minBlockHeight": 42
  },
  "network": {
    "localNode": "Genesis",
    "p2pConnections": 2,
    "totalPeers": 3
  },
  "timestamp": "2025-11-12T10:30:10.000Z"
}
```

### Error Response (503 Service Unavailable)

```json
{
  "success": false,
  "error": "Backend magnumsmaster no disponible",
  "details": "connect ECONNREFUSED 127.0.0.1:3001",
  "timestamp": "2025-11-12T10:30:10.000Z"
}
```

### Error Response (500 Internal Server Error)

```json
{
  "success": false,
  "error": "Datos de blockchain no disponibles",
  "timestamp": "2025-11-12T10:30:10.000Z"
}
```

---

## 📊 Estructura de Datos

### **Peer Object**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `nodeId` | `string` | Identificador único del nodo | `"Genesis"`, `"Nodo-Madrid"` |
| `httpUrl` | `string` | URL HTTP del nodo | `"http://localhost:3001"` |
| `p2pUrl` | `string` | URL WebSocket P2P del nodo | `"ws://localhost:5001"` |
| `isLocal` | `boolean` | Si es el nodo local (servidor principal) | `true`, `false` |
| `status` | `string` | Estado del nodo | `"online"`, `"offline"`, `"error"` |
| `blockHeight` | `number` | Altura de la blockchain en este nodo | `42` |
| `difficulty` | `number` | Dificultad de minado actual | `4` |
| `lastSeen` | `string\|null` | Timestamp ISO de última conexión | `"2025-11-12T10:30:00.000Z"` |
| `responseTime` | `number` | Tiempo de respuesta en ms | `145` |
| `version` | `string` | Versión del software (opcional) | `"1.0.0"` |
| `peers` | `number` | Número de peers que tiene este nodo (opcional) | `2` |
| `error` | `string` | Mensaje de error si status es "offline" o "error" | `"Request timeout"` |

### **Stats Object**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total` | `number` | Total de nodos en la red (local + peers) |
| `online` | `number` | Nodos actualmente online |
| `offline` | `number` | Nodos offline o no alcanzables |
| `error` | `number` | Nodos con errores de consulta |
| `avgResponseTime` | `number` | Tiempo promedio de respuesta (solo online) en ms |
| `maxBlockHeight` | `number` | Altura máxima de bloque en la red |
| `minBlockHeight` | `number` | Altura mínima de bloque en la red (excluye 0) |

### **Network Object**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `localNode` | `string` | NodeId del nodo local |
| `p2pConnections` | `number` | Número de conexiones P2P activas |
| `totalPeers` | `number` | Total de peers en la red |

---

## 🔄 Flujo de Funcionamiento

### Diagrama de Secuencia

```
Frontend                CartoLMM Server              magnumsmaster (local)    Peer 1          Peer 2
   │                           │                              │                    │               │
   │  GET /api/peers           │                              │                    │               │
   ├──────────────────────────►│                              │                    │               │
   │                           │                              │                    │               │
   │                           │  GET /system-info            │                    │               │
   │                           ├─────────────────────────────►│                    │               │
   │                           │◄─────────────────────────────┤                    │               │
   │                           │  { nodeId, network: {        │                    │               │
   │                           │    peersHttp: [...] }}       │                    │               │
   │                           │                              │                    │               │
   │                           │  GET http://peer1:3002/system-info                │               │
   │                           ├───────────────────────────────────────────────────►│               │
   │                           │◄───────────────────────────────────────────────────┤               │
   │                           │  { nodeId, blockHeight, ... }                      │               │
   │                           │                              │                    │               │
   │                           │  GET http://peer2:3003/system-info                                │
   │                           ├───────────────────────────────────────────────────────────────────►│
   │                           │◄───────────────────────────────────────────────────────────────────┤
   │                           │  { nodeId, blockHeight, ... }                                      │
   │                           │                              │                    │               │
   │                           │  Procesa y enriquece datos   │                    │               │
   │                           │  Calcula estadísticas        │                    │               │
   │                           │                              │                    │               │
   │  { success: true,         │                              │                    │               │
   │    peers: [...],          │                              │                    │               │
   │    stats: {...} }         │                              │                    │               │
   │◄──────────────────────────┤                              │                    │               │
   │                           │                              │                    │               │
```

### Pasos detallados

1. **Frontend hace request:** Browser ejecuta `fetch('/api/peers')`

2. **Server obtiene nodo local:** CartoLMM llama a `magnusmasterClient.getSystemInfo()`
   - Obtiene `nodeId`, `httpUrl`, `p2pUrl`, `blockHeight`, etc. del nodo local
   - Obtiene lista de peers remotos en `network.peersHttp`

3. **Server consulta cada peer:** Para cada URL en `peersHttp`:
   - Hace `fetch('http://peer:3002/system-info')` con timeout de 5s
   - Si responde: marca como `online`, extrae `blockHeight`, `difficulty`, etc.
   - Si falla: marca como `offline`, guarda mensaje de error

4. **Procesamiento paralelo:** Usa `Promise.allSettled()` para consultar todos los peers simultáneamente

5. **Cálculo de estadísticas:** Genera objeto `stats`:
   - Cuenta online/offline/error
   - Calcula tiempo promedio de respuesta
   - Detecta altura máxima/mínima de bloques

6. **Response al frontend:** Devuelve JSON con:
   - Array de peers (local + remotos)
   - Estadísticas de red
   - Info de conexiones P2P

---

## 🎯 Casos de Uso

### 1. Visualizar red en mapa

```javascript
const response = await fetch('/api/peers');
const data = await response.json();

if (data.success) {
  data.peers.forEach(peer => {
    if (peer.lat && peer.lng) {
      map.addMarker({
        lat: peer.lat,
        lng: peer.lng,
        popup: `${peer.nodeId} - ${peer.status}`,
        color: peer.status === 'online' ? 'green' : 'red'
      });
    }
  });
}
```

### 2. Detectar nodos desincronizados

```javascript
const response = await fetch('/api/peers');
const data = await response.json();

if (data.success) {
  const { maxBlockHeight, minBlockHeight } = data.stats;
  const diff = maxBlockHeight - minBlockHeight;
  
  if (diff > 10) {
    console.warn(`⚠️ Red desincronizada: diferencia de ${diff} bloques`);
    
    // Encontrar nodos atrasados
    const laggingNodes = data.peers.filter(
      p => p.blockHeight < maxBlockHeight - 5
    );
    
    console.log('Nodos atrasados:', laggingNodes.map(p => p.nodeId));
  }
}
```

### 3. Monitoreo de salud de red

```javascript
const response = await fetch('/api/peers');
const data = await response.json();

if (data.success) {
  const healthPercent = (data.stats.online / data.stats.total) * 100;
  
  console.log(`Salud de red: ${healthPercent.toFixed(1)}%`);
  console.log(`Peers online: ${data.stats.online}/${data.stats.total}`);
  console.log(`Ping promedio: ${data.stats.avgResponseTime}ms`);
  
  if (healthPercent < 50) {
    alert('⚠️ Más del 50% de nodos están offline');
  }
}
```

### 4. Tabla de peers con todas las métricas

```javascript
const response = await fetch('/api/peers');
const data = await response.json();

if (data.success) {
  const table = data.peers.map(peer => ({
    'Node ID': peer.nodeId,
    'Status': peer.status,
    'Height': peer.blockHeight,
    'Ping': `${peer.responseTime}ms`,
    'URL': peer.httpUrl,
    'Local': peer.isLocal ? 'YES' : 'NO'
  }));
  
  console.table(table);
}
```

---

## ⚙️ Configuración

### Timeout de consulta

Por defecto, cada peer tiene un timeout de **5 segundos**. Si no responde, se marca como offline.

Para modificar el timeout, edita `routes.js`:

```javascript
// routes.js línea ~200
signal: AbortSignal.timeout(5000) // Cambiar a 10000 para 10 segundos
```

### Frecuencia de actualización (frontend)

Por defecto, el frontend refresca cada **30 segundos**:

```javascript
// peersMetrics.js línea ~270
setInterval(() => window.peersService.refresh(), 30000); // 30s
```

---

## 🔧 Implementación Backend

### Archivos modificados

1. **`src/api/routes.js`**
   - Handler `handleGetPeers()` completamente reescrito
   - Consulta paralela de todos los peers
   - Cálculo de estadísticas

2. **`src/api/magnusmasterAPI.js`**
   - Nuevos métodos auxiliares:
     - `getPeerInfo(peerUrl, timeout)` - Consulta detallada de un peer
     - `pingPeer(peerUrl)` - Ping rápido (HEAD request)

3. **`public/peersMetrics.js`**
   - Clase `PeersService` mejorada
   - Renderizado con info detallada (status, blockHeight, responseTime)
   - Card de estadísticas globales

---

## 🚀 Testing

### cURL

```bash
# Request básico
curl http://localhost:8080/api/peers

# Pretty print JSON
curl -s http://localhost:8080/api/peers | jq .

# Solo online
curl -s http://localhost:8080/api/peers | jq '.peers[] | select(.status == "online")'

# Stats
curl -s http://localhost:8080/api/peers | jq '.stats'
```

### JavaScript (Browser Console)

```javascript
// Obtener y mostrar peers
fetch('/api/peers')
  .then(r => r.json())
  .then(data => {
    console.log('Peers:', data.peers);
    console.log('Stats:', data.stats);
    console.table(data.peers);
  });
```

### Postman

```
GET http://localhost:8080/api/peers
Headers:
  Accept: application/json
```

---

## 📈 Performance

### Tiempos esperados

| Escenario | Tiempo |
|-----------|--------|
| 1 peer online | ~150ms |
| 3 peers online | ~200ms (paralelo) |
| 1 peer offline (timeout) | ~5000ms |
| 3 peers offline | ~5000ms (paralelo) |

**Nota:** Los peers offline añaden latencia debido al timeout. Se procesan en paralelo, por lo que el tiempo total es el del peer más lento.

### Optimización

Si tienes muchos peers (>10) y algunos están offline:
- Reducir timeout a 3000ms
- Implementar caché temporal (5-10s)
- Consultar solo peers online conocidos

---

## 🔐 Seguridad

### Consideraciones

1. **CORS:** El backend debe permitir requests desde el frontend
2. **Rate Limiting:** Considera limitar requests a `/api/peers` (ej: max 10/min)
3. **Validación de URLs:** Los peers devueltos vienen de magnumsmaster, confía solo en tu red
4. **Timeout:** Protege contra peers lentos que bloqueen el endpoint

### Variables de entorno

```bash
# .env
BLOCKCHAIN_API_URL=http://localhost:3001  # Solo tu blockchain confiable
CORS_ORIGIN=http://localhost:8080         # Tu frontend
```

---

## 📝 Notas

- **Peers offline:** No significa que estén caídos permanentemente, pueden estar reiniciando o detrás de firewall
- **blockHeight diferente:** Es normal una diferencia de 1-2 bloques durante propagación
- **responseTime variable:** Depende de red, carga del peer, etc.
- **isLocal:** Solo hay un nodo local (el servidor que ejecuta CartoLMM)

---

**Última actualización:** 12 noviembre 2025  
**Versión:** 2.0.0 (endpoint mejorado)
