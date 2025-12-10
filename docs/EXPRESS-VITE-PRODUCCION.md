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

## Notas
- El puerto debe ser tomado de `process.env.PORT` para compatibilidad con plataformas cloud.
- El build de Vite debe ejecutarse antes del deploy para que la carpeta `dist` esté actualizada.

---

Esta configuración es la recomendada para proyectos Node.js/Express que usan Vite como builder de frontend y requieren servir el frontend y backend desde el mismo servidor en producción.
