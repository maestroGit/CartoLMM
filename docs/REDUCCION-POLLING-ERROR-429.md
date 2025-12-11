# Reducción de Polling y Manejo de Error 429 (Too Many Requests)

## Contexto
En entornos de hosting compartido o servidores con límites de peticiones (como seenode), se presentaron errores HTTP 429 (Too Many Requests) debido a la alta frecuencia de polling desde el backend WebSocket y el cliente API.

## Acciones Realizadas

### 1. Reducción de la Frecuencia de Polling
- Se modificó el archivo `src/websocket/events.js` para aumentar los intervalos de consulta:
  - **Bloques:** de cada 5 segundos a cada 15 segundos.
  - **Transacciones:** de cada 3 segundos a cada 15 segundos.
  - **Métricas del sistema:** de cada 10 segundos a cada 30 segundos.
- Esto reduce significativamente la cantidad de peticiones concurrentes al backend y ayuda a evitar el límite impuesto por el servidor.

### 2. Recomendaciones Adicionales
- Si el problema persiste, se recomienda aumentar el tiempo de espera entre reintentos en el cliente API (`retryDelay` en `magnusmasterAPI.js`).
- Evitar polling innecesario en el frontend y revisar que no existan otros intervalos automáticos muy frecuentes.

## Resultado Esperado
- Menor probabilidad de recibir errores 429.
- Mejor estabilidad y compatibilidad con servidores que aplican rate limiting.

## Implementaciones concretas en el código

### 1. Reducción de la frecuencia de polling en WebSocket
Archivo: `src/websocket/events.js`

```js
// Antes:
const blockMonitor = setInterval(async () => { /* ... */ }, 5000); // cada 5s
const txMonitor = setInterval(async () => { /* ... */ }, 3000); // cada 3s
const systemMonitor = setInterval(async () => { /* ... */ }, 10000); // cada 10s

// Después:
const blockMonitor = setInterval(async () => { /* ... */ }, 15000); // cada 15s
const txMonitor = setInterval(async () => { /* ... */ }, 15000); // cada 15s
const systemMonitor = setInterval(async () => { /* ... */ }, 30000); // cada 30s
```

### 2. Manejo específico del error 429 en el frontend
Archivo: `public/js/core/api.js`

```js
export async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${apiBaseUrl}${endpoint}`, options);
    if (!response.ok) {
      if (response.status === 429) {
        if (window.showModal) window.showModal('Has realizado demasiadas peticiones en poco tiempo. Por favor, espera unos segundos e inténtalo de nuevo.', 'Límite de Peticiones');
        if (window.showToast) window.showToast('Demasiadas peticiones. Espera e inténtalo de nuevo.', 'warning');
        throw new Error('Error 429: Too Many Requests');
      }
      const errorMessage = await response.text();
      throw new Error(`Error fetching ${endpoint}: ${errorMessage}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return { error: error.message };
  }
}
```

### 3. Aumento del tiempo de espera entre reintentos en el cliente API
Archivo: `src/api/magnusmasterAPI.js`

```js
class MagnusmasterAPI {
  constructor(baseURL = config.blockchainApiUrl) {
    this.baseURL = baseURL;
    this.isConnected = false;
    this.lastError = null;
    this.retryAttempts = 3;
    this.retryDelay = 4000; // 4 segundos entre reintentos para mayor estabilidad
  }
  // ...
}
```

---

**Fecha de cambios:** 11 de diciembre de 2025
**Responsable:** GitHub Copilot
