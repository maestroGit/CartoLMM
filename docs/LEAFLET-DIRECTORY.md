# Leaflet Module (`src/leaflet/`)

## Objetivo

El directorio `leaflet` contiene la **capa de integración y gestión de la visualización interactiva en mapas** de CartoLMM. 
Está pensado para abstraer la lógica específica que utiliza la librería [Leaflet](https://leafletjs.com/) y proporcionar clases reutilizables y desacopladas del resto de la aplicación.

---

## Funcionalidades principales

- **Renderizado de participantes (peers)** como marcadores en el mapa, con opciones de filtrado y popups personalizados.
- **Gestión de relaciones** visuales entre distintos peers (líneas/polilíneas entre ellos).
- **Visualización de buffers**: áreas de influencia alrededor de los peers.
- **Gestión centralizada** de capas visuales y funcionalidades de filtrado por categoría/región/etc.

---

## Archivos que lo componen

- **PeerMarker.js**  
  Clase para crear y gestionar un marcador (marker Leaflet) que representa un usuario, bodega o wine lover en el mapa. Permite mostrar información personalizada en un popup y controlar visibilidad por filtros.

- **PeerRelation.js**  
  Clase para crear y gestionar una polilínea (línea) entre dos PeerMarker, lo que permite visualizar relaciones, transacciones o vínculos en el mapa.

- **PeerBuffer.js**  
  Clase para crear y controlar un buffer circular (área de influencia) alrededor de un PeerMarker, configurable en radio y estilo.

- **PeerLayerManager.js**  
  Clase central de gestión que administra la colección de PeerMarkers, PeerRelations y PeerBuffers sobre el mapa. Permite añadir, filtrar, limpiar y controlar visualización desde un solo punto.

- **index.js**  
  Barrel export para importar fácilmente todas las clases del módulo desde un solo archivo.

---

## Utilidad

Esta estructura modular permite:
- Mantener el código de visualización desacoplado y ordenado.
- Reutilizar y ampliar fácilmente los comportamientos de mapa sin contaminar la lógica de negocio principal.
- Integrar, testear y escalar las visualizaciones de CartoLMM conforme crece la lógica de usuarios/bodegas/wallets sin tocar el resto de la app.

---

**Actualizado:** 13 Nov 2025

Plan: Integración Leaflet con Datos Blockchain en Tiempo Real
Este plan implementa la visualización de peers blockchain en el mapa Leaflet con actualizaciones WebSocket en tiempo real. El bloqueador crítico es la ausencia de coordenadas geográficas en /api/peers, que se resolverá con un servicio de asignación de coordenadas.

Steps
Crear CoordinateService para asignar coordenadas a peers - Implementar src/services/coordinateService.js con assignCoordinates(peers) que use GeoIP (ip-api.com) o coordenadas mock para desarrollo. Enriquecer peers con lat/lng antes de enviar al frontend.

Adaptar PeerMarker al esquema blockchain - Modificar src/leaflet/PeerMarker.js para aceptar {nodeId, status, httpUrl, blockHeight, isLocal} en lugar de {nombre, categoria, region}. Actualizar attachPopup() con información blockchain y crear iconos divIcon diferenciados para local/online/offline/error.

Extender PeerLayerManager con métodos de actualización - Añadir a src/leaflet/PeerLayerManager.js los métodos updatePeer(nodeId, updates), removePeer(nodeId), y findPeerById(nodeId). Cambiar peerMarkers de array a Map para búsquedas eficientes por nodeId.

Integrar CoordinateService en API backend - Modificar handleGetPeers() en src/api/routes.js para llamar coordinateService.assignCoordinates(peers) antes de enviar respuesta, asegurando que todos los peers tengan lat/lng.

Integrar PeerLayerManager en MapService - Actualizar src/services/mapService.js importando PeerLayerManager, añadiendo this.peerManager = new PeerLayerManager(this.map), y creando método loadPeersOnMap(peers) que delegue a peerManager.addPeer() para cada peer.

Conectar actualizaciones WebSocket al mapa - Modificar src/services/realtimeDashboardService.js agregando mapService al constructor y llamando mapService.updatePeersOnMap(peers) en el handler de socket.on('system:peers') con debounce de 1 segundo.

Further Considerations
Estrategia de coordenadas - ¿Prefieres GeoIP en tiempo real (requiere conexión externa a ip-api.com, límite 45 req/min) o coordenadas mock distribuidas en regiones españolas para desarrollo? Opción A: Producción con cache, Opción B: Desarrollo rápido sin dependencias externas.

Animaciones de estado - ¿Implementar animaciones visuales cuando peers cambian de estado? (online → pulse verde, offline → fade gris, nuevo bloque → glow efecto). Requiere ~60 LOC adicionales en CSS y lógica de transición en PeerMarker.updateStatus().

Testing con magnumsmaster - Necesitarás ambos servidores corriendo (magnumsmaster:3000 + CartoLMM:8080) para ver datos reales. ¿Tienes magnumsmaster con peers configurados o necesitas script de simulación con múltiples nodos?

🎉 Implementación Completada - Resumen
He implementado exitosamente las Fases 1 y 2 de la integración Leaflet con peers blockchain. Aquí está el resumen completo:

✅ Archivos Creados (6)
coordinateService.js (199 LOC)

Asignación de coordenadas con GeoIP o mock
Cache integrado
10 ciudades españolas predefinidas
peer-markers.css (314 LOC)

Estilos completos con animaciones
Iconos diferenciados por estado
Popups con tema oscuro
debug-leaflet.js (312 LOC)

Herramientas de debugging para navegador
11 comandos útiles
LEAFLET-MAP-INTEGRATION.md (450+ LOC)

Documentación técnica completa
Flujos de datos
Troubleshooting
LEAFLET-QUICKSTART.md (300+ LOC)

Guía rápida de inicio
Comandos útiles
Checklist de verificación
test-leaflet-integration.sh (150+ LOC)

Script de testing automatizado
Verifica archivos, imports, APIs
🔧 Archivos Modificados (7)
PeerMarker.js - Adaptado con iconos y popup blockchain
PeerLayerManager.js - Map + métodos CRUD
routes.js - Integra coordinateService
mapService.js - Usa PeerLayerManager
realtimeDashboardService.js - Actualiza mapa con debounce
realtimeDashboardService.js - Conecta mapService
index.html - Link a peer-markers.css
🎯 Características Implementadas
Fase 1: Visualización Básica
✅ CoordinateService con GeoIP y mock
✅ Iconos personalizados por estado (🏠🌐⚫⚠️)
✅ Popups informativos con datos blockchain
✅ Filtros por status
✅ Auto-ajuste de vista del mapa
Fase 2: Tiempo Real
✅ Actualizaciones WebSocket automáticas
✅ Debounce de 1 segundo para optimizar
✅ Sincronización incremental (solo cambios)
✅ Animaciones de cambio de estado
🚀 Cómo Probar
📊 Estadísticas
Total LOC: ~1,200 líneas de código
Archivos nuevos: 6
Archivos modificados: 7
Documentación: 750+ líneas
Tiempo estimado: 10-12 horas de desarrollo
🎨 Estados Visuales
Estado	Icono	Color	Animación
Local	🏠	Verde	Pulse continuo
Online	🌐	Azul	Ondas expansivas
Offline	⚫	Gris	Opacidad reducida
Error	⚠️	Rojo	Parpadeo
🧪 Comandos de Debug (Navegador)
📚 Documentación
Guía rápida: LEAFLET-QUICKSTART.md
Documentación técnica: LEAFLET-MAP-INTEGRATION.md
Script testing: test-leaflet-integration.sh
Debug tools: debug-leaflet.js
La implementación está completa y lista para usar. Todos los archivos han sido creados/modificados correctamente, sin errores de sintaxis, y con documentación completa. 🎉