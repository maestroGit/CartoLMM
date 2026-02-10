# 📋 Plan Detallado: Actualización de CartoLMM post-Refactorización

**Fecha:** 2026-02-10  
**Versión:** 1.0  
**Estado:** En Planificación

---

## 🎯 Objetivo

Después de la refactorización modular en **magnumsmaster** y **magnumslocal** (separación de `routes/` y `controllers/`), adecuar los métodos GET de **CartoLMM** para que apunten correctamente a los nuevos endpoints.

---

## 📊 Situación Actual

CartoLMM utiliza la clase `MagnusmasterAPI` (cliente HTTP) que hace llamadas a endpoints de magnumsmaster/magnumslocal. Con la refactorización modular, algunos endpoints podrían haber:

- **Cambios de ubicación** (ruta)
- **Cambios de método HTTP** (GET ↔ POST)
- **Cambios de estructura de respuesta** (data format)
- **Cambios de parámetros** (body JSON vs query params)

---

## 📍 FASE 1: Endpoints Disponibles (POST-REFACTORIZACIÓN)

### Módulos de Rutas en magnumsmaster/magnumslocal

```
app/routes/
├── blockchainRoutes.js      → GET /blocks
├── systemRoutes.js          → GET /system-info, GET /directory-contents
├── transactionRoutes.js     → GET /transactionsPool, POST /transaction
├── walletRoutes.js          → GET/POST métodos de wallet
├── utxoRoutes.js            → GET /utxo-balance/*, GET /utxo-balance/:address
├── adminRoutes.js           → GET /admin/system-info
├── logRoutes.js             → GET /logs
├── loteRoutes.js            → GET/POST operaciones con lotes
├── miningRoutes.js          → POST /mine
├── authRoutes.js            → POST /auth/*
├── tokenRoutes.js           → GET/POST operaciones token
└── addressHistoryRoutes.js  → GET /address-history/*
```

### Tabla de Endpoints por Ruta

| Route Module | Endpoint | Método | Descripción | Status |
|---|---|---|---|---|
| **blockchainRoutes.js** | `/blocks` | GET | Obtener bloques | ✅ |
| **systemRoutes.js** | `/system-info` | GET | Info sistema + blockchain | ✅ |
| **systemRoutes.js** | `/directory-contents` | GET | Contenido directorios | ⚠️ |
| **transactionRoutes.js** | `/transactionsPool` | GET | Pool transacciones (mempool) | ✅ |
| **transactionRoutes.js** | `/transaction` | POST | Crear transacción | ✅ |
| **walletRoutes.js** | `/wallet/global` | GET | Obtener wallet global | ✅ |
| **walletRoutes.js** | `/wallet/load-global` | POST | Cargar wallet global | ✅ |
| **walletRoutes.js** | `/wallet/generate` | POST | Generar wallet | ✅ |
| **walletRoutes.js** | `/public-key` | GET | Clave pública | ⚠️ |
| **walletRoutes.js** | `/hardware-address` | POST | Dirección hardware | ✅ |
| **walletRoutes.js** | `/address-balance` | POST | Balance por dirección | ⚠️ |
| **walletRoutes.js** | `/balance` | GET | Balance wallet global | ⚠️ |
| **utxoRoutes.js** | `/utxo-balance/global` | GET | UTXOs globales | ✅ |
| **utxoRoutes.js** | `/utxo-balance/:address` | GET | UTXOs por dirección | ✅ |
| **adminRoutes.js** | `/admin/system-info` | GET | Info sistema (admin) | ✅ |
| **logRoutes.js** | `/logs` | GET | Logs del sistema | ✅ |
| **loteRoutes.js** | `/lote/*` | GET/POST | Operaciones con lotes | ✅ |
| **miningRoutes.js** | `/mine` | POST | Ejecutar minería | ✅ |

**Legend:**
- ✅ Sin cambios esperados
- ⚠️ Requiere verificación
- ❓ No disponible o no verificado

---

## 🔗 FASE 2: Mapeo de Dependencias

