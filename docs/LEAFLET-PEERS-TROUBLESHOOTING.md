# Troubleshooting: Integración Leaflet + Peers Blockchain

## Resumen Ejecutivo

Este documento detalla los problemas encontrados durante la implementación de la visualización de peers blockchain en el mapa Leaflet, las soluciones aplicadas y comandos útiles para debugging.

**Estado Final**: Sistema operativo con carga automática de 4 peers y actualizaciones en tiempo real.

## Tabla de Contenidos

1. [Problemas Encontrados](#problemas-encontrados)
2. [Soluciones Implementadas](#soluciones-implementadas)
3. [Cambio de Modos: Mock → GeoIP](#cambio-de-modos-mock--geoip)
4. [Comandos de Debug](#comandos-de-debug)
5. [Verificación del Sistema](#verificación-del-sistema)

## Problemas Encontrados

### 1. Error de Módulos ES6

**Problema**: 
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**Causa**: Los archivos `PeerMarker.js` y `PeerLayerManager.js` usaban `import/export` ES6, pero se cargaban como scripts normales en el HTML.

**Impacto**: Los servicios no se cargaban y `window.PeerLayerManager` era `undefined`.

### 2. Peers No Aparecían en el Mapa

**Problema**: 
- `window.mapService.getPeerStats()` retornaba `{total: 0}`
- API `/api/peers` funcionaba correctamente (4 peers)
- `getAllMarkers()` retornaba array vacío

**Causa**: Bug en `blockchainService.js` línea 110:
```javascript
// Incorrecto
return result.success ? result.data : [];

// Correcto
return result.success ? result.peers : [];
```

**Impacto**: Los peers nunca se cargaban en el mapa a pesar de existir en la API.

### 3. realtimeDashboardService No Se Cargaba

**Problema**: `window.realtimeDashboardService` era `undefined`

**Causas Múltiples**:
1. Archivo como módulo ES6: Cargado con `type="module"`, ejecutándose en contexto aislado
2. Caracteres corruptos: Emojis UTF-8 mal codificados causaban `SyntaxError: Invalid or unexpected token`
3. Caché del navegador: Versiones antiguas del archivo persistían

### 4. Error en renderMetricGrid

**Problema**:
```
SyntaxError: Failed to execute 'querySelector' on 'Document': '[object Object]' is not a valid selector
```

**Causa**: `realtimeDashboardService.js` pasaba objeto `data` como argumento a `renderMetricGrid()` en lugar de dejar que use el selector por defecto.

### 5. Error bodegasData.bodegas?.filter

**Problema**:
```
TypeError: bodegasData.bodegas?.filter is not a function
```

**Causa**: `updateMetrics()` esperaba `bodegasData.bodegas` como array, pero recibía un objeto con propiedades `{total, active, ...}`.

## Soluciones Implementadas

### 1. Conversión de Módulos ES6 a Scripts Globales

**Archivos Modificados**:
- `src/leaflet/PeerMarker.js`
- `src/leaflet/PeerLayerManager.js`
- `src/services/realtimeDashboardService.js`

**Cambio Aplicado**:
```javascript
// Antes (ES6)
export class PeerMarker { ... }

// Después (Global)
class PeerMarker { ... }
window.PeerMarker = PeerMarker;
```

### 2. Corrección de blockchainService.getPeers()

**Archivo**: `src/services/blockchainService.js` (línea 110)

```javascript
async getPeers() {
  try {
    const result = await this.makeRequest('/api/peers');
    return result.success ? result.peers : [];
  } catch (error) {
    console.error('Error obteniendo peers:', error);
    return [];
  }
}
```

### 3. Inicialización Automática con realtimeDashboardService

**Archivo**: `src/services/realtimeDashboardService.js`

```javascript
function initRealtimeServiceGlobal() {
  if (!window.socket || !window.dashboardService || 
      !window.peersService || !window.mapService) {
    console.log('Esperando servicios para realtimeDashboardService...');
    setTimeout(initRealtimeServiceGlobal, 100);
    return;
  }
  
  console.log('Inicializando realtimeDashboardService...');
  
  const realtimeService = new RealtimeDashboardService({
    socket: window.socket,
    dashboardService: window.dashboardService,
    peersService: window.peersService,
    mapService: window.mapService
  });

  window.realtimeDashboardService = realtimeService;
  realtimeService.init();
  
  console.log('realtimeDashboardService inicializado');
}
```

### 4. Manejo Defensivo de bodegasData

**Archivo**: `src/services/dashboardService.js` (línea 400)

```javascript
updateMetrics(bodegasData = null, blockchainData = null) {
  if (bodegasData) {
    const bodegasArray = Array.isArray(bodegasData.bodegas) 
      ? bodegasData.bodegas 
      : Array.isArray(bodegasData) ? bodegasData : [];
    
    this.metrics.totalBodegas = bodegasArray.length || bodegasData.total || 0;
    this.metrics.activeBodegas = bodegasArray.filter(
      (b) => b.blockchain?.status === "active"
    ).length || bodegasData.active || 0;
  }
}
```

## Cambio de Modos: Mock → GeoIP

### Modo Mock (Coordenadas Simuladas)

**Archivo**: `src/services/coordinateService.js` (línea 8)

```javascript
this.useMockCoordinates = true; // Modo mock activo
```

**Comportamiento**:
- Distribuye peers en 10 ciudades españolas predefinidas
- Añade offset aleatorio para dispersión
- No requiere conexión a internet
- Ideal para desarrollo y testing

**Resultado**: Peers distribuidos por toda España.

### Modo GeoIP (Geolocalización Real)

```javascript
this.useMockCoordinates = false; // Modo GeoIP activo
```

**Comportamiento**:
- Consulta API: `http://ip-api.com/json/{IP}`
- Límite: 45 requests/minuto
- Cache automático por IP
- Fallback a Madrid para IPs locales

**IPs Locales** (no geolocalizables):
```
192.168.x.x  → Madrid
10.x.x.x     → Madrid
127.0.0.1    → Madrid
localhost    → Madrid
```

**IMPORTANTE**: Reiniciar servidor después del cambio:
```bash
Ctrl+C
npm start
```

Luego **Ctrl+Shift+R** en el navegador.

## Comandos de Debug

### 1. Verificar Estado de Servicios

```javascript
console.log('socket:', !!window.socket);
console.log('mapService:', !!window.mapService);
console.log('dashboardService:', !!window.dashboardService);
console.log('peersService:', !!window.peersService);
console.log('realtimeDashboardService:', !!window.realtimeDashboardService);
```

### 2. Verificar Peers en el Mapa

```javascript
// Estadísticas
window.mapService.getPeerStats();

// Ver marcadores
window.mapService.peerManager.getAllMarkers();

// Número total
window.mapService.peerManager.getAllMarkers().length;
```

### 3. Verificar API de Peers

```javascript
fetch('/api/peers')
  .then(r => r.json())
  .then(data => {
    console.log('Peers:', data.peers.length);
    console.table(data.peers.map(p => ({
      nodeId: p.nodeId.substring(0, 12),
      city: p.city,
      lat: p.lat?.toFixed(4),
      lng: p.lng?.toFixed(4)
    })));
  });
```

### 4. Verificar Modo de Coordenadas

```javascript
fetch('/api/peers')
  .then(r => r.json())
  .then(data => {
    const cities = data.peers.map(p => p.city);
    console.log('Ciudades:', cities);
    // Mock: ['Sevilla', 'Barcelona', 'Valencia', ...]
    // GeoIP (local): ['Madrid', 'Madrid', 'Madrid', ...]
  });
```

### 5. Forzar Carga Manual de Peers

```javascript
fetch('/api/peers')
  .then(r => r.json())
  .then(data => {
    console.log('Peers desde API:', data.peers.length);
    window.mapService.loadPeersOnMap(data.peers);
    console.log('Peers cargados en mapa');
  });
```

### 6. Verificar Scripts en el DOM

```javascript
const scripts = Array.from(document.querySelectorAll('script'));
const realtimeScript = scripts.find(s => s.src.includes('realtimeDashboard'));
console.log('Script:', realtimeScript ? realtimeScript.src : 'NO ENCONTRADO');
```

### 7. Limpiar Caché y Recargar

```javascript
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}
location.reload(true);
```

### 8. Forzar Recarga de Script

```javascript
const oldScript = document.querySelector('script[src*="realtimeDashboard"]');
if (oldScript) oldScript.remove();

const newScript = document.createElement('script');
newScript.src = '../src/services/realtimeDashboardService.js?t=' + Date.now();
newScript.onload = () => {
  console.log('Script cargado');
  console.log('RealtimeDashboardService:', typeof window.RealtimeDashboardService);
};
document.body.appendChild(newScript);
```

### 9. Verificar Eventos WebSocket

```javascript
// Última métrica recibida
window.realtimeDashboardService.lastMetrics;

// Estado de conexión
window.socket.connected;

// ID del socket
window.socket.id;
```

### 10. Debug Completo

```javascript
console.log('1. Servicios:', {
  socket: !!window.socket,
  mapService: !!window.mapService,
  realtimeDashboardService: !!window.realtimeDashboardService
});
console.log('2. Peers en mapa:', window.mapService?.peerManager?.getAllMarkers().length);
fetch('/api/peers').then(r => r.json()).then(d => console.log('3. API peers:', d.peers.length));
console.log('4. WebSocket:', window.socket?.connected);
```

## Verificación del Sistema

### Checklist Post-Implementación

**Resultado Esperado**:
```javascript
1. Servicios: {socket: true, mapService: true, realtimeDashboardService: true}
2. Peers en mapa: 4
3. API peers: 4
4. WebSocket: true
```

### Logs Esperados en la Consola

```
Iniciando CartoLMM v1.0.0
Todos los servicios disponibles
Inicializando CartoLMM Dashboard...
PeerLayerManager inicializado
Mapa CartoLMM inicializado
Inicializando realtimeDashboardService...
realtimeDashboardService inicializado
WebSocket conectado
CartoLMM conectado a blockchain
Peers cargados: 4/4 online
Cargando 4 peers en el mapa...
4 peers cargados en el mapa
CartoLMM inicializado en 131ms
```

## Problemas Comunes

### Problema: "RealtimeDashboardService: undefined"

**Solución**:
1. Verificar script en HTML
2. Limpiar caché: `Ctrl+Shift+R`
3. Forzar recarga con timestamp

### Problema: "Peers en mapa: 0"

**Solución**:
```javascript
fetch('/api/peers')
  .then(r => r.json())
  .then(data => window.mapService.loadPeersOnMap(data.peers));
```

### Problema: Error "bodegasData.bodegas?.filter"

**Solución**:
1. Verificar código defensivo en dashboardService.js
2. Limpiar caché
3. Reiniciar servidor

### Problema: Coordenadas no cambian

**Solución**:
1. Reiniciar servidor después de cambiar modo
2. Limpiar caché: `Ctrl+Shift+R`
3. Verificar ciudades en API

## Archivos Modificados

### Creados
- `src/services/coordinateService.js`
- `src/leaflet/PeerMarker.js`
- `src/leaflet/PeerLayerManager.js`
- `public/peer-markers.css`
- `public/debug-leaflet.js`

### Modificados
- `src/services/blockchainService.js`
- `src/services/mapService.js`
- `src/services/dashboardService.js`
- `src/services/realtimeDashboardService.js`
- `src/main.js`
- `src/api/routes.js`
- `public/index.html`

## Conclusión

Sistema operativo con:

- Carga automática de 4 peers
- Actualizaciones en tiempo real vía WebSocket
- Coordenadas geográficas (GeoIP o Mock)
- Iconos diferenciados por estado
- Sincronización eficiente

**Total**: 1500 líneas de código nuevo + 7 archivos modificados.

## Referencias

- [Documentación completa](./LEAFLET-MAP-INTEGRATION.md)
- [Servicio de coordenadas](./COORDINATE-SERVICE.md)
- [API ip-api.com](http://ip-api.com/docs/)
- [Leaflet.js](https://leafletjs.com/reference.html)

Los tres iconos corresponden a:

🏠 Casa verde (36x36px) - NODO LOCAL

Tu servidor principal magnumsmaster
Estado: isLocal: true
Ícono más grande con color verde
Representa el nodo desde donde corres el sistema
🌐 Globo azul con pulso (32x32px) - PEER REMOTO ONLINE

Nodos conectados a la red blockchain
Estado: status: 'online'
Con animación de pulso (.peer-pulse)
Representa peers activos en la red
⚫ Círculo negro (28x28px) - PEER OFFLINE

Nodos desconectados
Estado: status: 'offline'
Sin animación, ícono más pequeño
Representa peers que perdieron conexión
Hay un 4to icono (que no ves ahora pero está implementado):

⚠️ Triángulo amarillo - PEER CON ERROR
Estado: status: 'error'
Para peers con problemas de conexión/sincronización