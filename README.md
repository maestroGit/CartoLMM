# 🍷 CartoLMM - Large Magnum Master Cartografía

**Del Terruño al Ciberespacio** - Sistema de visualización blockchain para bodegas de vino españolas.

## 🌟 Descripción

CartoLMM es un sistema de visualización geográfica que combina la tradición vitivinícola española con tecnología blockchain, permitiendo rastrear y visualizar la autenticidad y trazabilidad de vinos desde el viñedo hasta el consumidor final.

## 🎯 Características Principales

### 🗺️ **Visualización Geográfica**
- Mapa interactivo de España con bodegas y denominaciones de origen
- Visualización en tiempo real de la red blockchain
- Animaciones de transacciones entre bodegas y consumidores

### ⛓️ **Integración Blockchain**
- Conexión con la red blockchain de Magnumsmaster
- Visualización de bloques, transacciones y nodos en tiempo real
- Sistema de verificación QR para autenticidad de botellas

### 🍇 **Gestión de Bodegas**
- Información detallada de cada bodega
- Inventario y estado blockchain
- Métricas de producción y ventas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js v18.0.0 o superior
- npm v8.0.0 o superior

### Instalación

1. **Clonar o navegar al directorio:**
   ```bash
   cd magnumsmaster/cartografia
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Acceder al dashboard:**
   Abrir navegador en `http://localhost:8080`

## 🎛️ Uso del Sistema

### Navegación Básica
- **Zoom:** Rueda del ratón o controles +/-
- **Pan:** Arrastrar el mapa
- **Selección:** Click en bodega para ver detalles

### Atajos de Teclado
- `H` - Mostrar ayuda
- `Ctrl+R` - Refrescar datos
- `Ctrl+F` - Buscar
- `Esc` - Cerrar modales

### Panel de Control
- **Métricas en tiempo real** en sidebar derecho
- **Timeline de eventos** en parte inferior
- **Controles de capas** en esquina superior derecha

## 🏗️ Arquitectura del Proyecto

```
cartografia/
├── public/                 # Archivos estáticos
│   ├── index.html         # Página principal
│   ├── styles.css         # Estilos principales
│   └── components.css     # Estilos de componentes
├── src/                   # Código fuente JavaScript
│   ├── services/          # Servicios principales
│   │   ├── blockchainService.js  # API blockchain
│   │   ├── mapService.js         # Gestión mapas
│   │   └── dashboardService.js   # Coordinación UI
│   ├── data/              # Datos de ejemplo
│   │   └── bodegas.json   # Información bodegas
│   └── main.js            # Punto de entrada
├── server.js              # Servidor desarrollo
├── package.json           # Configuración npm
└── README.md              # Este archivo
```

## 🔧 APIs Disponibles

### Endpoints REST
- `GET /blocks` - Lista de bloques blockchain
- `GET /peers` - Nodos de la red
- `GET /transactionsPool` - Transacciones pendientes
- `GET /balance?address=<addr>` - Balance de dirección
- `POST /verify-qr-proof` - Verificación QR

### WebSocket Events
- `newBlock` - Nuevo bloque minado
- `newTransaction` - Nueva transacción
- `peerConnected` - Nodo conectado
- `peerDisconnected` - Nodo desconectado

## 🎨 Stack Tecnológico

### Frontend
- **Leaflet.js** - Mapas interactivos
- **D3.js** - Visualizaciones de datos
- **Socket.io** - Comunicación tiempo real
- **CSS Grid + Flexbox** - Layout responsivo
- **Vanilla JavaScript** - Lógica aplicación

### Backend (Desarrollo)
- **Express.js** - Servidor web
- **Socket.io** - WebSockets
- **Node.js** - Runtime

### Integración
- **Magnumsmaster Blockchain** - Red principal
- **OpenStreetMap** - Datos cartográficos

## 🌈 Paleta de Colores (Wine-Tech)

```css
--wine-red: #722F37      /* Rojo vino principal */
--wine-dark: #4A0E4E     /* Púrpura oscuro */
--blockchain-green: #10B981  /* Verde blockchain */
--wine-gold: #FFB800     /* Dorado premium */
```

## 📊 Estructura de Datos

### Bodega
```json
{
  "id": "bodega_001",
  "nombre": "Bodegas Ejemplo",
  "region": "Ribera del Duero",
  "ubicacion": { "lat": 41.6518, "lng": -4.7281 },
  "blockchain": {
    "status": "active",
    "address": "0x...",
    "lastBlock": 1247
  },
  "inventario": {
    "botellas": 1250,
    "variedades": 8,
    "valorTotal": 125000
  }
}
```

### Transacción
```json
{
  "id": "tx_001",
  "from": "bodega_001",
  "to": "customer_001", 
  "amount": 120,
  "type": "wine_purchase",
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {
    "wine": "Ribera del Duero Reserva 2020",
    "bottles": 6,
    "qr_verified": true
  }
}
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
PORT=8080                    # Puerto servidor
NODE_ENV=development         # Entorno
BLOCKCHAIN_API_URL=http://localhost:3001  # API blockchain real
```

### Modo Seguro
Si hay problemas de inicialización, el sistema carga automáticamente en **Modo Seguro** con funcionalidad limitada.

## 🚧 Desarrollo

### Scripts Disponibles
```bash
npm start       # Servidor producción
npm run dev     # Servidor desarrollo (nodemon)
npm test        # Ejecutar tests (pendiente)
npm run build   # Build (no necesario para archivos estáticos)
```

### Debugging
- Activar `debug: true` en `window.CartoLMM.config`
- Usar DevTools del navegador
- Logs detallados en consola

## 🔄 Roadmap

### ✅ Fase 1: MVP (Actual)
- [x] Mapa básico con bodegas
- [x] Integración blockchain simulada
- [x] Dashboard funcional
- [x] Visualización tiempo real

### 🚧 Fase 2: Integración Real
- [ ] Conexión con blockchain real de Magnumsmaster
- [ ] Sistema de autenticación
- [ ] Base de datos de bodegas real
- [ ] API REST completa

### 🔮 Fase 3: Funcionalidades Avanzadas
- [ ] Análisis predictivo con IA
- [ ] Realidad aumentada para verificación QR
- [ ] Integración con IoT de bodegas
- [ ] Marketplace integrado

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Proyecto bajo licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Denominaciones de Origen Españolas** por la rica tradición vitivinícola
- **Comunidad Blockchain** por la innovación tecnológica
- **OpenStreetMap** por los datos cartográficos
- **Leaflet.js** por la excelente librería de mapas

---

**🍷 "Del Terruño al Ciberespacio" - Donde la tradición encuentra la innovación**