# 🛠️ Servir Frontend de Vite con Express en Producción

## Contexto

En el stack CartoLMM (Express + Vite), es necesario que el servidor Express sirva correctamente los archivos estáticos generados por Vite (carpeta `dist`) para que el frontend funcione en producción y todas las rutas del SPA respondan correctamente.

## Problema detectado

Por defecto, el servidor solo servía archivos desde `/public` y `/src`, y la ruta `/` devolvía `public/index.html`. Esto impedía que el frontend generado por Vite (`dist/index.html` y assets) se sirviera correctamente tras el build de producción.

## Solución aplicada

Se añadió en `server.js`:

```js
// Servir archivos estáticos de Vite (dist) en producción
app.use(express.static(path.join(__dirname, 'dist')));

// (Opcional) Servir también public y src si necesitas acceso directo a esos recursos
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// Para cualquier ruta no API, servir index.html de dist (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
```

Esto asegura que:
- El frontend de Vite se sirve correctamente en producción.
- Todas las rutas del SPA funcionan (soporte para history mode de routers modernos).
- Los recursos legacy de `/public` y `/src` siguen accesibles si es necesario.

## Comandos recomendados para deploy en Seenode

- **Build command:**
  ```bash
  npm ci && npm run build
  ```
- **Start command:**
  ```bash
  node server.js
  ```


## Variables de entorno y configuración en Seenode

- **PORT:** Puedes definir `PORT=3000` o `PORT=80` en las variables de entorno, pero Seenode asignará el puerto real y tu app lo usará automáticamente gracias a `process.env.PORT`. El valor solo se usará si Seenode no lo define.
- **NODE_ENV:**
  - Durante el build, asegúrate de que se instalan las devDependencies (como Vite). Si Seenode usa las mismas variables para build y start, usa el comando:
    ```bash
    npm ci --include=dev && npm run build
    ```
    Esto forzará la instalación de devDependencies aunque `NODE_ENV=production` esté activa.
  - Durante el start, sí debe estar `NODE_ENV=production` para que tu app corra en modo producción.
- **BLOCKCHAIN_API_URL:** Define la URL de tu backend blockchain según el entorno.

## Ejemplo de variables en Seenode

```
BLOCKCHAIN_API_URL=https://app.blockswine.com
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
```

## Resultado

Con esta configuración y los comandos recomendados, el build y el despliegue en Seenode funcionan correctamente, sirviendo el frontend de Vite y el backend Express desde el mismo servidor.

---

Esta configuración es la recomendada para proyectos Node.js/Express que usan Vite como builder de frontend y requieren servir el frontend y backend desde el mismo servidor en producción.
