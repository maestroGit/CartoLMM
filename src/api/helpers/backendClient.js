/**
 * backendClient.js
 * Cliente HTTP proxy centralizado para comunicación con el backend (magnumslocal / magnumsmaster)
 */

import { config } from '../../config/config.js';

export function getBackendSourceUrl() {
  if (process.env.BACKEND_API_URL) {
    return process.env.BACKEND_API_URL;
  }
  if (process.env.USERS_API_URL) {
    return process.env.USERS_API_URL;
  }
  if (config.nodeEnv === 'production') {
    return config.blockchainApiUrl || config.blockchainLocalUrl || 'https://app.blockswine.com';
  }
  return config.blockchainLocalUrl || config.blockchainApiUrl || 'http://localhost:6001';
}

const CACHE_TTL_DEFAULT = 60000; // 1 minuto
const cacheStore = new Map();

export async function proxyGetRequest(endpointPath, queryParams = {}, options = {}) {
  const { cacheTtl = CACHE_TTL_DEFAULT, cacheKeyPrefix = '' } = options;
  const baseUrl = getBackendSourceUrl();
  const searchParams = new URLSearchParams();

  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      searchParams.append(key, String(val));
    }
  });

  const queryString = searchParams.toString();
  const fullUrl = `${baseUrl}${endpointPath}${queryString ? '?' + queryString : ''}`;
  const cacheKey = `${cacheKeyPrefix}:${fullUrl}`;

  // Verificar caché
  const cached = cacheStore.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTtl) {
    return { ...cached.data, cached: true };
  }

  const response = await fetch(fullUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    signal: AbortSignal.timeout(config.apiTimeout || 10000)
  });

  if (!response.ok) {
    if (response.status === 429 && cached) {
      return { ...cached.data, cached: true, stale: true };
    }
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Backend responded with status ${response.status}: ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  const result = {
    success: true,
    data: data.data || data,
    source: baseUrl,
    timestamp: new Date().toISOString()
  };

  if (cacheTtl > 0) {
    cacheStore.set(cacheKey, { data: result, timestamp: Date.now() });
    if (cacheStore.size > 200) {
      const oldestKey = cacheStore.keys().next().value;
      cacheStore.delete(oldestKey);
    }
  }

  return result;
}
