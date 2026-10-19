# Modernización y Alineación Arquitectónica de CartoLMM (Octubre 2026)

## 1. Gobernanza y Metadatos
- **Fecha:** 19 de Octubre de 2026
- **Responsable Técnico:** Equipo de Arquitectura e Integración BlocksWine / CartoLMM
- **Estado:** ✅ APROBADO Y APLICADO
- **Vinculación con Matriz ADR:**
  - **Extiende y Consolida:** Decisión de separación arquitectónica de CartoLMM como frontend independiente de visualización geoespacial (Leaflet + Express Proxy).
  - **Alinea con:** `docs/IA/standards.md` de `magnumslocal` (Secure-by-default, separación estricta por capas, eliminación de URLs estáticas y tokens de diseño BlocksWine Luxury).

---

## 2. Universo Total Analizado y Alcance

Se realizó un escaneo completo de los repositorios y de los 29 módulos que conforman CartoLMM:

| Capa / Componente | Archivos Principales | Estado Previo | Estado Modernizado |
| :--- | :--- | :--- | :--- |
| **Limpieza de Código** | `*.bak`, `*.backup`, `*.old` | 4 copias huérfanas en disco | Eliminadas. Código 100% versionado. |
| **Tokens & Estilo** | `public/base.css`, `public/styles.css` | Colores ad-hoc dispersos | Tokens de diseño BlocksWine (`#6A0D25`, `#f7931a`, etc.). |
| **Cliente Proxy Backend** | `src/api/helpers/backendClient.js` | Conexiones dispersas `localhost:3000/6001` | Cliente centralizado con caché in-memory, timeout y fallback dev/prod. |
| **Catálogos & D.O.** | `catalogController.js`, `catalogRoutes.js` | Consultas pesadas directas a Overpass / JSON estático | Endpoints `/api/denominaciones`, `/api/variedades`, `/api/tipos-vino`. |
| **Modelos de Dominio** | `src/models/*.js` | Desalineados con PostgreSQL 2026 | `Usuario`, `BotellaMagnum`, `DenominacionOrigen`, `BurnEvent`. |
| **GIS & Leaflet** | `DoTerritoryLayer.js`, `main.js`, `mapService.js` | `setTimeout(1000)` con condición de carrera; sin D.O. | Capa de D.O. determinista, badges y popups con terruño. |
| **Eventos en Tiempo Real** | `events.js`, `realtimeDashboardService.js` | Sin soporte para descorches / burn events | Eventos `wine:uncorked`, webhook `/api/notifications/webhook` y animación de pulso. |
| **Build & Empaquetado** | `vite.config.js` | Monopágina incompleta | Multi-page build (`index.html` + `list-winery.html`) validado en 1.8s. |

---

## 3. Arquitectura y Separación por Capas

En estricta conformidad con `docs/IA/standards.md`:

```mermaid
graph TD
    subgraph Frontend [Cliente Web (Leaflet / Vanilla JS)]
        UI[index.html / list-winery.html] --> LeafletMap[mapService.js]
        LeafletMap --> DOLayer[DoTerritoryLayer.js]
        LeafletMap --> UserMarkers[UserMarker.js]
        UI --> Realtime[realtimeDashboardService.js]
    end

    subgraph CartoLMM_Server [CartoLMM Proxy Server - Puerto 8080]
        Server[server.js / routes.js] --> CatCtrl[catalogController.js]
        Server --> WineCtrl[wineloverController.js]
        Server --> NotifCtrl[notificationController.js]
        Server --> LoteCtrl[loteController.js]
        Server --> WS[WebSocket events.js]
        CatCtrl & WineCtrl & NotifCtrl & LoteCtrl --> BackendClient[helpers/backendClient.js]
    end

    subgraph Backend_Ecosistema [Magnums Backend - Puertos 6001 / 3001]
        BackendClient -.-> Local[magnumslocal / magnumsmaster]
    end
```

### 3.1 Principios Implementados:
1. **Separación por capas:**
   - `src/api/routes/`: Rutas declarativas y modulares por dominio.
   - `src/api/controllers/`: Controladores desacoplados de persistencia pesada.
   - `src/api/helpers/backendClient.js`: Abstracción HTTP con timeout defensivo (`AbortSignal.timeout`), cache store (`Map`) y mitigación de errores 429.
   - `src/models/`: Clases de modelo tipadas con métodos de serialización `toJSON()` y `fromJSON()`.
2. **Cero URLs estáticas en cliente:**
   - Uso obligatorio de `window.location.origin` y `window.BLOCKCHAIN_WALLET_URL` con fallbacks seguros.
3. **Resiliencia Operativa (Standalone Mode):**
   - Si los nodos `magnumslocal` o `magnumsmaster` están temporalmente apagados, CartoLMM intercepta los fallos de red sin excepciones no capturadas y conmuta a modo local autónomo.

---

## 4. Criterios de Verificación y Auditabilidad

### 4.1 Verificación Estática y de Empaquetado:
- **Build Multi-página Vite:**
  ```bash
  npm run build
  ```
  Resultado: ✅ Éxito (transformación de 29 módulos en ~1.8s, generación limpia de `dist/index.html` y `dist/list-winery.html`).

### 4.2 Verificación en Runtime:
- **Arranque de Express + Socket.io:**
  ```bash
  node server.js
  ```
  Resultado: ✅ Servidor operativo en `http://localhost:8080/` montando endpoints:
  - `GET /api/users`
  - `GET /api/denominaciones`
  - `GET /api/variedades`
  - `GET /api/tipos-vino`
  - `GET /api/winelover/portfolio`
  - `GET /api/notifications`
  - `POST /api/notifications/webhook`
  - `GET /api/lotes/:id`
  - `GET /api/blocks`, `/api/peers`, `/api/transactions`, `/api/status`, `/api/dashboard-metrics`.

- **Suite de Pruebas de Integración:**
  ```bash
  npm test
  ```
  Resultado: ✅ Captura de conexión defensiva ante nodos caídos y ejecución sin fugas de memoria o cuelgues.

---

## 5. Próximas Fases Recomendadas
1. Despliegue en entorno de pruebas conectando simultáneamente con `magnumslocal` en puerto `6001` y base de datos PostgreSQL activa.
2. Exploración en el mapa con trazado interactivo de botellas (`drawCustodyRoute`) para el módulo de transferencias entre winelovers.
