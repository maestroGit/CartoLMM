# Modelos de CartoLMM - Documentación de Clases

Resumen de las clases de modelo de la aplicación CartoLMM, ubicadas en `src/models/`.

---

## 📋 Índice

1. [Usuario](#usuario)
2. [AccountWallet](#accountwallet)
3. [AccountTransaction](#accounttransaction)
4. [AccountLoginHistory](#accountloginhistory)
5. [AccountActivityLog](#accountactivitylog)
6. [Arquitectura General](#arquitectura-general)

---

## 👤 Usuario

**Archivo:** `src/models/Usuario.js`

**Descripción:**  
Clase principal que representa un usuario registrado en la plataforma CartoLMM. Gestiona la información del usuario, sus wallets vinculadas y su estado de activación en la blockchain.

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | ID único del usuario (OAuth UID) |
| `provider` | `string` | Proveedor de autenticación (google, github, etc.) |
| `nombre` | `string` | Nombre completo del usuario |
| `email` | `string` | Correo electrónico |
| `localizacion` | `Object` | Ubicación geográfica `{ direccion, lat, lng }` |
| `categorias` | `string[]` | Categorías: `["bodega"]`, `["wine_lover"]`, etc. |
| `wallets` | `AccountWallet[]` | Array de wallets vinculadas |
| `blockchainActive` | `boolean` | Estado de activación en blockchain |
| `registrado` | `boolean` | Estado de registro completo |
| `fechaRegistro` | `Date` | Fecha de registro en la plataforma |

**Métodos:**

- `agregarWallet(wallet)` - Agrega una wallet al usuario
- `activarEnBlockchain()` - Activa el usuario en la blockchain
- `obtenerTransacciones(transaccionesGlobales)` - Filtra transacciones relacionadas con el usuario

**Ejemplo de uso:**

```javascript
import { Usuario } from './models/index.js';

const usuario = new Usuario({
  id: 'oauth_123456',
  provider: 'google',
  nombre: 'Juan Pérez',
  email: 'juan@ejemplo.com',
  localizacion: { direccion: 'Madrid', lat: 40.4168, lng: -3.7038 },
  categorias: ['bodega'],
  wallets: []
});

usuario.activarEnBlockchain();
```

---

## 💳 AccountWallet

**Archivo:** `src/models/AccountWallet.js`

**Descripción:**  
Representa una wallet blockchain **vinculada a un usuario**. NO es la wallet blockchain real (esa está en magnumsmaster), solo almacena metadata de la vinculación.

**⚠️ Diferencia clave:**  
- **AccountWallet** (CartoLMM): Registro de vinculación usuario-wallet
- **Wallet** (magnumsmaster): Wallet blockchain con claves criptográficas

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | UUID de la vinculación |
| `publicKey` | `string` | Clave pública de la wallet blockchain |
| `status` | `string` | Estado: `"active"` o `"inactive"` |
| `usuarioId` | `string` | ID del usuario propietario |
| `fechaVinculacion` | `Date` | Fecha de vinculación |

**Métodos:**

- `activar()` - Activa la wallet para uso en transacciones
- `desactivar()` - Desactiva la wallet

**Ejemplo de uso:**

```javascript
import { AccountWallet } from './models/index.js';

const wallet = new AccountWallet({
  id: 'uuid-1234',
  publicKey: '04abc123def456...',
  status: 'inactive',
  usuarioId: 'oauth_123456'
});

wallet.activar();
console.log(wallet.status); // "active"
```

---

## 🔄 AccountTransaction

**Archivo:** `src/models/AccountTransaction.js`

**Descripción:**  
Representa una transacción **registrada en la aplicación**. Referencia a transacciones blockchain, pero no es la transacción blockchain real. Almacena metadata y relación con usuarios.

**⚠️ Diferencia clave:**  
- **AccountTransaction** (CartoLMM): Registro de transacción con metadata de aplicación
- **Transaction** (magnumsmaster): Transacción blockchain real con firma criptográfica

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | Hash o ID único (referencia a TX blockchain) |
| `fromWallet` | `AccountWallet\|string` | Wallet origen (objeto o publicKey) |
| `toWallet` | `AccountWallet\|string` | Wallet destino (objeto o publicKey) |
| `tipo` | `string` | Tipo: `"compra"`, `"transferencia"`, `"custodia"`, etc. |
| `fecha` | `Date` | Fecha de la transacción |
| `firma` | `string` | Firma criptográfica |
| `datosExtra` | `Object` | Metadata adicional (vino, botellas, denominación) |

**Ejemplo de uso:**

```javascript
import { AccountTransaction } from './models/index.js';

const transaccion = new AccountTransaction({
  id: 'tx_hash_abc123',
  fromWallet: '04abc123...',
  toWallet: '04def456...',
  tipo: 'compra',
  fecha: new Date(),
  firma: 'signature_xyz',
  datosExtra: {
    vino: 'Ribera del Duero Reserva 2020',
    botellas: 12,
    denominacion: 'D.O. Ribera del Duero'
  }
});
```

---

## 🔐 AccountLoginHistory

**Archivo:** `src/models/AccountLoginHistory.js`

**Descripción:**  
Registro de historial de logins de usuarios. Auditoría de accesos a la plataforma.

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | ID único del registro |
| `usuarioId` | `string` | ID del usuario que inició sesión |
| `fechaHora` | `Date` | Fecha y hora del login |
| `ip` | `string` | Dirección IP del acceso |

**Ejemplo de uso:**

```javascript
import { AccountLoginHistory } from './models/index.js';

const loginLog = new AccountLoginHistory({
  id: 'log_001',
  usuarioId: 'oauth_123456',
  fechaHora: new Date(),
  ip: '192.168.1.100'
});
```

---

## 📝 AccountActivityLog

**Archivo:** `src/models/AccountActivityLog.js`

**Descripción:**  
Log de actividades del usuario en la plataforma. Registro de acciones para auditoría.

**Propiedades:**

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `id` | `string` | ID único del log |
| `usuarioId` | `string` | ID del usuario que realizó la acción |
| `accion` | `string` | Descripción de la acción |
| `fechaHora` | `Date` | Fecha y hora de la acción |

**Tipos de acciones comunes:**
- `"registro"` - Usuario se registró
- `"vinculacion_wallet"` - Vinculó una wallet
- `"transaccion"` - Realizó una transacción
- `"actualizacion_perfil"` - Actualizó su perfil
- `"cambio_status_wallet"` - Activó/desactivó wallet

**Ejemplo de uso:**

```javascript
import { AccountActivityLog } from './models/index.js';

const activityLog = new AccountActivityLog({
  id: 'activity_001',
  usuarioId: 'oauth_123456',
  accion: 'vinculacion_wallet',
  fechaHora: new Date()
});
```

---

## 🏗️ Arquitectura General

### Separación de Responsabilidades

```
┌─────────────────────────────────────────────────────┐
│              CartoLMM (Frontend App)                │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Usuario                                     │  │
│  │  ├─ AccountWallet (metadata)                │  │
│  │  ├─ AccountTransaction (registro)           │  │
│  │  ├─ AccountLoginHistory                     │  │
│  │  └─ AccountActivityLog                      │  │
│  └─────────────────────────────────────────────┘  │
│                     ↓ referencia                   │
│              (publicKey, txHash)                   │
│                     ↓                              │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│           magnumsmaster (Blockchain Core)          │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  Wallet (criptográfica real)                │  │
│  │  ├─ keyPair (claves públicas/privadas)     │  │
│  │  ├─ sign() - Firma transacciones           │  │
│  │  └─ calculateBalance() - Balance UTXO      │  │
│  │                                             │  │
│  │  Transaction (blockchain real)              │  │
│  │  ├─ inputs/outputs (UTXO)                  │  │
│  │  ├─ signature                               │  │
│  │  └─ verifyTransaction()                    │  │
│  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Nomenclatura: ¿Por qué `Account*`?

Para evitar colisiones de nombres con las clases blockchain:

| CartoLMM (App) | magnumsmaster (Blockchain) |
|----------------|----------------------------|
| `AccountWallet` | `Wallet` |
| `AccountTransaction` | `Transaction` |

### Importación

**Opción 1: Barrel export (recomendado)**
```javascript
import { Usuario, AccountWallet, AccountTransaction } from './models/index.js';
```

**Opción 2: Import directo**
```javascript
import { Usuario } from './models/Usuario.js';
import { AccountWallet } from './models/AccountWallet.js';
```

### Estructura de Archivos

```
CartoLMM/src/models/
├── Usuario.js                    # Clase principal de usuario
├── AccountWallet.js              # Wallet vinculada
├── AccountTransaction.js         # Transacción de aplicación
├── AccountLoginHistory.js        # Historial de logins
├── AccountActivityLog.js         # Log de actividades
└── index.js                      # Barrel export
```

---

## 🔗 Relaciones entre Clases

```
Usuario (1) ──┬──> (N) AccountWallet
              │
              └──> (N) AccountTransaction (filtradas por wallets)
              │
              └──> (N) AccountLoginHistory
              │
              └──> (N) AccountActivityLog

AccountWallet (1) ──> (N) AccountTransaction (como origen o destino)
```

---

## ✅ Buenas Prácticas

1. **No mezclar clases de aplicación con blockchain**
   - Mantén `Account*` en CartoLMM
   - Mantén `Wallet`, `Transaction` en magnumsmaster

2. **Usa referencias, no duplicaciones**
   - `AccountWallet.publicKey` → referencia a `Wallet.publicKey` blockchain
   - `AccountTransaction.id` → referencia a `Transaction.id` blockchain

3. **Validación antes de operaciones blockchain**
   - Verifica `AccountWallet.status === "active"` antes de transacciones
   - Verifica `Usuario.blockchainActive === true` antes de operaciones

4. **Auditoría completa**
   - Usa `AccountLoginHistory` para seguridad
   - Usa `AccountActivityLog` para trazabilidad de acciones

---

## 📚 Recursos Adicionales

- [JSDoc Documentation](https://jsdoc.app/)
- [Blockchain Wallet Class](../magnumsmaster/wallet/wallet.js)
- [Transaction Class](../magnumsmaster/wallet/transactions.js)

---

**Última actualización:** 13 de noviembre de 2025