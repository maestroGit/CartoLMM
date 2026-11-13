/**
 * sanitizer.js
 * Utilidades de sanitización y validación para CartoLMM
 * Prevención de inyecciones, XSS y manipulación de coordenadas geográficas
 */

/**
 * Sanitiza una cadena de texto para evitar XSS básico
 */
export function sanitizeString(input, maxLength = 255) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>&"']/g, (match) => {
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return match;
      }
    });
}

/**
 * Valida y normaliza coordenadas geográficas (latitud, longitud)
 * Devuelve [lat, lng] válidos o null si están fuera de rango o corruptos
 */
export function sanitizeCoordinates(lat, lng) {
  const numLat = Number(lat);
  const numLng = Number(lng);

  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
    return null;
  }

  // Latitud debe estar entre -90 y 90
  if (numLat < -90 || numLat > 90) {
    return null;
  }

  // Longitud debe estar entre -180 y 180
  if (numLng < -180 || numLng > 180) {
    return null;
  }

  return [
    parseFloat(numLat.toFixed(6)),
    parseFloat(numLng.toFixed(6))
  ];
}

/**
 * Valida dirección de blockchain / UTXO
 * Permite formatos hexadecimales estándar o direcciones alfanuméricas base58/bech32 de longitud segura
 */
export function sanitizeBlockchainAddress(address) {
  if (typeof address !== 'string') return null;
  const clean = address.trim();
  // Validar caracteres seguros alfanuméricos y guiones
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(clean)) {
    return null;
  }
  return clean;
}

/**
 * Sanitiza identificador numérico o alfanumérico seguro
 */
export function sanitizeId(id) {
  if (typeof id !== 'string' && typeof id !== 'number') return null;
  const str = String(id).trim();
  if (!/^[a-zA-Z0-9_\-.:]{1,64}$/.test(str)) {
    return null;
  }
  return str;
}
