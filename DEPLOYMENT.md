# 🚀 Estrategias de Despliegue para CartoLMM

## 📋 Opciones de Producción

### 🎯 **Opción 1: Microservicio Independiente**
```bash
# Despliegue standalone
cd cartografia/
npm ci --only=production
pm2 start server.js --name "cartolmm"
```

### 🐳 **Opción 2: Containerizado**
```dockerfile
# cartografia/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copiar solo deps de cartografia
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

EXPOSE 8080
CMD ["npm", "start"]
```

### ☁️ **Opción 3: Serverless (Vercel/Netlify)**
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**/*",
      "use": "@vercel/static"
    }
  ]
}
```

### 🔄 **Opción 4: CDN + API separada**
```bash
# Frontend estático → CDN
aws s3 sync public/ s3://cartolmm-frontend/

# API backend → Server
pm2 start server.js --env production
```

## 🌐 Configuración Multi-Entorno

### 🧪 **Desarrollo**
```bash
cd cartografia/
npm run dev  # Puerto 8080
```

### 🔬 **Testing**
```bash
cd cartografia/
PORT=8081 npm start
```

### 🚀 **Producción**
```bash
cd cartografia/
NODE_ENV=production PORT=80 npm start
```

## 📊 Ventajas Arquitectónicas

### ✅ **Separación de Responsabilidades**
- `magnumsmaster/` → Core blockchain
- `cartografia/` → Visualización geográfica
- Cada uno con sus propias dependencias

### ✅ **Escalabilidad Independiente**
- Blockchain puede estar en un servidor potente
- CartoLMM puede estar en CDN global
- APIs pueden tener load balancing separado

### ✅ **Mantenimiento Simplificado**
- Updates de frontend sin tocar blockchain
- Testing independiente de cada módulo
- Rollbacks selectivos por componente

## 🔧 Scripts de Despliegue

### 📦 **Build & Deploy**
```bash
#!/bin/bash
# deploy-cartolmm.sh

cd cartografia/

# Install dependencies
npm ci --only=production

# Optional: Build step (if needed)
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### 🔄 **Ecosystem PM2**
```javascript
// cartografia/ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cartolmm',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}
```

## 🌍 Integración con Magnumsmaster

### 🔗 **Comunicación API**
```javascript
// Conectar con blockchain principal
const BLOCKCHAIN_API = process.env.BLOCKCHAIN_URL || 'http://localhost:3001';

// CartoLMM actúa como visualizador
app.get('/api/blockchain/status', async (req, res) => {
  const response = await fetch(`${BLOCKCHAIN_API}/status`);
  res.json(await response.json());
});
```

Esta arquitectura te permite **flexibilidad total** para el futuro! 🚀