# í½· Large Magnum Master - Blockchain Wine System

> **Sistema blockchain completo para trazabilidad de vinos con red P2P, minado distribuido y gestiÃ³n UTXO avanzada.**

## í¿ Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor blockchain
npm start

# 3. Acceder al dashboard
http://localhost:3000
```

## í³‹ Ãndice

- [í¿—ï¸ Arquitectura](#ï¸-arquitectura)
- [í¾® GestiÃ³n de Nodos](#-gestiÃ³n-de-nodos)
- [í´§ API Endpoints](#-api-endpoints)
- [í³š DocumentaciÃ³n](#-documentaciÃ³n)
- [í» ï¸ Scripts Disponibles](#ï¸-scripts-disponibles)

---

## í¿—ï¸ Arquitectura

### **Estructura Principal**
```
magnumsmaster/
â”œâ”€â”€ server.js           # íº€ Servidor principal (nuevo estÃ¡ndar)
â”œâ”€â”€ app/                # ï¿½ï¿½ MÃ³dulos del servidor
â”‚   â”œâ”€â”€ p2pServer.js    #   â†³ Red P2P
â”‚   â”œâ”€â”€ miner.js        #   â†³ Sistema de minado
â”‚   â””â”€â”€ validator.js    #   â†³ ValidaciÃ³n blockchain
â”œâ”€â”€ src/                # í´— Core blockchain
â”‚   â”œâ”€â”€ blockchain.js   #   â†³ Cadena principal
â”‚   â””â”€â”€ block.js        #   â†³ Estructura de bloques
â”œâ”€â”€ wallet/             # í²° Sistema de wallets
â””â”€â”€ public/             # í¼ Frontend web
```

### **Componentes Clave**
- **í´— Blockchain Core**: GestiÃ³n de bloques y transacciones
- **í¼ P2P Network**: Red descentralizada entre nodos
- **â›ï¸ Mining System**: Minado con proof-of-work
- **í²° UTXO Management**: Sistema de outputs no gastados
- **í´ Wallet System**: GestiÃ³n de claves y firmas

---

## í³ˆ MÃ©tricas del Sistema - Octubre 2025

- **LÃ­neas de cÃ³digo:** ~23K+
- **Funcionalidad:** 100% operacional
- **Bug fixes aplicados:** 18+ crÃ­ticos resueltos
- **Tests implementados:** Suite completa
- **Estado:** âœ… **LISTO PARA PRODUCCIÃ“N**

---

## í¾® GestiÃ³n de Nodos

### **Scripts de Red**
```bash
# Red completa (mÃºltiples nodos)
npm run network

# Nodo Ãºnico para desarrollo
npm run single-node

# Terminar todos los nodos
npm run stop-nodes
```

### **Scripts Especializados**
```bash
# Windows - Terminales separadas
npm run network:windows

# Windows - EjecuciÃ³n simple
npm run network:windows-simple

# Linux/Mac - Terminales
npm run network:terminals
```

---

## í´§ API Endpoints

### **Blockchain**
- \`GET /blocks\` - Obtener todos los bloques
- \`POST /mine\` - Minar nuevo bloque
- \`GET /transactions\` - Pool de transacciones

### **Wallet**
- \`POST /transact\` - Crear transacciÃ³n
- \`GET /balance?address=<addr>\` - Consultar balance
- \`GET /public-key\` - Obtener clave pÃºblica

### **Sistema**
- \`GET /peers\` - Nodos conectados
- \`GET /\` - Dashboard principal

---

## í» ï¸ Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor con nodemon
npm start           # Servidor producciÃ³n
npm test            # Suite de testing

# Red blockchain
npm run network     # Red completa
npm run single-node # Nodo Ãºnico

# Utilidades
npm run mine        # Script de minado
npm run stop-nodes  # Detener nodos
```

---

## í³š DocumentaciÃ³n

### **DocumentaciÃ³n Completa**
- **[í³– DocumentaciÃ³n Detallada](docs/README.md)** - GuÃ­a completa
- **[í´ Sistema QR](docs/QR-PROOF-BLOCKCHAIN.md)** - VerificaciÃ³n QR
- **[í¼ GestiÃ³n de Nodos](docs/README-NODOS.md)** - ConfiguraciÃ³n P2P
- **[í³œ HistÃ³rico](docs/README-HISTORICO-COMPLETO.md)** - EvoluciÃ³n

### **GuÃ­as Especializadas**
- **[íº€ Launchers Guide](docs/LAUNCHERS-GUIDE.md)** - Scripts de lanzamiento
- **[ï¿½ï¿½ Presentaciones](docs/presentacion-mejorada.md)** - Material tÃ©cnico

---

## âœ¨ CaracterÃ­sticas Avanzadas

### **í´— Blockchain Completo**
- âœ… Proof-of-Work mining
- âœ… UTXO transaction model
- âœ… P2P network discovery
- âœ… Block validation
- âœ… Transaction pool

### **í¼ Interfaz Web**
- âœ… Dashboard en tiempo real
- âœ… VisualizaciÃ³n de bloques
- âœ… Monitor de transacciones
- âœ… GestiÃ³n de wallets

### **í´ Seguridad**
- âœ… Firma digital ECDSA
- âœ… VerificaciÃ³n QR
- âœ… ValidaciÃ³n de transacciones
- âœ… Control de double-spending

---

## íº€ Estado del Proyecto

**âœ… SISTEMA COMPLETAMENTE FUNCIONAL Y VERIFICADO**

- **Backend**: Servidor blockchain estable en puerto 3000
- **P2P Network**: Red distribuida operacional
- **Mining**: Sistema de minado robusto y optimizado
- **Frontend**: Dashboard completo y responsive
- **Testing**: Suite de tests completa y validada

---

## í´„ IntegraciÃ³n con CartoLMM

Este proyecto se integra con **CartoLMM** para visualizaciÃ³n geogrÃ¡fica de bodegas:
- **magnumsmaster**: Backend blockchain (puerto 3000)
- **CartoLMM**: Frontend geogrÃ¡fico (puerto 8080)

---

## ï¿½ï¿½ Soporte

Para documentaciÃ³n adicional, revisa la carpeta `/docs/` que contiene guÃ­as especializadas para cada componente del sistema.

**í½· Del TerruÃ±o al Ciberespacio - Large Magnum Master 2025**
