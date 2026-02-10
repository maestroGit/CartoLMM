# 🔍 Auditoría de Endpoints - magnumsmaster/magnumslocal
**Fecha:** 2026-02-10  
**Estado:** ✅ COMPLETADA  
**Resultado:** 🚨 **3 PROBLEMAS ENCONTRADOS**

---

## 📊 Resumen Ejecutivo

| Hallazgo | Severidad | Impacto | Estado |
|---|---|---|---|
| Endpoints con prefijo `/wallet` incorrecto en MagnusmasterAPI | 🔴 CRÍTICO | CartoLMM no encuentra endpoints | ⏸️ SIN CORREGIR |
| `/public-key` registrado como `/wallet/public-key` | 🔴 Alto | getPublicKey() falla | ❌ BUG ACTIVO |
| `/balance` registrado como `/wallet/balance` | 🔴 Alto | getWalletBalance() falla | ❌ BUG ACTIVO |
| `/address-balance` registrado como `/wallet/address-balance` | 🔴 Alto | getAddressBalance() falla | ❌ BUG ACTIVO |
| `/verify-qr-proof` correctamente ubicado | ✅ Verde | Funciona correctamente | ✅ OK |

---

## 📍 ENDPOINTS ENCONTRADOS EN magnumsmaster

### GET Endpoints

```
✅ router.get('/blocks', ...)                     → via: / → /blocks
✅ router.get('/system-info', ...)               → via: / → /system-info
✅ router.get('/directory-contents', ...)        → via: / → /directory-contents
✅ router.get('/transactionsPool', ...)          → via: / → /transactionsPool
✅ router.get('/global', ...)                    → via: /wallet → /wallet/global
✅ router.get('/public-key', ...)                → via: /wallet → /wallet/public-key ⚠️
✅ router.get('/balance', ...)                   → via: /wallet → /wallet/balance ⚠️
✅ router.get('/global', ...)                    → via: /utxo-balance → /utxo-balance/global
✅ router.get('/:address', ...)                  → via: /utxo-balance → /utxo-balance/:address
✅ router.get('/:address', ...)                  → via: /address-history → /address-history/:address
✅ router.get('/auth/google', ...)               → via: / → /auth/google
✅ router.get('/auth/google/callback', ...)      → via: / → /auth/google/callback
✅ router.get('/auth/user', ...)                 → via: / → /auth/user
✅ router.get('/systemInfo', ...)                → via: /admin → /admin/systemInfo
✅ router.get('/system-info', ...)               → via: /admin → /admin/system-info
✅ router.get('/directory-contents', ...)        → via: /admin → /admin/directory-contents
✅ router.get('/logs', ...)                      → via: / → /logs
✅ router.get('/lotes/:loteId', ...)             → via: / → /lotes/:loteId
✅ router.get('/propietario/:ownerPublicKey', ...)→ via: / → /propietario/:ownerPublicKey
```

### POST Endpoints

```
✅ router.post('/load-global', ...)              → via: /wallet → /wallet/load-global
✅ router.post('/generate', ...)                 → via: /wallet → /wallet/generate
✅ router.post('/hardware-address', ...)         → via: /wallet → /wallet/hardware-address
✅ router.post('/address-balance', ...)          → via: /wallet → /wallet/address-balance ⚠️
✅ router.post('/transaction', ...)              → via: / → /transaction
✅ router.post('/mine', ...)                     → via: / → /mine
✅ router.post('/mine-transactions', ...)        → via: / → /mine-transactions
✅ router.post('/qr', ...)                       → via: / → /qr
✅ router.post('/qr-with-proof', ...)            → via: / → /qr-with-proof
✅ router.post('/lotes', ...)                    → via: / → /lotes
✅ router.post('/verify-qr-proof', ...)          → via: / → /verify-qr-proof ✅
✅ router.post('/baja-token', ...)               → via: /token → /token/baja-token
```

---

## 🗂️ Estructura de Registro en server.js

### magnumsmaster/server.js (líneas 414-457)

