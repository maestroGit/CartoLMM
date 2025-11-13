src/
├── models/
│   └── Usuario.js           // ✅ Modelo de datos (mantener ES6)
│                            // Representa la estructura del usuario
│
└── leaflet/
    ├── PeerMarker.js        // ✅ Ya existe - Marcadores de peers P2P
    └── UserMarker.js        // 🆕 NUEVO - Marcadores de usuarios
                             // Usa Usuario.js internamente
                             // Clase global (window.UserMarker)

UserMarker.js 
/**
 * Marcador de usuario en el mapa Leaflet
 * Usa el modelo Usuario.js para los datos
 */
class UserMarker {...}

Ventajas de Esta Arquitectura
✅ Usuario.js sigue siendo ES6 puro (modelo de datos)
✅ UserMarker.js es clase global (compatible con navegador)
✅ Separación clara:
Usuario.js = lógica de negocio
UserMarker.js = visualización en mapa
✅ Consistente con PeerMarker.js
✅ No necesitas cambiar Usuario.js

¿Quieres que implemente esto?
Si dices que sí, crearé:

src/leaflet/UserMarker.js (clase global para el navegador)
src/services/userService.js (cargar users.json y gestionar marcadores)
Integración en mapService.js (nueva capa "Usuarios")
CSS para los iconos de usuarios
Usuario.js se queda como está (ES6) porque no se carga en el navegador, solo sirve de referencia para la estructura de datos.

Implementación completa ✅

Archivos creados:

✅ src/leaflet/UserMarker.js (181 líneas) - Marcadores con iconos 🍷 🍇 ⛏️
✅ src/services/userService.js (193 líneas) - Gestión de usuarios
Archivos modificados:
3. ✅ peer-markers.css (+283 líneas CSS) - Estilos para usuarios
4. ✅ mapService.js - Capa de usuarios + método loadUsersOnMap()
5. ✅ dashboardService.js - Inicialización de userService
6. ✅ index.html - Scripts UserMarker.js y userService.js

Características implementadas:

Iconos por categoría:

🍷 Bodegas (rojo, 36px)
🍇 Wine Lovers (morado, 32px)
⛏️ Mineros (naranja, 34px)
Badge "×N" para múltiples categorías
Indicador verde de blockchain activo
Popups detallados:

Nombre, email, categorías
Wallets con estado (active/inactive)
Estado blockchain (✅/❌)
Proveedor OAuth, fecha registro
Ubicación geográfica
Control de capas:

"🌐 Peers Blockchain" (nodos P2P)
"👥 Usuarios" (bodegas, wine lovers, mineros)
Activar/desactivar independientemente
Reinicia el servidor y verás:

4 peers blockchain (🏠 🌐)
4 usuarios de users.json (🍷 🍇 ⛏️)
Control de capas en botón "Capas"