### MagnusmasterAPI.js → Endpoints

```
Método en MagnusmasterAPI       Endpoint Actual        Estado         Notas
─────────────────────────────────────────────────────────────────────────────
getBlocks()                    → GET /blocks          ✅ OK          Sin cambios
getTransactionsPool()          → GET /transactionsPool ✅ OK         Sin cambios
getAddressBalance(address)     → POST /address-balance ⚠️ VERIFICAR   Endpoint existe
getUTXOBalance(address)        → GET /utxo-balance/:  ✅ OK          Sin cambios
getWalletBalance()             → GET /balance         ❓ REVISAR     No ubicado
getPublicKey()                 → GET /public-key      ⚠️ VERIFICAR   Ubicación: /wallet/public-key
getSystemInfo()                → GET /system-info     ✅ OK          Sin cambios
verifyQRProof(qrData)          → POST /verify-qr-proof ❓ REVISAR    Endpoint personalizado
getDashboardMetrics()          → Composite (múltiples) ✅ OK         Combinación de endpoints
getGeographicData()            → SIMULATED            ✅ OK          No es endpoint real
getPeers()                     → GET /system-info     ✅ OK          Parsea respuesta
getPeerInfo(peerUrl)           → GET /system-info     ✅ OK          A otros nodos
pingPeer(peerUrl)              → HEAD /system-info    ✅ OK          Verificar disponibilidad
```

### CartoLMM Handlers → MagnusmasterAPI

```
Endpoint CartoLMM              Handler Function           Método Usado                Status
─────────────────────────────────────────────────────────────────────────────────────────────
/api/blocks                   handleGetBlocks()          getBlocks()                ✅
/api/peers                    handleGetPeers()           getSystemInfo()            ✅
/api/transactions             handleGetTransactions()    HARDCODED MOCK ⚠️           DEBERÍA: getTransactionsPool()
/api/balance                  handleGetBalance()         getAddressBalance()        ⚠️
/api/utxo-balance             handleGetUTXOBalance()     getUTXOBalance()           ✅
/api/verify-qr-proof          handleVerifyQR()           verifyQRProof()            ❓
/api/status                   handleGetStatus()          LOCAL MOCK                 ✅
/api/dashboard-metrics        handleGetDashboardMetrics() getDashboardMetrics()    ✅
/api/geographic-data          handleGetGeographicData()  getGeographicData()        ✅
/api/magnumsmaster-status     handleGetMagnusmasterStatus() checkHealth()          ✅
/api/system-info              handleGetSystemInfo()      getSystemInfo()            ✅
```

---

## 🔍 FASE 3: Verificaciones Críticas

### ⚠️ Endpoints que Requieren Verificación

#### 1. POST /address-balance
**Ubicación esperada:** `app/controllers/walletController.js`

```javascript
// ❓ VERIFICAR: ¿Existe endpoint POST /address-balance?
// ✅ Ubicación actual en walletRoutes.js:
//    router.post('/address-balance', addressBalance);

// En MagnusmasterAPI.js (línea 203):
async getAddressBalance(address) {
  return await this.makeRequest('/address-balance', {
    method: 'POST',
    body: JSON.stringify({ address }),
    cacheTtlMs: 60000,
    cacheKey
  });
}
```

**Acciones:**
- [ ] Confirmar que endpoint existe en magnumsmaster/magnumslocal
- [ ] Verificar estructura de request/response
- [ ] Probar desde Postman o curl

#### 2. GET /balance
**Ubicación esperada:** `app/controllers/walletController.js`

```javascript
// ❓ VERIFICAR: ¿Existe endpoint GET /balance?
// Métodos en walletController:
//   - getBalance() ← Probablemente aquí
//   - getWalletBalance() ← También existe

// En MagnusmasterAPI.js (línea 214):
async getWalletBalance() {
  return await this.makeRequest('/balance', { cacheTtlMs: 30000 });
}
```

**Acciones:**
- [ ] Buscar `/balance` en walletRoutes.js
- [ ] Confirmar que NO es `/:address/balance` sino `/balance` global
- [ ] Probar endpoint

