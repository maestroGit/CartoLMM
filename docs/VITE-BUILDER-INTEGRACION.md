# Integración de Vite y Build en CartoLMM

## Motivo
Se integró Vite en el proyecto CartoLMM para modernizar el proceso de build, mejorar el rendimiento en desarrollo y producción, y facilitar la gestión de módulos y assets estáticos.

## Pasos realizados

1. **Instalación de Vite**
   - Se instaló Vite como dependencia de desarrollo:
     ```bash
     npm install --save-dev vite
     ```

2. **Creación y configuración de `vite.config.js`**
   - Se creó el archivo `vite.config.js` en la raíz del proyecto con la siguiente configuración:
     ```js
     import { defineConfig } from 'vite';
     import path from 'path';
     export default defineConfig({
       root: 'public',
       build: {
         outDir: '../dist',
         rollupOptions: {
           input: path.resolve(__dirname, 'public/index.html'),
         },
       },
       server: {
         port: 5173,
         open: true,
       },
     });
     ```

3. **Actualización de scripts en `package.json`**
   - Se modificaron los scripts para incluir los comandos de Vite:
     ```json
     "build": "vite build",
     "preview": "vite preview",
     "vite:dev": "vite"
     ```

4. **Corrección de los scripts en `index.html`**
   - Se añadió `type="module"` a los scripts locales para que Vite los procese correctamente:
     ```html
     <script type="module" src="CartoLMMWebSocket.js"></script>
     <script type="module" src="app.js"></script>
     <script type="module" src="wallet-utxo.js"></script>
     <script type="module" src="peersMetrics.js"></script>
     <script type="module" src="zoom-image.js"></script>
     ```

5. **Ejecución del build y preview local**
   - Para generar la versión de producción:
     ```bash
     npm run build
     ```
   - Para visualizar el resultado en un servidor local:
     ```bash
     npm run preview
     ```
   - El preview se sirve normalmente en `http://localhost:4173`.

## Ficheros creados o modificados
- `vite.config.js` (nuevo)
- `package.json` (modificado)
- `public/index.html` (modificado)

---

Esta solución permite un flujo de desarrollo y despliegue moderno y eficiente usando Vite como builder principal.

es necesario hacer un rebuild con Vite antes de hacer el commit para deploy. Esto asegura que los archivos generados en dist incluyan la configuración y las variables de entorno actualizadas (como la URL de magnumsmaster).

El comando recomendado es:
 ```bash
npm run build
 ```