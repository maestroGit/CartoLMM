# 🗺️ Integración Leaflet con Peers Blockchain - Guía Rápida

## ✅ Implementación Completada

Las **Fases 1 y 2** han sido implementadas completamente:

- ✅ **Fase 1:** Visualización básica de peers en el mapa
- ✅ **Fase 2:** Actualizaciones en tiempo real vía WebSocket

---

## 🚀 Inicio Rápido

### 1. Iniciar los Servidores

```bash
# Terminal 1: Blockchain Backend (magnumsmaster)
cd c:/Users/maest/Documents/magnumsmaster
npm start
# Debe correr en puerto 3000

# Terminal 2: Frontend (CartoLMM)
cd c:/Users/maest/Documents/CartoLMM
npm start
# Debe correr en puerto 8080
```

### 2. Abrir en el Navegador

```
http://localhost:8080
```

### 3. Verificar Funcionamiento

En el mapa deberías ver:
- 🏠 **Nodo Local** (verde con animación de pulso)
- 🌐 **Peers Remotos** (azul con ondas, si hay conexiones)

Al hacer clic en un marcador, aparece un popup con:
- NodeID, status, URL
- Altura de bloque, dificultad
- Latencia, ubicación

---

## 🧪 Testing

### Ejecutar Script de Verificación

```bash
cd c:/Users/maest/Documents/CartoLMM
bash test-leaflet-integration.sh
```

Este script verifica:
- ✅ Archivos creados/modificados
- ✅ Imports correctos
- ✅ Servidores corriendo
- ✅ API endpoints funcionando
- ✅ Coordenadas en respuestas

### Testing en el Navegador

1. Abre http://localhost:8080
2. Abre la consola (F12 → Console)
3. Carga las herramientas de debug:

```javascript
// Opción A: Cargar script desde archivo
const script = document.createElement('script');
script.src = '/debug-leaflet.js';
document.head.appendChild(script);

// Opción B: Ver estado manualmente
window.mapService?.getPeerStats()
window.coordinateService?.getCacheStats()
window.realtimeDashboardService
```

### Comandos de Debug Disponibles

```javascript
debugLeaflet()                           // Estado general
listPeers()                              // Lista todos los peers
filterPeersByStatus('online')            // Filtra por estado
focusPeer('genesis_node')                // Centra en un peer
inspectPeer('peer-1')                    // Detalles de un peer
refreshPeers()                           // Fuerza actualización
simulatePeerStatusChange('peer-1', 'offline') // Simula cambio
testWebSocket()                          // Verifica WebSocket
debugHelp()                              // Muestra ayuda
```

---

## 📊 Verificaciones Esperadas

### ✅ Checklist Visual

- [ ] Mapa muestra al menos 1 marcador (nodo local)
- [ ] Marcador local es verde (🏠) con animación de pulso
- [ ] Popup muestra información correcta al hacer clic
- [ ] Sidebar muestra mismo número de peers que el mapa
- [ ] Sin errores en consola del navegador

### ✅ Checklist de API

```bash
# Test endpoint peers
curl http://localhost:8080/api/peers | jq

# Debe incluir:
# - success: true
# - peers: [array con nodeId, status, lat, lng, ...]
# - stats: {total, online, offline, ...}
```

### ✅ Checklist de WebSocket

En la consola del navegador:

```javascript
// Debe ser true
window.socket?.connected

// Debe mostrar eventos registrados
window.socket?.listeners('system:peers')
```

---

## ⚙️ Configuración

### Cambiar Modo de Coordenadas

**Archivo:** `src/services/coordinateService.js`

```javascript
constructor() {
  this.useMockCoordinates = true; // true = mock, false = GeoIP real
}
```

**Mock Mode (default):**
- Coordenadas distribuidas en 10 ciudades españolas
- No requiere internet
- Ideal para desarrollo

**GeoIP Mode:**
- Coordenadas reales basadas en IP
- Requiere conexión a ip-api.com
- Límite: 45 requests/minuto
- Ideal para producción

### Ajustar Debounce de Actualizaciones

**Archivo:** `src/services/realtimeDashboardService.js`

```javascript
constructor({ socket, dashboardService, peersService, mapService }) {
  this.mapUpdateDelay = 1000; // Milisegundos (1000 = 1 segundo)
}
```

---

## 🐛 Solución de Problemas

### Problema: No aparecen marcadores

**Diagnóstico:**
```javascript
// En consola del navegador
fetch('/api/peers').then(r => r.json()).then(console.log)
```

