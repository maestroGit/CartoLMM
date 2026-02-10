# Skill: Leaflet Master (Mobile-First & Advanced UI)
Description: Experto en mapas interactivos ligeros, accesibles y con efectos avanzados.

## 🛠 Quick Start & Basics
- **Setup:** Usa siempre el CDN oficial (CSS y JS) para prototipos rápidos.
- **CSS Obligatorio:** El contenedor `#map` DEBE tener una altura definida (ej. `height: 400px;`), de lo contrario será invisible.
- **Tiles:** Usa `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` con su respectiva atribución.
- **DOM Ready:** Inicializa el mapa siempre dentro de `document.addEventListener('DOMContentLoaded', ...)` o al final del body.

## 🚀 Advanced UI Patterns
- **Smooth Navigation:** Prioriza `map.flyTo([lat, lng], zoom)` para transiciones elegantes entre puntos.
- **GeoJSON:** Capacidad para renderizar capas de datos desde archivos `.json` externos.
- **Tooltips vs Popups:** Usa tooltips permanentes para etiquetas rápidas y popups para información detallada al hacer clic.
- **Memory Safety:** Verifica siempre si el mapa ya existe antes de inicializarlo:
  `if (L.DomUtil.get('map')._leaflet_id) { return; }`

## 📱 Mobile & Performance
- **Touch Friendly:** Marcadores grandes y popups fáciles de cerrar en móvil.
- **Responsive Controls:** Mueve los controles de zoom si interfieren con la navegación táctil.
- **Lazy Load:** Inicializa el mapa solo cuando el usuario haga scroll hasta la sección para ahorrar recursos.

## 📋 Implementation Template
1. **Init:** `const map = L.map('map').setView([41.3851, 2.1734], 13);` (Ejemplo: Barcelona).
2. **Markers:** `L.marker([lat, lng]).addTo(map).bindPopup('Texto');`

## 🍷 blocksWine Custom Patterns (UserMarker.js)
Usa siempre la clase `UserMarker` para representar entidades en el mapa.

- **Categorías y Emojis:** - `bodega`: 🍇
  - `wine_lover`: 🍷
  - `minero`: ⛏️
  - Por defecto: 👤
- **Blockchain Badge:** Si `data.blockchainActive` es true, añade el div `.user-blockchain-active`.
- **Popup Architecture:** - Los popups tienen un ancho fijo de `370px`.
  - El contenido varía por tipo: las bodegas muestran imágenes grandes (`.bodega-img-full`), los wine_lovers muestran una tarjeta social (`.user-card`) y el botón "Move".
- **Wallet Interaction:** Implementa lógica de carga de archivos JSON y consulta de balance mediante `fetch('/api/balance?address=...')`.
- **UX Trick:** En el evento `popupopen`, el mapa debe realizar un `panBy` para centrar verticalmente la popup si esta queda cortada.