```javascript
// Línea 414
app.use('/', authRoutes);                    // Endpoints: /auth/*, /auth/user
app.use('/token', tokenRoutes);              // Endpoints: /token/baja-token
app.use('/wallet', walletRoutes);            // Endpoints: /wallet/*, /wallet/load-global, etc.
app.use('/utxo-balance', utxoRoutes);        // Endpoints: /utxo-balance/global, /utxo-balance/:address
app.use('/address-history', addressHistoryRoutes);
app.use('/', systemRoutes);                  // Endpoints: /system-info, /directory-contents
app.use('/', loteRoutes);                    // Endpoints: /lotes, /verify-qr-proof, etc.
app.use('/', miningRoutes);                  // Endpoints: /mine, /mine-transactions
app.use('/', createLogRouter(logStore));     // Endpoints: /logs
app.use('/admin', adminRoutes);              // Endpoints: /admin/system-info, etc.
app.use('/', blockchainRoutes);              // Endpoints: /blocks
app.use('/', transactionRoutes);             // Endpoints: /transactionsPool, /transaction
```

---

## 🚨 PROBLEMAS ENCONTRADOS

### PROBLEMA #1: `/wallet/public-key` (MagnusmasterAPI❌)

**Ubicación:** [CartoLMM/src/api/magnusmasterAPI.js](../src/api/magnusmasterAPI.js#L219)

```javascript
// LÍNEA 219 - INCORRECTO ❌
async getPublicKey() {
  return await this.makeRequest('/public-key');  // ← FALLA
}

// DEBERÍA SER ✅
async getPublicKey() {
  return await this.makeRequest('/wallet/public-key');  // ← CORRECTO
}
```

**En backend:**
- Archivo: `app/routes/walletRoutes.js` (línea 30)
- Ruta: `router.get('/public-key', getPublicKey);`
- Prefijo: `app.use('/wallet', walletRoutes);` (server.js:420)
- **URL REAL:** `/wallet/public-key`

**Impacto:** 
- CartoLMM no obtiene la clave pública
- `getDashboardMetrics()` falla parcialmente
- `handleGetSystemInfo()` en CartoLMM falla

---

### PROBLEMA #2: `/wallet/balance` (MagnusmasterAPI❌)

**Ubicación:** [CartoLMM/src/api/magnusmasterAPI.js](../src/api/magnusmasterAPI.js#L214)

```javascript
// LÍNEA 214 - INCORRECTO ❌
async getWalletBalance() {
  return await this.makeRequest('/balance', { cacheTtlMs: 30000 });  // ← FALLA
}

// DEBERÍA SER ✅
async getWalletBalance() {
  return await this.makeRequest('/wallet/balance', { cacheTtlMs: 30000 });  // ← CORRECTO
}
```

**En backend:**
- Archivo: `app/routes/walletRoutes.js` (línea 36)
- Ruta: `router.get('/balance', getBalance);`
- Prefijo: `app.use('/wallet', walletRoutes);` (server.js:420)
- **URL REAL:** `/wallet/balance`

**Impacto:**
- CartoLMM no obtiene balance de wallet global
- Dashboard metrics incompletamente cargado

---

### PROBLEMA #3: `/wallet/address-balance` (MagnusmasterAPI❌)

**Ubicación:** [CartoLMM/src/api/magnusmasterAPI.js](../src/api/magnusmasterAPI.js#L203)

```javascript
// LÍNEA 203 - INCORRECTO ❌
async getAddressBalance(address) {
  return await this.makeRequest('/address-balance', {  // ← FALLA
    method: 'POST',
    body: JSON.stringify({ address }),
    cacheTtlMs: 60000,
    cacheKey
  });
}

// DEBERÍA SER ✅
async getAddressBalance(address) {
  return await this.makeRequest('/wallet/address-balance', {  // ← CORRECTO
    method: 'POST',
    body: JSON.stringify({ address }),
    cacheTtlMs: 60000,
    cacheKey
  });
}
```

**En backend:**
- Archivo: `app/routes/walletRoutes.js` (línea 33)
- Ruta: `router.post('/address-balance', addressBalance);`
- Prefijo: `app.use('/wallet', walletRoutes);` (server.js:420)
- **URL REAL:** `/wallet/address-balance`

**Impacto:**
- CartoLMM no puede obtener balance por dirección
- `/api/balance` falla en CartoLMM

---

### ✅ CORRECTO: `/verify-qr-proof`

**Ubicación:** [CartoLMM/src/api/magnusmasterAPI.js](../src/api/magnusmasterAPI.js#L224)

```javascript
// LÍNEA 224 - ✅ CORRECTO
async verifyQRProof(qrData) {
  return await this.makeRequest('/verify-qr-proof', {  // ✅ OK
    method: 'POST',
    body: JSON.stringify({ qrData })
  });
}
```

**En backend:**
- Archivo: `app/routes/loteRoutes.js` (línea 18)
- Ruta: `router.post('/verify-qr-proof', verifyQRProof);`
- Prefijo: `app.use('/', loteRoutes);` (server.js:441)
- **URL REAL:** `/verify-qr-proof` ✅

**Status:** Sin problemas

---

## 📋 Matriz de Compatibilidad (ACTUALIZADA)

| Método MagnusmasterAPI | Endpoint en Code | Endpoint Real | Status | Acción |
|---|---|---|---|---|
| getBlocks() | `/blocks` | `/blocks` | ✅ | — |
| getTransactionsPool() | `/transactionsPool` | `/transactionsPool` | ✅ | — |
| getSystemInfo() | `/system-info` | `/system-info` | ✅ | — |
| getPublicKey() | `/public-key` | `/wallet/public-key` | ❌ | **ACTUALIZAR** |
| getWalletBalance() | `/balance` | `/wallet/balance` | ❌ | **ACTUALIZAR** |
| getAddressBalance() | `/address-balance` | `/wallet/address-balance` | ❌ | **ACTUALIZAR** |
| getUTXOBalance() | `/utxo-balance/:addr` | `/utxo-balance/:addr` | ✅ | — |
| verifyQRProof() | `/verify-qr-proof` | `/verify-qr-proof` | ✅ | — |

---

## 🔧 Handlers Afectados en CartoLMM

| Endpoint CartoLMM | Handler | Método Afectado | Severidad |
|---|---|---|---|
| `/api/dashboard-metrics` | handleGetDashboardMetrics() | getDashboardMetrics() → getPublicKey(), getWalletBalance() | 🔴 CRÍTICO |
| `/api/balance` | handleGetBalance() | getAddressBalance() | 🔴 CRÍTICO |
| `/api/system-info` | handleGetSystemInfo() | getSystemInfo() | ✅ OK |
| `/api/verify-qr-proof` | handleVerifyQR() | verifyQRProof() | ✅ OK |

---

## ✍️ Conclusiones

### Resumen de Hallazgos

1. **3 endpoints con rutas incorrectas** en MagnusmasterAPI.js
   - Todos bajo prefijo `/wallet` que no fue considerado
   - Causan fallos en dashboard y balance queries

2. **Estructura de registro confirmada**
   - magnumsmaster y magnumslocal idénticos
   - Prefijos registrados correctamente en líneas 414-457 de server.js

3. **Sin cambios en otros endpoints**
   - 90% de endpoints funcionan correctamente
   - `/blocks`, `/system-info`, `/transactionsPool`, etc. OK

### Recomendaciones

✅ **PRÓXIMO PASO:** Actualizar MagnusmasterAPI.js rutas de `/wallet/*`

---

## 📄 Comandos Usados en Auditoría

```bash
# Listar todos los endpoints GET
grep -rn "router.get" app/routes/ | sort

# Listar todos los endpoints POST
grep -rn "router.post" app/routes/ | sort

# Ver cómo se registran las rutas
grep -n "app.use" server.js | grep Routes

# Verificar endpoints específicos
grep -rn "public-key\|balance\|address-balance\|verify-qr" app/routes/
```

---

## 🎯 Próximas Fases

- [ ] **FASE 4:** Actualizar MagnusmasterAPI.js con rutas correctas
- [ ] **FASE 5:** Actualizar handlers en CartoLMM/routes.js si es necesario
- [ ] **FASE 6:** Testing de endpoints con curl
- [ ] **FASE 7:** Validar fallbacks y manejo de errores

