/**
 * userController.js
 * Controlador para consumir datos de usuarios desde magnumsmaster
 * CartoLMM actúa como proxy/agregador de datos
 */

import { config } from '../../config/config.js';

// Caché simple para evitar rate limiting de magnumsmaster
const CACHE_TTL = 60000; // 1 minuto
const cache = new Map();

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('[USER] 📦 Respuesta desde caché');
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Limpiar caché antigua cada 100 entradas
  if (cache.size > 100) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

/**
 * GET /api/users
 * Obtiene lista de usuarios desde magnumsmaster (relay de producción)
 */
export const getUsers = async (req, res) => {
  try {
    const { page, limit, role, provider, kyc_status, subscription_status, badges, search, includeWallets } = req.query;
    
    // Verificar caché primero
    const cacheKey = getCacheKey(req.query);
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Construir query string desde los parámetros
    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page);
    if (limit) queryParams.append('limit', limit);
    if (role) queryParams.append('role', role);
    if (provider) queryParams.append('provider', provider);
    if (kyc_status) queryParams.append('kyc_status', kyc_status);
    if (subscription_status) queryParams.append('subscription_status', subscription_status);
    if (badges) queryParams.append('badges', badges);
    if (search) queryParams.append('search', search);
    if (includeWallets) queryParams.append('includeWallets', includeWallets);

    const magnumsmasterUrl = config.blockchainApiUrl || 'https://app.blockswine.com';
    const endpoint = `${magnumsmasterUrl}/users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    console.log(`[USER] Fetching usuarios desde magnumsmaster: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn(`[USER] magnumsmaster respondió con status ${response.status}`);
      
      // Si es 429 (rate limit), intentar devolver datos antiguos del caché si existen
      if (response.status === 429) {
        const staleData = cache.get(cacheKey);
        if (staleData) {
          console.log('[USER] ⚠️  Rate limit alcanzado, usando caché antigua');
          return res.json({
            ...staleData.data,
            cached: true,
            cacheAge: Date.now() - staleData.timestamp
          });
        }
      }
      
      throw new Error(`magnumsmaster HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[USER] ✅ ${Array.isArray(data.data) ? data.data.length : data.length} usuarios obtenidos`);
    
    const responseData = {
      success: true,
      data: data.data || data,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    };
    
    // Guardar en caché
    setCache(cacheKey, responseData);
    
    res.json(responseData);

  } catch (error) {
    console.error('[USER] ❌ Error obteniendo usuarios:', error.message);
    res.status(503).json({
      success: false,
      error: 'No se pudieron obtener los usuarios',
      details: error.message,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/:id
 * Obtiene un usuario específico desde magnumsmaster (relay de producción)
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeWallets } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro ID es requerido'
      });
    }

    const magnumsmasterUrl = config.blockchainApiUrl || 'https://app.blockswine.com';
    const endpoint = `${magnumsmasterUrl}/users/${id}${includeWallets ? '?includeWallets=true' : ''}`;
    
    console.log(`[USER] Fetching usuario ${id} desde magnumsmaster`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return res.status(404).json({
          success: false,
          error: `Usuario ${id} no encontrado`
        });
      }
      throw new Error(`magnumsmaster HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[USER] ✅ Usuario ${id} obtenido`);
    
    res.json({
      success: true,
      data: data.data || data,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[USER] ❌ Error obteniendo usuario:`, error.message);
    res.status(503).json({
      success: false,
      error: 'No se pudo obtener el usuario',
      details: error.message,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/users/stats
 * Obtiene estadísticas de usuarios desde magnumsmaster (relay de producción)
 */
export const getUserStats = async (req, res) => {
  try {
    const magnumsmasterUrl = config.blockchainApiUrl || 'https://app.blockswine.com';
    const endpoint = `${magnumsmasterUrl}/users/stats`;
    
    console.log(`[USER] Fetching estadísticas desde magnumsmaster`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`magnumsmaster HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`[USER] ✅ Estadísticas obtenidas`);
    
    res.json({
      success: true,
      data: data.data || data,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[USER] ❌ Error obteniendo estadísticas:', error.message);
    res.status(503).json({
      success: false,
      error: 'No se pudieron obtener las estadísticas',
      details: error.message,
      source: 'magnumsmaster',
      timestamp: new Date().toISOString()
    });
  }
};