#### 3. GET /public-key
**Ubicación esperada:** `app/routes/walletRoutes.js`

```javascript
// En walletRoutes.js (línea 30):
// router.get('/public-key', getPublicKey);

// Pero en MagnusmasterAPI.js (línea 219):
async getPublicKey() {
  return await this.makeRequest('/public-key');
}

// ✅ Debería funcionar, pero VERIFICAR separación de rutas
// ¿Está bajo /wallet/public-key o /public-key?
```

**Acciones:**
- [ ] Verificar en server.js línea 424-430 cómo se registran las rutas
- [ ] Confirmar si es `/public-key` o `/wallet/public-key`
- [ ] Actualizar MagnusmasterAPI.js si es necesario

#### 4. POST /verify-qr-proof
**Ubicación esperada:** PERSONALIZADO (podría estar en loteRoutes.js)

```javascript
// En MagnusmasterAPI.js (línea 224):
async verifyQRProof(qrData) {
  return await this.makeRequest('/verify-qr-proof', {
    method: 'POST',
    body: JSON.stringify({ qrData })
  });
}

// ❓ VERIFICAR: ¿Dónde está este endpoint?
// Ubicaciones posibles:
// - loteRoutes.js → /lote/verify-qr
// - blockchainRoutes.js → /verify-qr-proof
// - miningRoutes.js → ?
```

**Acciones:**
- [ ] Buscar "verify" en todos los routes
- [ ] Ubicar endpoint exacto
- [ ] Actualizar URL en MagnusmasterAPI.js

---

## 🛠️ FASE 4: Tareas de Actualización

### 4.1 Auditoría Rápida (15 min)

```bash
# Paso 1: Verificar endpoints existentes
cd magnumsmaster
grep -r "router.get\|router.post" app/routes/ | grep -E "balance|public-key|verify"

# Paso 2: Ver cómo se registran las rutas en server.js
grep -A2 -B2 "use('/'," app/routes server.js | head -50

# Paso 3: Listar todos los endpoints disponibles
grep -h "router\.\(get\|post\)" app/routes/*.js | sort | uniq

# Resultado esperado:
# router.get('/blocks', getBlocks);
# router.get('/system-info', getSystemInfo);
# router.get('/transactionsPool', getTransactionsPool);
# router.post('/transaction', createTransaction);
# router.get('/public-key', getPublicKey);
# router.post('/address-balance', addressBalance);
# router.get('/balance', getBalance);
# etc.
```

### 4.2 Crear Matriz de Compatibilidad

**Archivo:** `CartoLMM/docs/MATRIZ-ENDPOINTS.md`

```markdown
# Matriz de Compatibilidad - Endpoints

| Método MagnusmasterAPI | Endpoint Anterior | Endpoint Actual | Status | Acción Requerida |
|---|---|---|---|---|
| getBlocks() | `/blocks` | `/blocks` | ✅ | Ninguna |
| getTransactionsPool() | `/transactionsPool` | `/transactionsPool` | ✅ | Ninguna |
| getAddressBalance() | `/address-balance` | `/address-balance` | ⚠️ | Verificar |
| getWalletBalance() | `/balance` | ??? | ❌ | ENCONTRAR |
| getPublicKey() | `/public-key` | `/public-key` | ⚠️ | Verificar ruta |
| getUTXOBalance() | `/utxo-balance/:addr` | `/utxo-balance/:addr` | ✅ | Ninguna |
```

### 4.3 Archivos a Revisar en magnumsmaster/magnumslocal

**Revisar en este orden:**

1. **magnumsmaster/app/routes/walletRoutes.js** (líneas 1-40)
   - ¿Qué endpoints expone?
   - ¿Rutas para `/balance`, `/address-balance`, `/public-key`?

2. **magnumsmaster/app/controllers/walletController.js** (líneas 1-50)
   - ¿Qué métodos están exportados?
   - ¿Estructura de respuestas?

