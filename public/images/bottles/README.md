# 🍾 BlocksWine - Repositorio de Imágenes de Botellas Magnum

Este directorio almacena los assets visuales (PNGs con transparencia) de las botellas Magnum de cada bodega adherida al protocolo BlocksWine.

## Convención de Nombres y Estructura

El sistema **Cascade Asset Resolver** (`public/js/magnumVisual.js`) busca las imágenes en el siguiente orden:

1. **Por ID / Token de Botella:**
   - `public/images/bottles/[id].png` (ejemplo: `magnum-042.png`, `BW-2018-042.png`)
2. **Por Bodega y Vino con Añada:**
   - `public/images/bottles/[slug-bodega]/[slug-vino]-[anada].png`
   - Ejemplo: `public/images/bottles/bodegas-traslascuestas/valcavado-de-traslascuestas-2019.png`
   - Ejemplo: `public/images/bottles/bodegas-fernandez-de-pierola/fernandez-de-pierola-vitium-2018.png`
3. **Por Bodega Genérica:**
   - `public/images/bottles/[slug-bodega].png`
4. **Fallback Maestro:**
   - Si no existe ningún archivo específico, el sistema muestra automáticamente `public/images/bottel-magnum-transparent.png` sin romper la interfaz.

## Especificaciones de Imagen Recomendadas
- **Formato:** PNG con fondo transparente (o WebP con canal alfa).
- **Proporción:** Vertical tipo botella (~1:3 a 1:2.5).
- **Resolución óptima:** 300px × 800px a 72/96 DPI (optimizado para web).
- **Peso:** < 250 KB por imagen para carga ultrarrápida.
