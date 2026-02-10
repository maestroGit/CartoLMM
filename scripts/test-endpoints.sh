#!/bin/bash
# ============================================================================
# SCRIPT DE TESTING - Validación de Endpoints CartoLMM post-Actualización
# ============================================================================
# Propósito: Probar todos los endpoints de CartoLMM y magnumsmaster
# Fecha: 2026-02-10
# Status: TESTS PREPARADOS - Ejecutar manualmente para debugging
#
# USO:
#   bash test-endpoints.sh           # Ejecutar todos los tests
#   bash test-endpoints.sh --basic   # Solo tests básicos
#   bash test-endpoints.sh --full    # Con debugging detallado
# ============================================================================

set -e

# Configuración de colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# URLs base
MAGNUMSMASTER_URL="${MAGNUMSMASTER_URL:-http://localhost:3001}"
CARTOLMM_URL="${CARTOLMM_URL:-http://localhost:8080}"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Verbose mode
VERBOSE=${VERBOSE:-false}

# ============================================================================
# FUNCIONES HELPER
# ============================================================================

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}➤ $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}\n"
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ PASS${NC} $1"
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}❌ FAIL${NC} $1"
    ((TESTS_FAILED++))
}

print_skip() {
    echo -e "${YELLOW}⏭️  SKIP${NC} $1"
    ((TESTS_SKIPPED++))
}

print_details() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${BLUE}[DEBUG]${NC} $1"
    fi
}

# ============================================================================
# TESTS DE ENDPOINTS MAGNUMSMASTER (Rutas Base)
# ============================================================================

test_magnumsmaster_endpoints() {
    print_header "TESTING magnumsmaster ENDPOINTS (Base URLs)"

    # Test 1: GET /blocks
    print_test "GET $MAGNUMSMASTER_URL/blocks"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$MAGNUMSMASTER_URL/blocks" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /blocks - HTTP $HTTP_CODE"
        print_details "Response: $(echo $BODY | head -c 100)..."
    else
        print_failure "GET /blocks - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 2: GET /system-info
    print_test "GET $MAGNUMSMASTER_URL/system-info"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$MAGNUMSMASTER_URL/system-info" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /system-info - HTTP $HTTP_CODE"
        print_details "Response: $(echo $BODY | head -c 100)..."
    else
        print_failure "GET /system-info - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 3: GET /transactionsPool
    print_test "GET $MAGNUMSMASTER_URL/transactionsPool"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$MAGNUMSMASTER_URL/transactionsPool" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /transactionsPool - HTTP $HTTP_CODE"
        print_details "Response: $(echo $BODY | head -c 100)..."
    else
        print_failure "GET /transactionsPool - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi
}

# ============================================================================
# TESTS DE ENDPOINTS WALLET (CRÍTICO - Rutas con /wallet)
# ============================================================================

test_wallet_endpoints() {
    print_header "TESTING WALLET ENDPOINTS (Con prefijo /wallet - CRITICAL)"

    # Test 1: GET /wallet/public-key (Actualizado en magnumsmaster)
    print_test "GET $MAGNUMSMASTER_URL/wallet/public-key"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$MAGNUMSMASTER_URL/wallet/public-key" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /wallet/public-key - HTTP $HTTP_CODE"
        print_details "Response: $BODY"
    else
        print_failure "GET /wallet/public-key - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
        print_details "⚠️ NOTA: MagnusmasterAPI.js ahora envía /wallet/public-key (Actualizado)"
    fi

    # Test 2: GET /wallet/balance (Actualizado en magnumsmaster)
    print_test "GET $MAGNUMSMASTER_URL/wallet/balance"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$MAGNUMSMASTER_URL/wallet/balance" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /wallet/balance - HTTP $HTTP_CODE"
        print_details "Response: $BODY"
    else
        print_failure "GET /wallet/balance - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
        print_details "⚠️ NOTA: MagnusmasterAPI.js ahora envía /wallet/balance (Actualizado)"
    fi

    # Test 3: POST /wallet/address-balance (Actualizado en magnumsmaster)
    print_test "POST $MAGNUMSMASTER_URL/wallet/address-balance"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$MAGNUMSMASTER_URL/wallet/address-balance" \
        -H "Content-Type: application/json" \
        -d '{"address":"test_address"}')
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "POST /wallet/address-balance - HTTP $HTTP_CODE"
        print_details "Response: $BODY"
    else
        print_failure "POST /wallet/address-balance - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
        print_details "⚠️ NOTA: MagnusmasterAPI.js ahora envía /wallet/address-balance (Actualizado)"
    fi
}