3. **magnumsmaster/server.js** (líneas 424-450)
   - ¿Cómo se registran las rutas?
   - ¿Hay prefijos? Ej: `/wallet/*` o directamente bajo `/`?

4. **magnumsmaster/app/routes/loteRoutes.js**
   - ¿Dónde está `/verify-qr-proof`?

### 4.4 Actualizar MagnusmasterAPI.js

**Cambios esperados:**

```javascript
// SI /public-key está bajo /wallet:
async getPublicKey() {
  return await this.makeRequest('/wallet/public-key');  // ← CAMBIO
}

// SI /balance está bajo /wallet:
async getWalletBalance() {
  return await this.makeRequest('/wallet/balance');  // ← CAMBIO
}

// SI /address-balance está bajo /wallet:
async getAddressBalance(address) {
  return await this.makeRequest('/wallet/address-balance', {  // ← CAMBIO
    method: 'POST',
    body: JSON.stringify({ address }),
    cacheTtlMs: 60000,
    cacheKey
  });
}
```

### 4.5 Actualizar Handlers en CartoLMM/routes.js

**handleGetTransactions()** - Actualmente devuelve MOCK

```javascript
// ANTES (línea ~420 en CartoLMM/routes.js):
async function handleGetTransactions(req, res) {
  try {
    // Aquí devuelve transacciones mockeadas
    const mockTransactions = [ ... ];
    res.json({ success: true, data: mockTransactions, ... });
  }
}

// DESPUÉS:
async function handleGetTransactions(req, res) {
  try {
    // Usar endpoint real de magnumsmaster
    const response = await magnusmasterClient.getTransactionsPool();
    
    if (response.success) {
      res.json({
        success: true,
        data: response.data,
        source: 'magnumsmaster',
        timestamp: response.timestamp
      });
    } else {
      // Fallback a mock si no disponible
      // ...
    }
  }
}
```

---

## ✅ FASE 5: Checklist de Implementación

### Pre-Implementación
- [ ] **Revisar todos los archivos de rutas** en magnumsmaster/magnumslocal
- [ ] **Documentar endpoints exactos** en matriz de compatibilidad
- [ ] **Identificar cambios necesarios** en MagnusmasterAPI.js
- [ ] **Preparar plan de rollback** (seguir usando mock si falla)

### Implementación
- [ ] **Actualizar MagnusmasterAPI.js** con nuevas rutas (si es necesario)
- [ ] **Actualizar handlers en CartoLMM/routes.js**
- [ ] **Mejorar fallbacks a mock** con logs informativos
- [ ] **Agregar manejo de errores** detallado
- [ ] **Validar estructura de respuestas** esperadas

### Testing
- [ ] **Probar /api/blocks** desde CartoLMM
- [ ] **Probar /api/transactions** (cambio de mock a real)
- [ ] **Probar /api/balance** con dirección
- [ ] **Probar /api/peers** (enriquecimiento con system-info)
- [ ] **Probar /api/system-info** (proxy directo)
- [ ] **Probar fallbacks cuando backend está down**
- [ ] **Validar logs** y estructura de errores
- [ ] **Medir tiempos de respuesta** y cache hits

### Post-Implementación
- [ ] **Commit a rama feature**
- [ ] **PR review con cambios documentados**
- [ ] **Merge a main** 
- [ ] **Deploy a staging**
- [ ] **Testing en staging**
- [ ] **Deploy a producción**

---

## 📋 Comandos Útiles

### Buscar endpoints en magnumsmaster

```bash
# Todos los GET
grep -rn "router.get" magnumsmaster/app/routes/

# Todos los POST
grep -rn "router.post" magnumsmaster/app/routes/

# Buscar endpoint específico
grep -rn "public-key\|balance\|address-balance" magnumsmaster/app/routes/

# Ver cómo se registran en server.js
grep "app.use.*Routes\|createLogRouter" magnumsmaster/server.js
```

### Testing con curl

