# 🧪 Testing Guide - CartoLMM post-Actualización de Endpoints

**Fecha:** 2026-02-10  
**Status:** ✅ TESTS PREPARADOS - Listos para ejecutar manualmente  
**Propósito:** Validar todos los cambios de endpoints sin romper nada

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Testing Automático (Script bash)](#testing-automático)
3. [Testing Manual (curl)](#testing-manual-con-curl)
4. [Checklist de Validación](#checklist-de-validación)
5. [Posibles Fallos y Soluciones](#posibles-fallos-y-soluciones)
6. [Validación de Logs](#validación-de-logs)

---

## 📌 Requisitos Previos

```bash
# Necesario para tests
✅ curl instalado              # Generalmente preinstalado
✅ bash shell                  # Para ejecutar scripts
✅ magnumsmaster corriendo      # En http://localhost:3001
✅ CartoLMM corriendo          # En http://localhost:8080
✅ PostgreSQL/BD disponible    # Si requieren datos reales
```

### Verificar que servicios están activos

```bash
# Terminal 1: Verificar magnumsmaster
curl http://localhost:3001/system-info
# Debe retornar JSON con blockchain info

# Terminal 2: Verificar CartoLMM
curl http://localhost:8080/api/system-info
# Debe retornar JSON (puede ser proxy de magnumsmaster)
```

---

## 🚀 Testing Automático

### Ejecutar Script de Tests

```bash
# Posicionarse en CartoLMM
cd c:/Users/maest/Documents/CartoLMM

# Opción 1: Tests básicos (recomendado primero)
bash scripts/test-endpoints.sh

# Opción 2: Tests con modo verbose (más detalles)
bash scripts/test-endpoints.sh --verbose

# Opción 3: Con URLs personalizadas
MAGNUMSMASTER_URL=http://localhost:3001 \
CARTOLMM_URL=http://localhost:8080 \
bash scripts/test-endpoints.sh
```

### Resultados Esperados

```
✅ PASS GET /blocks - HTTP 200
✅ PASS GET /system-info - HTTP 200
✅ PASS GET /wallet/public-key - HTTP 200          ← CRÍTICO (Actualizado)
✅ PASS POST /wallet/address-balance - HTTP 200    ← CRÍTICO (Actualizado)
✅ PASS GET /api/transactions - HTTP 200 - "magnumsmaster" ← Ahora real!
⏭️  SKIP Alguno que no esté disponible
```

---

## 🔍 Testing Manual con curl

### 1. Endpoints Base de magnumsmaster (SIN CAMBIOS)

```bash
# GET /blocks
curl -X GET http://localhost:3001/blocks
# Esperado: array de bloques

# GET /system-info
curl -X GET http://localhost:3001/system-info
# Esperado: JSON con info de blockchain

# GET /transactionsPool
curl -X GET http://localhost:3001/transactionsPool
# Esperado: array de transacciones pendientes
```

### 2. Endpoints de WALLET (ACTUALIZADOS - Críticos)

```bash
# ✅ GET /wallet/public-key (ACTUALIZADO EN MAGNUMSAPI)
curl -X GET http://localhost:3001/wallet/public-key
# Esperado: { "success": true, "data": { "publicKey": "..." } }
# NOTA: Ruta es /wallet/public-key (no /public-key)

# ✅ GET /wallet/balance (ACTUALIZADO EN MAGNUMSAPI)
curl -X GET http://localhost:3001/wallet/balance
# Esperado: { "success": true, "data": { "balance": X } }
# NOTA: Ruta es /wallet/balance (no /balance)

# ✅ POST /wallet/address-balance (ACTUALIZADO EN MAGNUMSAPI)
curl -X POST http://localhost:3001/wallet/address-balance \
  -H "Content-Type: application/json" \
  -d '{"address":"test_address"}'
# Esperado: { "success": true, "data": { "address": "test_address", "balance": X } }
# NOTA: Ruta es /wallet/address-balance (no /address-balance)

# ✅ POST /verify-qr-proof (SIN CAMBIOS - Verificar que sigue en raíz)
curl -X POST http://localhost:3001/verify-qr-proof \
  -H "Content-Type: application/json" \
  -d '{"qrData":"test123"}'
# Esperado: { "success": true, "data": { "verified": bool, ... } }
```

### 3. Endpoints de CartoLMM (Proxies con Fallbacks)

```bash
# GET /api/blocks
curl -X GET http://localhost:8080/api/blocks
# Esperado: { "success": true, "data": [...], "source": "magnumsmaster" }

# GET /api/transactions (AHORA USA API REAL + FALLBACK)
curl -X GET http://localhost:8080/api/transactions
# Esperado: 
#   Si magnumsmaster OK: "source": "magnumsmaster"
#   Si magnumsmaster falla: "source": "mock", "warning": "Backend no disponible"

# GET /api/balance?address=DIRECCIÓN
curl -X GET "http://localhost:8080/api/balance?address=test_address"
# Esperado: { "success": true, "data": { "balance": X }, "source": "magnumsmaster" }

# GET /api/utxo-balance?address=DIRECCIÓN
curl -X GET "http://localhost:8080/api/utxo-balance?address=test_address"
# Esperado: { "success": true, "data": { "utxos": [...], "balance": X } }

# GET /api/dashboard-metrics
curl -X GET http://localhost:8080/api/dashboard-metrics
# Esperado: { "success": true, "data": { "blocks": {...}, "transactions": {...}, ... } }

# GET /api/magnumsmaster-status (CON ENDPOINTS ACTUALIZADOS)
curl -X GET http://localhost:8080/api/magnumsmaster-status
# Esperado: 
# {
#   "endpoints": {
#     "balanceAddress": ".../wallet/address-balance",     ← ACTUALIZADO
#     "balanceWallet": ".../wallet/balance",              ← ACTUALIZADO
#     "publicKey": ".../wallet/public-key",               ← ACTUALIZADO
#     ...
#   }
# }
```

---

## ✅ Checklist de Validación

### Pre-Testing

- [ ] magnumsmaster está corriendo en puerto 3001
- [ ] CartoLMM está corriendo en puerto 8080
- [ ] No hay errores en consolas al iniciar
- [ ] Base de datos está disponible
- [ ] Conectividad entre servicios confirmada

### Endpoints Base magnumsmaster (SIN CAMBIOS)

- [ ] `GET /blocks` → HTTP 200
- [ ] `GET /system-info` → HTTP 200
- [ ] `GET /transactionsPool` → HTTP 200

### Endpoints Wallet (ACTUALIZADOS - CRÍTICOS)

- [ ] `GET /wallet/public-key` → HTTP 200 ✅
- [ ] `GET /wallet/balance` → HTTP 200 ✅
- [ ] `POST /wallet/address-balance` → HTTP 200 ✅
- [ ] `POST /verify-qr-proof` → HTTP 200 ✅

### Endpoints CartoLMM (PROXIES)

- [ ] `GET /api/blocks` → HTTP 200 con `"source": "magnumsmaster"`
- [ ] `GET /api/transactions` → HTTP 200 con datos REALES (no mock) ✨
- [ ] `GET /api/balance?address=X` → HTTP 200
- [ ] `GET /api/utxo-balance?address=X` → HTTP 200 con `count` y `pendingCount`
- [ ] `GET /api/dashboard-metrics` → HTTP 200 con todas las métricas
- [ ] `GET /api/magnumsmaster-status` → HTTP 200 con endpoints actualizados

### Validaciones de Logs

- [ ] Logs en servidor contienen formato `[API] /endpoint`
- [ ] Se ven iconos ✅/⚠️/❌ indicando severidad
- [ ] Fallbacks muestran warnings claros
- [ ] Errores incluyen mensaje detallado

---

## 🚨 Posibles Fallos y Soluciones

### ❌ FALLO 1: "Connection refused" en todos los endpoints

```
Error: curl: (7) Failed to connect to localhost:3001
```

**Causa:** magnumsmaster no está corriendo

**Solución:**
```bash
# En terminal magnumsmaster
cd c:/Users/maest/Documents/magnumsmaster
npm run dev

# Esperar hasta ver:
# ✅ Server iniciado en puerto 3001
# ✅ [BOOT] Imports y routers modulares cargados
```

---

### ❌ FALLO 2: HTTP 404 en `/wallet/public-key`

```
HTTP 404 Not Found
```

**Causa:** La ruta no fue registrada correctamente en magnumsmaster

**Solución:**
```bash
# Verificar que walletRoutes.js tenga:
grep -n "router.get('/public-key" magnumsmaster/app/routes/walletRoutes.js
# Debe mostrar: router.get('/public-key', getPublicKey);

# Verificar que server.js registre con prefijo /wallet:
grep -n "app.use('/wallet'" magnumsmaster/server.js
# Debe mostrar: app.use('/wallet', walletRoutes);

# Si falta, agregar en server.js línea ~420
```

---

### ❌ FALLO 3: MagnusmasterAPI devolviendo 404

```
{
  "success": false,
  "error": "HTTP 404: Not Found",
  "endpoint": "/address-balance"
}
```

**Causa:** MagnusmasterAPI.js aún tiene ruta antigua sin `/wallet`

**Solución:**
```bash
# Verificar que MagnusmasterAPI.js tenga rutas correctas:
grep -n "return await this.makeRequest('/wallet/" \
  CartoLMM/src/api/magnusmasterAPI.js
# Debe mostrar:
#   /wallet/public-key
#   /wallet/balance
#   /wallet/address-balance

# Si no, revisar que FASE 4 se completó
cat c:/Users/maest/Documents/CartoLMM/docs/FASE5-ACTUALIZACION-HANDLERS-RESUMEN.md
```

---

### ⚠️ FALLO 4: Source "mock" en respuestas

```json
{
  "success": true,
  "data": [...mock data...],
  "source": "mock",
  "warning": "Backend magnumsmaster no disponible"
}
```

**Causa:** Esperada - magnumsmaster no conectible en ese momento

**Verificación:**
```bash
# Esto es NORMAL mientras:
# 1. magnumsmaster esté caído o
# 2. Cambie de puerto

# Para confirmar que fallbacks funcionan:
# 1. Apaga magnumsmaster (Ctrl+C)
# 2. Ejecuta tests nuevamente
# 3. Espera "source": "mock" en todos
# 4. Enciende magnumsmaster
# 5. Ejecuta tests nuevamente
# 6. Espera "source": "magnumsmaster" en todos

# Esto valida que fallbacks funcionan correctamente
```

---

### ❌ FALLO 5: CORS o protocolo mismatch

```
Access to XMLHttpRequest blocked by CORS policy
Mixed Content: The page was loaded over HTTPS, but requested an insecure resource
```

**Causa:** HTTP vs HTTPS mismatch, o CORS no configurado

**Solución:**
```bash
# Asegurar que usas http:// para localhost (no https)
curl http://localhost:3001/blocks  # ✅ BIEN
curl https://localhost:3001/blocks # ❌ MAL

# Verificar CORS en magnumsmaster server.js
grep -n "cors\|CORS" magnumsmaster/server.js
# Debe haber: app.use(cors());

# Si no está, CORS debe funcionar por defecto en desarrollo
```

---

### 🟡 ADVERTENCIA: Base de datos

```
Error: ER_UNKNOWN_DATABASE
Error: Trying to access database before connection
```

**Causa:** PostgreSQL no disponible o BD no existe

**Solución:**
```bash
# Verificar que PostgreSQL está corriendo
# Verificar que base de datos existe:
# En magnumsmaster/.env:
#   DB_NAME=...

# Inicializar si es necesario
npm run init-db  # Si existe este script
```

---

## 📊 Validación de Logs

### Logs Buenos - ¿Qué buscar?

Terminal de magnumsmaster:
```
✅ [BOOT] Server iniciado en http://localhost:3001
✅ [BOOT] Imports y routers modulares cargados
✅ GET /system-info - 0ms
✅ POST /wallet/address-balance - 5ms
```

Terminal de CartoLMM:
```
✅ [API] /api/blocks - Iniciando obtención...
✅ [API] /api/blocks - Datos obtenidos exitosamente
✅ [API] /api/transactions - getDashboardMetrics - Métricas obtenidas exitosamente
```

### Logs de Fallback (normales)

```
⚠️ [API] /api/transactions - Usando fallback a mock data. Razón: ECONNREFUSED
⚠️ [API] /api/balance - Usando fallback. Razón: HTTP 503

Esto es CORRECTO cuando magnumsmaster no está disponible.
Los fallbacks evita que la app se caiga.
```

### Logs de Error (investigar)

```
❌ [API] /api/balance - Error: Unexpected response structure
❌ [API] /api/utxo-balance - Error: TypeError: Cannot read property 'utxos' of undefined
❌ POST /wallet/address-balance - HTTP 404: Not Found

ACCIÓN: Verificar MagnusmasterAPI.js y handlers en CartoLMM/routes.js
```

---

## 🎯 Orden Recomendado de Testing

### Fase 1: Verificación Rápida (5 min)

```bash
# Verificar que las rutas existen
curl http://localhost:3001/blocks
curl http://localhost:3001/system-info
curl http://localhost:3001/wallet/public-key      # ← NUEVO
curl http://localhost:3001/wallet/balance         # ← NUEVO
```

✅ Si todos retornan HTTP 200 → Continuar a Fase 2

### Fase 2: Comandos Críticos (10 min)

```bash
# Validar endpoints actualizados en MagnusmasterAPI.js
curl http://localhost:8080/api/magnumsmaster-status | jq '.data.endpoints'

# Verificar que endpoints apuntan a /wallet/*
# Esperado:
# "balanceAddress": ".../wallet/address-balance"
# "balanceWallet": ".../wallet/balance"
# "publicKey": ".../wallet/public-key"
```

### Fase 3: Ejecutar Script Completo (15 min)

```bash
bash scripts/test-endpoints.sh --verbose
```

✅ Si pasa todos → Cambios listos para merge

---

## 📝 Notas Importantes

### ⚡ No ejecutar en producción YET

Estos tests son para:
- ✅ Validar cambios en desarrollo
- ✅ Identificar problemas antes de merge
- ✅ Testing manual antes de CI/CD

### 🔄 Fallbacks son Feature, no Bug

Si ves `"source": "mock"`:
- ✅ Es normal si magnumsmaster no está disponible
- ✅ Los fallbacks protegen a CartoLMM
- ✅ Cambiar a `"source": "magnumsmaster"` cuando backend esté activo

### 📊 Monitorear Logs

**SIEMPRE** abre la consola del servidor mientras haces tests:
```bash
# Terminal dedicada para logs
tail -f logs/magnumsmaster.log
tail -f logs/cartolmm.log
```

---

## ✅ Resumen de Tests Listos

| Test | Preparado | Crítico | Notas |
|---|---|---|---|
| test-endpoints.sh | ✅ | — | Script bash completo |
| Testing manual curl | ✅ | — | Comandos listos |
| Logging validation | ✅ | — | Formato [API] |
| Fallback testing | ✅ | — | Con/sin backend |
| Troubleshooting | ✅ | — | Soluciones incluidas |

---

## 🎬 Próximos Pasos

1. **Ejecutar tests** cuando ambos servidores estén activos
2. **Documentar resultados** en issue o PR
3. **Ajustar si hay fallos** siguiendo guía de troubleshooting
4. **Preparar para merge** a main cuando validación complete