**Causas posibles:**
1. API no devuelve coordenadas → Verificar coordinateService integrado
2. MapService no inicializado → Verificar `window.mapService`
3. Peers sin coordenadas válidas → Verificar respuesta incluye lat/lng

**Solución:**
```bash
# Verificar imports en routes.js
grep "coordinateService" src/api/routes.js

# Debe mostrar:
# import coordinateService from '../services/coordinateService.js';
```

### Problema: Mapa no se actualiza en tiempo real

**Diagnóstico:**
```javascript
// Verificar WebSocket
window.socket?.connected // debe ser true

// Verificar mapService conectado
window.realtimeDashboardService.mapService // debe existir
```

**Causas posibles:**
1. WebSocket desconectado
2. mapService no pasado a RealtimeDashboardService
3. Backend no emite eventos `system:peers`

**Solución:**
```bash
# Verificar integración en public/realtimeDashboardService.js
grep "mapService" public/realtimeDashboardService.js

# Debe mostrar:
# mapService: window.mapService
```

### Problema: Iconos sin estilo

**Diagnóstico:**
```javascript
// Verificar CSS cargado
document.querySelector('link[href*="peer-markers"]')
```

**Solución:**
```bash
# Verificar link en HTML
grep "peer-markers.css" public/index.html

# Debe mostrar:
# <link rel="stylesheet" href="peer-markers.css">
```

---

## 📁 Archivos Clave

### Nuevos Archivos (3)

```
src/services/coordinateService.js    - Asignación de coordenadas
public/peer-markers.css               - Estilos de marcadores
public/debug-leaflet.js               - Herramientas de debug
```

### Archivos Modificados (7)

```
src/leaflet/PeerMarker.js                     - Adaptado a blockchain
src/leaflet/PeerLayerManager.js               - CRUD completo
src/api/routes.js                             - Integra coordinateService
src/services/mapService.js                    - Usa PeerLayerManager
src/services/realtimeDashboardService.js      - Actualiza mapa
public/realtimeDashboardService.js            - Conecta mapService
public/index.html                             - Link a CSS
```

---

## 📚 Documentación Completa

Ver `docs/LEAFLET-MAP-INTEGRATION.md` para:
- Arquitectura detallada
- Flujo de datos completo
- Guía de troubleshooting
- Roadmap de mejoras futuras

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras No Implementadas

1. **Relaciones entre peers** - Líneas conectando nodos
2. **Buffers de cobertura** - Áreas de influencia
3. **Filtros UI** - Botones para filtrar visualmente
4. **Timeline** - Historial de cambios
5. **Métricas avanzadas** - Gráficos de latencia

### Implementar Relaciones (Ejemplo)

```javascript
// En mapService.js
import { PeerRelation } from '../leaflet/PeerRelation.js';

// Conectar peers con líneas
const peer1 = this.peerManager.findPeerById('genesis_node');
const peer2 = this.peerManager.findPeerById('peer-1');
const relation = new PeerRelation(peer1, peer2, this.map);
```

---

## ✅ Confirmación de Implementación

- [x] CoordinateService creado (199 LOC)
- [x] PeerMarker adaptado (212 LOC)
- [x] PeerLayerManager extendido (140 LOC)
- [x] MapService integrado (150+ LOC agregadas)
- [x] RealtimeDashboardService conectado (40 LOC agregadas)
- [x] API routes enriquecido (2 líneas agregadas)
- [x] CSS completo (314 LOC)
- [x] Documentación completa (400+ líneas)
- [x] Scripts de testing

**Total:** ~1200 líneas de código + documentación

---

## 💡 Tips

### Desarrollo

```bash
# Ver logs en tiempo real
tail -f logs/*.log

# Reiniciar con caché limpio
npm run clean && npm start
```

### Producción

```javascript
// Cambiar a GeoIP real
// En src/services/coordinateService.js
this.useMockCoordinates = false;
```

### Performance

- El debounce de 1s evita actualizaciones excesivas
- Map usa O(1) para búsquedas por nodeId
- Cache de coordenadas evita lookups repetidos

---

## 🙋 Soporte

Si encuentras problemas:

1. Ejecuta `bash test-leaflet-integration.sh`
2. Carga `debug-leaflet.js` en el navegador
3. Ejecuta `debugLeaflet()` para diagnóstico
4. Revisa `docs/LEAFLET-MAP-INTEGRATION.md`

---

**Implementado por:** GitHub Copilot  
**Modelo:** Claude Sonnet 4.5  
**Fecha:** 13 de Noviembre 2025

🎉 **¡Disfruta visualizando tu red blockchain!**