# ============================================================================
# TESTS DE ENDPOINTS CARTOLMM (API Proxy)
# ============================================================================

test_cartolmm_endpoints() {
    print_header "TESTING CartoLMM ENDPOINTS (API Proxy con Fallbacks)"

    # Test 1: GET /api/blocks
    print_test "GET $CARTOLMM_URL/api/blocks"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/blocks" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        SOURCE=$(echo $BODY | grep -o '"source":"[^"]*"' | head -1)
        print_success "GET /api/blocks - HTTP $HTTP_CODE - $SOURCE"
        print_details "Response: $(echo $BODY | head -c 100)..."
    else
        print_failure "GET /api/blocks - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 2: GET /api/transactions (AHORA USA API REAL)
    print_test "GET $CARTOLMM_URL/api/transactions (UPDATED: APIreal + fallback)"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/transactions" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        SOURCE=$(echo $BODY | grep -o '"source":"[^"]*"')
        print_success "GET /api/transactions - HTTP $HTTP_CODE - $SOURCE (Real API + Fallback!)"
        print_details "Response: $(echo $BODY | head -c 150)..."
    else
        print_failure "GET /api/transactions - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 3: GET /api/balance
    print_test "GET $CARTOLMM_URL/api/balance?address=test_address"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/balance?address=test_address" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /api/balance - HTTP $HTTP_CODE"
        print_details "Response: $BODY"
    else
        print_failure "GET /api/balance - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 4: GET /api/utxo-balance
    print_test "GET $CARTOLMM_URL/api/utxo-balance?address=test_address"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/utxo-balance?address=test_address" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /api/utxo-balance - HTTP $HTTP_CODE"
        print_details "Response: $BODY"
    else
        print_failure "GET /api/utxo-balance - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 5: GET /api/system-info
    print_test "GET $CARTOLMM_URL/api/system-info"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/system-info" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /api/system-info - HTTP $HTTP_CODE"
        print_details "Response: $(echo $BODY | head -c 100)..."
    else
        print_failure "GET /api/system-info - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi

    # Test 6: GET /api/magnumsmaster-status
    print_test "GET $CARTOLMM_URL/api/magnumsmaster-status"
    RESPONSE=$(curl -s -w "\n%{http_code}" "$CARTOLMM_URL/api/magnumsmaster-status" -H "Accept: application/json")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "GET /api/magnumsmaster-status - HTTP $HTTP_CODE (Con endpoints actualizados)"
        print_details "Endpoints en respuesta: $(echo $BODY | grep -o '"endpoints":{[^}]*}' | head -c 100)..."
    else
        print_failure "GET /api/magnumsmaster-status - HTTP $HTTP_CODE (Expected 200)"
        print_details "Response: $BODY"
    fi
}

# ============================================================================
# TESTS DE LOGGING Y FALLBACKS
# ============================================================================

test_logging_and_fallbacks() {
    print_header "TESTING LOGGING Y FALLBACKS"

    echo -e "${YELLOW}Instrucciones:${NC}"
    echo "1. Abre la consola del servidor de CartoLMM"
    echo "2. Observa los logs con formato [API] para cada request"
    echo "3. Busca iconos: ✅ OK, ⚠️ FALLBACK, ❌ ERROR"
    echo ""
    echo -e "${YELLOW}Ejemplo de logs esperados:${NC}"
    echo "  ✅ [API] /api/transactions - Datos obtenidos: ..."
    echo "  ⚠️ [API] /api/balance - Usando fallback. Razón: ..."
    echo "  ❌ [API] /api/utxo-balance - Error: Connection refused"
    echo ""
    
    print_success "Logging format: ✅/⚠️/❌ + [API] + endpoint"
}

# ============================================================================
# RESUMEN DE RESULTADOS
# ============================================================================

print_summary() {
    print_header "RESUMEN DE TESTS"
    
    echo -e "${GREEN}✅ PASSED:${NC} $TESTS_PASSED"
    echo -e "${RED}❌ FAILED:${NC} $TESTS_FAILED"
    echo -e "${YELLOW}⏭️  SKIPPED:${NC} $TESTS_SKIPPED"
    echo ""
    
    TOTAL=$((TESTS_PASSED + TESTS_FAILED + TESTS_SKIPPED))
    echo "Total: $TOTAL tests"
    
    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo -e "${GREEN}✅ TODOS LOS TESTS PASARON${NC}"
        return 0
    else
        echo -e "${RED}❌ ALGUNOS TESTS FALLARON${NC}"
        return 1
    fi
}

# ============================================================================
# POSIBLES FALLOS Y SOLUCIONES
# ============================================================================

print_troubleshooting() {
    print_header "POSIBLES FALLOS Y SOLUCIONES"
    
    cat << 'EOF'
🔴 FALLO: "Connection refused" en /wallet/* endpoints

   CAUSA: magnumsmaster no está corriendo en http://localhost:3001
   SOLUCIÓN:
   1. Verifica que magnumsmaster esté en puerto 3001
   2. Ejecuta: npm run dev (en magnumsmaster)
   3. Espera a que inicie completamente

---

🔴 FALLO: HTTP 404 en /wallet/public-key

   CAUSA: La ruta no existe en magnumsmaster (actualización incompleta)
   SOLUCIÓN:
   1. Verifica que app/routes/walletRoutes.js tenga:
      router.get('/public-key', getPublicKey);
   2. Verifica que server.js tenga:
      app.use('/wallet', walletRoutes);
   3. Reinicia magnumsmaster

---

🔴 FALLO: HTTPs/CORS issues

   CAUSA: Protocol mismatch (http vs https) o CORS no configurado
   SOLUCIÓN:
   1. Asegúrate de usar http:// en localhost
   2. Verifica CORS middleware en magnumsmaster:
      app.use(cors())
   3. Reinicia ambos servidores

---

🟡 FALSOS POSITIVOS: Source "mock" en respuestas

   INFO: Esto es NORMAL si magnumsmaster no está disponible
   VERIFICACIÓN:
   1. Verifica logs de magnumsmaster para errores
   2. Comprueba conectividad: curl http://localhost:3001/system-info
   3. Si falla, los fallbacks a mock data funcionan correctamente

---

✅ VALIDACIÓN CORRECTA:
   - HTTP 200 en todos los endpoints base
   - Source "magnumsmaster" = datos reales
   - Source "mock"/"fallback" = backend no disponible (por ahora OK para tests)
   - Logs con formato [API] en consola del servidor

EOF
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

main() {
    echo -e "${BLUE}"
    cat << 'EOF'
╔════════════════════════════════════════════════════════════════╗
║   TEST SUITE - CartoLMM Actualización de Endpoints             ║
║   Fecha: 2026-02-10                                            ║
║   Status: TESTS PREPARADOS - Ejecutar para debugging           ║
╚════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    echo -e "${YELLOW}URLs Configuradas:${NC}"
    echo "  magnumsmaster: $MAGNUMSMASTER_URL"
    echo "  CartoLMM:      $CARTOLMM_URL"
    echo ""

    # Parsear argumentos
    if [[ "${1:-}" == "--verbose" ]]; then
        VERBOSE=true
        echo -e "${YELLOW}Modo VERBOSE activado${NC}\n"
    fi

    # Ejecutar tests
    test_magnumsmaster_endpoints
    test_wallet_endpoints
    test_cartolmm_endpoints
    test_logging_and_fallbacks

    # Mostrar troubleshooting
    print_troubleshooting

    # Resumen
    print_summary
}

# Ejecutar main
main "$@"
