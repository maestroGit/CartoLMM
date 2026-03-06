# ��� Large Magnum Master - Blockchain Wine System

> **Sistema blockchain completo para trazabilidad de vinos con red P2P, minado distribuido y gestión UTXO avanzada.**

## ��� Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor blockchain
npm start

# 3. Acceder al dashboard
http://localhost:3000
```

## ��� Índice

- [���️ Arquitectura](#️-arquitectura)
- [��� Gestión de Nodos](#-gestión-de-nodos)
- [��� API Endpoints](#-api-endpoints)
- [��� Documentación](#-documentación)
- [���️ Scripts Disponibles](#️-scripts-disponibles)

---

## ���️ Arquitectura

### **Estructura Principal**
```
magnumsmaster/
├── server.js           # ��� Servidor principal (nuevo estándar)
├── app/                # �� Módulos del servidor
│   ├── p2pServer.js    #   ↳ Red P2P
│   ├── miner.js        #   ↳ Sistema de minado
│   └── validator.js    #   ↳ Validación blockchain
├── src/                # ��� Core blockchain
│   ├── blockchain.js   #   ↳ Cadena principal
│   └── block.js        #   ↳ Estructura de bloques
├── wallet/             # ��� Sistema de wallets
└── public/             # ��� Frontend web
```

### **Componentes Clave**
- **��� Blockchain Core**: Gestión de bloques y transacciones
- **��� P2P Network**: Red descentralizada entre nodos
- **⛏️ Mining System**: Minado con proof-of-work
- **��� UTXO Management**: Sistema de outputs no gastados
- **��� Wallet System**: Gestión de claves y firmas

---

## ��� Métricas del Sistema - Octubre 2025

- **Líneas de código:** ~23K+
- **Funcionalidad:** 100% operacional
- **Bug fixes aplicados:** 18+ críticos resueltos
- **Tests implementados:** Suite completa
- **Estado:** ✅ **LISTO PARA PRODUCCIÓN**

---

## ��� Gestión de Nodos

### **Scripts de Red**
```bash
# Red completa (múltiples nodos)
npm run network

# Nodo único para desarrollo
npm run single-node

# Terminar todos los nodos
npm run stop-nodes
```

### **Scripts Especializados**
```bash
# Windows - Terminales separadas
npm run network:windows

# Windows - Ejecución simple
npm run network:windows-simple

# Linux/Mac - Terminales
npm run network:terminals
```

---

## ��� API Endpoints

### **Blockchain**
- \`GET /blocks\` - Obtener todos los bloques
- \`POST /mine\` - Minar nuevo bloque
- \`GET /transactions\` - Pool de transacciones

### **Wallet**
- \`POST /transact\` - Crear transacción
- \`GET /balance?address=<addr>\` - Consultar balance
- \`GET /public-key\` - Obtener clave pública

### **Sistema**
- \`GET /peers\` - Nodos conectados
- \`GET /\` - Dashboard principal

---

## ���️ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con nodemon
npm start           # Servidor producción
npm test            # Suite de testing

# Red blockchain
npm run network     # Red completa
npm run single-node # Nodo único

# Utilidades
npm run mine        # Script de minado
npm run stop-nodes  # Detener nodos
```

---

## ��� Documentación

### **Documentación Completa**
- **[��� Documentación Detallada](docs/README.md)** - Guía completa
- **[��� Sistema QR](docs/QR-PROOF-BLOCKCHAIN.md)** - Verificación QR
- **[��� Gestión de Nodos](docs/README-NODOS.md)** - Configuración P2P
- **[��� Histórico](docs/README-HISTORICO-COMPLETO.md)** - Evolución

### **Guías Especializadas**
- **[��� Launchers Guide](docs/LAUNCHERS-GUIDE.md)** - Scripts de lanzamiento
- **[�� Presentaciones](docs/presentacion-mejorada.md)** - Material técnico

---

## ✨ Características Avanzadas

### **��� Blockchain Completo**
- ✅ Proof-of-Work mining
- ✅ UTXO transaction model
- ✅ P2P network discovery
- ✅ Block validation
- ✅ Transaction pool

### **��� Interfaz Web**
- ✅ Dashboard en tiempo real
- ✅ Visualización de bloques
- ✅ Monitor de transacciones
- ✅ Gestión de wallets

### **��� Seguridad**
- ✅ Firma digital ECDSA
- ✅ Verificación QR
- ✅ Validación de transacciones
- ✅ Control de double-spending

---

## ��� Estado del Proyecto

**✅ SISTEMA COMPLETAMENTE FUNCIONAL Y VERIFICADO**

- **Backend**: Servidor blockchain estable en puerto 3000
- **P2P Network**: Red distribuida operacional
- **Mining**: Sistema de minado robusto y optimizado
- **Frontend**: Dashboard completo y responsive
- **Testing**: Suite de tests completa y validada

---

## ��� Integración con CartoLMM

Este proyecto se integra con **CartoLMM** para visualización geográfica de bodegas:
- **magnumsmaster**: Backend blockchain (puerto 3000)
- **CartoLMM**: Frontend geográfico (puerto 8080)

### Usuarios y wallets en popups (CartoLMM)

- Fuente única en runtime: **API/BD** (`/api/users`).
- Para que el popup muestre wallets, la carga debe usar `includeWallets=true`.
- Endpoint recomendado: `GET /api/users?includeWallets=true`.
- `public/data/users.json` ya no se usa como fuente de datos en ejecución.

---

## �� Soporte

Para documentación adicional, revisa la carpeta `/docs/` que contiene guías especializadas para cada componente del sistema.

**��� Del Terruño al Ciberespacio - Large Magnum Master 2025**
