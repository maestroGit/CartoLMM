#!/bin/bash

# Script de testing para la integración Leaflet + Peers Blockchain
# Uso: bash test-leaflet-integration.sh

echo "🧪 Testing Leaflet Integration - CartoLMM"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0
    else
        return 1
    fi
}

# 1. Verificar archivos creados
echo "📁 Verificando archivos creados..."
files=(
    "src/services/coordinateService.js"
    "src/leaflet/PeerMarker.js"
    "src/leaflet/PeerLayerManager.js"
    "public/peer-markers.css"
    "docs/LEAFLET-MAP-INTEGRATION.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file ${RED}NO ENCONTRADO${NC}"
    fi
done
echo ""

# 2. Verificar archivos modificados
echo "🔧 Verificando archivos modificados..."
modified_files=(
    "src/api/routes.js"
    "src/services/mapService.js"
    "src/services/realtimeDashboardService.js"
    "public/realtimeDashboardService.js"
    "public/index.html"
)

for file in "${modified_files[@]}"; do
    if grep -q "coordinateService\|PeerLayerManager\|mapService" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $file (integrado)"
    else
        echo -e "${YELLOW}⚠${NC} $file (sin cambios detectados)"
    fi
done
echo ""

# 3. Verificar imports en routes.js
echo "📦 Verificando imports..."
if grep -q "import coordinateService from '../services/coordinateService.js'" "src/api/routes.js"; then
    echo -e "${GREEN}✓${NC} coordinateService importado en routes.js"
else
    echo -e "${RED}✗${NC} coordinateService NO importado en routes.js"
fi

if grep -q "import { PeerLayerManager } from '../leaflet/PeerLayerManager.js'" "src/services/mapService.js"; then
    echo -e "${GREEN}✓${NC} PeerLayerManager importado en mapService.js"
else
    echo -e "${RED}✗${NC} PeerLayerManager NO importado en mapService.js"
fi
echo ""

# 4. Verificar CSS en HTML
echo "🎨 Verificando CSS..."
if grep -q "peer-markers.css" "public/index.html"; then
    echo -e "${GREEN}✓${NC} peer-markers.css vinculado en index.html"
else
    echo -e "${RED}✗${NC} peer-markers.css NO vinculado en index.html"
fi
echo ""

# 5. Verificar servidores
echo "🌐 Verificando servidores..."

if check_port 3000; then
    echo -e "${GREEN}✓${NC} magnumsmaster corriendo en puerto 3000"
else
    echo -e "${YELLOW}⚠${NC} magnumsmaster NO está corriendo en puerto 3000"
    echo "   Ejecuta: cd magnumsmaster && npm start"
fi

if check_port 8080; then
    echo -e "${GREEN}✓${NC} CartoLMM corriendo en puerto 8080"
else
    echo -e "${YELLOW}⚠${NC} CartoLMM NO está corriendo en puerto 8080"
    echo "   Ejecuta: cd CartoLMM && npm start"
fi
echo ""

# 6. Test de API endpoints
echo "🔗 Testing API endpoints..."

if check_port 8080; then
    # Test /api/peers
    echo "   Testing GET /api/peers..."
    response=$(curl -s http://localhost:8080/api/peers)
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓${NC} /api/peers responde correctamente"
        
        # Verificar si tiene coordenadas
        if echo "$response" | grep -q '"lat"' && echo "$response" | grep -q '"lng"'; then
            echo -e "${GREEN}✓${NC} Peers incluyen coordenadas (lat/lng)"
        else
            echo -e "${RED}✗${NC} Peers NO incluyen coordenadas"
        fi
        
        # Contar peers
        peer_count=$(echo "$response" | grep -o '"nodeId"' | wc -l)
        echo "   📊 Peers detectados: $peer_count"
    else
        echo -e "${RED}✗${NC} /api/peers no responde o error"
    fi
else
    echo -e "${YELLOW}⚠${NC} Servidor no disponible, saltando tests de API"
fi
echo ""

# 7. Verificar modo CoordinateService
echo "⚙️ Verificando configuración..."
if grep -q "this.useMockCoordinates = true" "src/services/coordinateService.js"; then
    echo -e "${GREEN}✓${NC} CoordinateService en modo MOCK"
elif grep -q "this.useMockCoordinates = false" "src/services/coordinateService.js"; then
    echo -e "${YELLOW}⚠${NC} CoordinateService en modo GeoIP (requiere internet)"
fi
echo ""

# 8. Resumen
echo "📝 Resumen de Implementación"
echo "=============================="
echo "✅ Fase 1: Visualización básica de peers"
echo "✅ Fase 2: Actualizaciones en tiempo real"
echo ""
echo "🎯 Siguiente paso:"
echo "   1. Asegúrate que ambos servidores estén corriendo"
echo "   2. Abre http://localhost:8080 en el navegador"
echo "   3. Abre la consola del navegador (F12)"
echo "   4. Verifica que aparezcan marcadores de peers en el mapa"
echo ""
echo "🐛 Debugging en navegador:"
echo "   window.mapService?.getPeerStats()"
echo "   window.coordinateService?.getCacheStats()"
echo "   window.realtimeDashboardService"
echo ""

# 9. Comandos útiles
echo "💡 Comandos útiles:"
echo "   Iniciar magnumsmaster: cd magnumsmaster && npm start"
echo "   Iniciar CartoLMM:      cd CartoLMM && npm start"
echo "   Ver logs backend:      tail -f CartoLMM/logs/*.log"
echo ""

echo "✅ Testing completado!"