```bash
# Test desde terminal a magnumsmaster (http://localhost:3001)
curl -X GET http://localhost:3001/blocks
curl -X GET http://localhost:3001/system-info
curl -X GET http://localhost:3001/transactionsPool
curl -X GET http://localhost:3001/utxo-balance/global
curl -X POST http://localhost:3001/address-balance -H "Content-Type: application/json" -d '{"address":"test"}'

# Test desde CartoLMM (http://localhost:8080)
curl -X GET http://localhost:8080/api/blocks
curl -X GET http://localhost:8080/api/peers
curl -X GET http://localhost:8080/api/system-info
```

### Logs y debugging

```javascript
// En MagnusmasterAPI.js - Agregar logs:
console.log(`[MagnusmasterAPI] GET ${endpoint}`, response);

// En CartoLMM handlers - Agregar logs:
console.log(`[CartoLMM] handleGetTransactions - usando endpoint real`, response);
```

---

## 📁 Archivos Clave

### A Revisar
- [magnumsmaster/app/routes/walletRoutes.js](../../../magnumsmaster/app/routes/walletRoutes.js)
- [magnumsmaster/app/routes/blockchainRoutes.js](../../../magnumsmaster/app/routes/blockchainRoutes.js)
- [magnumsmaster/app/routes/transactionRoutes.js](../../../magnumsmaster/app/routes/transactionRoutes.js)
- [magnumsmaster/app/routes/loteRoutes.js](../../../magnumsmaster/app/routes/loteRoutes.js)
- [magnumsmaster/server.js](../../../magnumsmaster/server.js) (líneas 424-450)

### A Actualizar
- [CartoLMM/src/api/magnusmasterAPI.js](../src/api/magnusmasterAPI.js)
- [CartoLMM/src/api/routes.js](../src/api/routes.js)

### Referencias
- [PLAN-ACTUALIZACION-ENDPOINTS-POSTREFACTORIZACION.md](./PLAN-ACTUALIZACION-ENDPOINTS-POSTREFACTORIZACION.md) (Este archivo)
- [MATRIZ-ENDPOINTS.md](./MATRIZ-ENDPOINTS.md) (A crear)

---

## 🎓 Notas Importantes

### Sobre la Modularización

La refactorización separó:
- **Código anterior:** Endpoints definidos directamente en `server.js`
- **Código nuevo:** Endpoints en archivos separados bajo `app/routes/` e importados en `server.js`

**Ventajas:**
- ✅ Mejor organización
- ✅ Fácil mantenimiento
- ✅ Escalabilidad

**Consideraciones para CartoLMM:**
- ⚠️ Verificar que todas las rutas se importan correctamente
- ⚠️ Algunos endpoints podrían tener prefijos (ej: `/wallet/*`)
- ⚠️ Nuevos endpoints podrían haber sido agregados

### Estrategia de Fallback

CartoLMM usa **fallback a mock data**:

```javascript
// Si magnumsmaster falla, usar datos hardcodeados
if (!response.success) {
  return mockData;
}
```

✅ **Ventajas:** La app nunca se cae  
⚠️ **Riesgo:** Datos obsoletos sin alertas claras

**Recomendación:** Agregar logs de advertencia cuando se usa mock data.

---

## 📅 Timeline Estimado

| Fase | Duración | Descripción |
|---|---|---|
| Auditoría | 30 min | Revisar endpoints, crear matriz |
| Implementación | 1-2 h | Actualizar API client y handlers |
| Testing | 1 h | Probar todos los endpoints |
| Review & Deploy | 30 min | PR, merge, deploy |
| **TOTAL** | **3-4 h** | Desde inicio a producción |

---

## 🚀 Próximos Pasos

1. **Ejecutar auditoría** siguiendo FASE 3
2. **Documentar findings** en MATRIZ-ENDPOINTS.md
3. **Crear rama feature:** `feature/cartolmm-endpoints-update`
4. **Implementar cambios** en MagnusmasterAPI.js
5. **Actualizar handlers** en CartoLMM/routes.js
6. **Hacer testing** completo
7. **Crear PR** con cambios documentados

---

**Autor:** GitHub Copilot  
**Última actualización:** 2026-02-10  
**Versión:** 1.0

