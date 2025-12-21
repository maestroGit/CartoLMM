/**
 * 🔗 MagnusmasterAPI - Cliente de integración con magnumsmaster blockchain
 * 
 * Este módulo maneja toda la comunicación entre CartoLMM y magnumsmaster,
 * proporcionando datos blockchain en tiempo real para visualización geográfica.
 */

import fetch from 'node-fetch';
import { config } from '../config/config.js';

class MagnusmasterAPI {
  constructor(baseURL = config.blockchainApiUrl) {
    this.baseURL = baseURL;
    this.isConnected = false;
    this.lastError = null;
    this.retryAttempts = 3;
    this.retryDelay = 4000; // 4 segundos entre reintentos para mayor estabilidad
    this.cache = new Map();
    this.inflight = new Map();
    console.log(`🌐 MagnusmasterAPI: Usando baseURL para magnumsmaster: ${this.baseURL}`);
  }

  getCacheEntry(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry;
  }

  setCacheEntry(key, value, ttlMs) {
    if (!ttlMs || ttlMs <= 0) return;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  buildRequestKey(endpoint, fetchOptions) {
    const method = (fetchOptions?.method || 'GET').toUpperCase();
    const body = fetchOptions?.body ? String(fetchOptions.body) : '';
    return `${method} ${endpoint} ${body}`;
  }

  parseRetryAfterMs(response) {
    const header = response?.headers?.get?.('retry-after');
    if (!header) return null;
    const trimmed = String(header).trim();
    if (!trimmed) return null;
    // retry-after puede ser segundos o una fecha HTTP.
    const seconds = Number(trimmed);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const when = Date.parse(trimmed);
    if (Number.isFinite(when)) return Math.max(0, when - Date.now());
    return null;
  }

  async sleep(ms) {
    if (!ms || ms <= 0) return;
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 🏥 Verificar salud de la conexión con magnumsmaster
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/system-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 5000
      });

      if (response.ok) {
        this.isConnected = true;
        this.lastError = null;
        const data = await response.json();
        console.log('✅ Conexión con magnumsmaster establecida:', data);
        return { connected: true, data };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      this.isConnected = false;
      this.lastError = error.message;
      console.error('❌ Error conectando con magnumsmaster:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * 🔄 Método genérico para hacer peticiones con retry
   */
  async makeRequest(endpoint, options = {}) {
    const {
      retries = this.retryAttempts,
      cacheTtlMs = 0,
      cacheKey,
      allowStaleOnError = true,
      ...fetchOptions
    } = options;

    const requestKey = cacheKey || this.buildRequestKey(endpoint, fetchOptions);
    const cacheEntry = this.getCacheEntry(requestKey);
    const hasFreshCache = cacheEntry && cacheEntry.expiresAt > Date.now();
    const staleValue = cacheEntry ? cacheEntry.value : null;

    if (hasFreshCache) {
      return { ...cacheEntry.value, cache: { hit: true, stale: false } };
    }

    // Deduplicación: si ya hay una request idéntica en vuelo, reutilizarla.
    if (this.inflight.has(requestKey)) {
      return await this.inflight.get(requestKey);
    }

    const runner = (async () => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await fetch(`${this.baseURL}${endpoint}`, {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            ...fetchOptions
          });

          if (!response.ok) {
            // Caso especial: 429 (rate limit)
            if (response.status === 429) {
              const retryAfterMs = this.parseRetryAfterMs(response);
              const errorMsg = `HTTP 429: Too Many Requests`;

              // Si hay cache (aunque esté caducada), devolverla en vez de insistir.
              if (allowStaleOnError && staleValue) {
                return { ...staleValue, cache: { hit: true, stale: true }, warning: errorMsg };
              }

              // Reintentar sólo si el servidor da Retry-After; si no, no insistimos.
              if (attempt < retries && retryAfterMs != null && retryAfterMs > 0) {
                await this.sleep(retryAfterMs);
                continue;
              }

              throw new Error(errorMsg);
            }

            const text = await response.text().catch(() => '');
            const suffix = text ? ` - ${text.slice(0, 200)}` : '';
            throw new Error(`HTTP ${response.status}: ${response.statusText}${suffix}`);
          }

          const rawText = await response.text();
          let data;
          try {
            data = rawText ? JSON.parse(rawText) : null;
          } catch {
            // Si el backend devuelve algo no-JSON, propagar un error claro.
            throw new Error(`Respuesta no JSON desde ${endpoint}`);
          }

          const result = { success: true, data, timestamp: new Date().toISOString() };
          this.setCacheEntry(requestKey, result, cacheTtlMs);
          return result;

        } catch (error) {
          console.warn(`🔄 Intento ${attempt}/${retries} falló para ${endpoint}:`, error.message);

          if (attempt === retries) {
            // Último intento: si hay cache caducada y se permite, usarla.
            if (allowStaleOnError && staleValue) {
              return { ...staleValue, cache: { hit: true, stale: true }, warning: error.message };
            }

            return {
              success: false,
              error: error.message,
              endpoint,
              timestamp: new Date().toISOString()
            };
          }

          // Esperar antes del siguiente intento
          await this.sleep(this.retryDelay * attempt);
        }
      }
    })();

    this.inflight.set(requestKey, runner);
    try {
      return await runner;
    } finally {
      this.inflight.delete(requestKey);
    }
  }

  /**
   * ⛓️ Obtener información de la blockchain
   */
    async getBlocks() {
      const response = await this.makeRequest('/blocks', { cacheTtlMs: 30000 });
      console.log('[MagnusmasterAPI] Respuesta de /blocks:', response);
      return response;
    }

  /**
   * 🏊‍♂️ Obtener pool de transacciones
   */
    async getTransactionsPool() {
      const response = await this.makeRequest('/transactionsPool', { cacheTtlMs: 10000 });
      console.log('[MagnusmasterAPI] Respuesta de /transactionsPool:', response);
      return response;
    }

  /**
   * 💰 Obtener balance de una dirección específica
   */
  async getAddressBalance(address) {
    const cacheKey = `POST /address-balance ${String(address || '').trim()}`;
    return await this.makeRequest('/address-balance', {
      method: 'POST',
      body: JSON.stringify({ address }),
      cacheTtlMs: 60000,
      cacheKey
    });
  }

  /**
   * 🏦 Obtener UTXOs de una dirección
   */
  async getUTXOBalance(address) {
    return await this.makeRequest(`/utxo-balance/${address}`);
  }

  /**
   * 💳 Obtener balance de la wallet principal
   */
  async getWalletBalance() {
    return await this.makeRequest('/balance', { cacheTtlMs: 30000 });
  }

  /**
   * 🔑 Obtener clave pública del nodo
   */
  async getPublicKey() {
    return await this.makeRequest('/public-key');
  }

  /**
   * 📊 Obtener información del sistema
   */
  async getSystemInfo() {
    return await this.makeRequest('/system-info', { cacheTtlMs: 30000 });
  }

  /**
   * 🔍 Verificar proof QR
   */
  async verifyQRProof(qrData) {
    return await this.makeRequest('/verify-qr-proof', {
      method: 'POST',
      body: JSON.stringify({ qrData })
    });
  }

  /**
   * 📈 Obtener métricas para dashboard
   */
  async getDashboardMetrics() {
    try {
      const [blocks, transactions, systemInfo, balance] = await Promise.allSettled([
        this.getBlocks(),
        this.getTransactionsPool(),
        this.getSystemInfo(),
        this.getWalletBalance()
      ]);

      return {
        success: true,
        metrics: {
          blocks: blocks.status === 'fulfilled' ? blocks.value : null,
          transactions: transactions.status === 'fulfilled' ? transactions.value : null,
          systemInfo: systemInfo.status === 'fulfilled' ? systemInfo.value : null,
          balance: balance.status === 'fulfilled' ? balance.value : null,
          connectionStatus: this.isConnected,
          lastUpdate: new Date().toISOString()
        },
        errors: [blocks, transactions, systemInfo, balance]
          .filter(result => result.status === 'rejected')
          .map(result => result.reason?.message || 'Unknown error')
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 📍 Simular datos geográficos (para integración con mapas)
   * En una implementación real, esto vendría de la blockchain
   */
  async getGeographicData() {
    const systemData = await this.getSystemInfo();
    
    if (!systemData.success) {
      return systemData;
    }

    // Simular datos geográficos basados en info del sistema
    const mockGeoData = {
      nodes: [
        {
          id: 'node-1',
          name: 'Nodo Principal',
          lat: 40.4168,
          lng: -3.7038,
          city: 'Madrid',
          status: this.isConnected ? 'online' : 'offline',
          lastSeen: new Date().toISOString()
        }
      ],
      transactions: [],
      coverage: 'Spain'
    };

    return {
      success: true,
      data: mockGeoData,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🔄 Inicializar conexión y verificar estado
   */
  async initialize() {
    console.log('🚀 Inicializando conexión con magnumsmaster...');
    const health = await this.checkHealth();
    
    if (health.connected) {
      console.log('✅ MagnusmasterAPI inicializado correctamente');
      return true;
    } else {
      console.error('❌ No se pudo conectar con magnumsmaster:', health.error);
      return false;
    }
  }

  /**
   * 📊 Obtener estado de conexión
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      baseURL: this.baseURL,
      lastError: this.lastError,
      timestamp: new Date().toISOString()
    };
  }

    /**
   * Obtener peers/nodos activos desde /system-info
   */
  async getPeers() {
    try {
      const response = await this.makeRequest('/system-info');
      if (
        response.success &&
        response.data &&
        response.data.blockchain &&
        response.data.blockchain.network
      ) {
        const peersDetail = response.data.blockchain.network.p2pPeers || [];
        const p2pConnections = response.data.blockchain.network.p2pConnections || 0;
        return {
          success: true,
          peers: peersDetail,
          count: peersDetail.length,
          activeConnections: p2pConnections,
          timestamp: response.timestamp || new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Estructura inesperada en /system-info',
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 🌐 Consultar información de un peer específico
   * @param {string} peerUrl - URL HTTP del peer (ej: http://localhost:3002)
   * @param {number} timeout - Timeout en ms (default: 5000)
   * @returns {Promise<Object>} - Info del peer o error
   */
  async getPeerInfo(peerUrl, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${peerUrl}/system-info`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        url: peerUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.name === 'AbortError' ? 'Request timeout' : error.message,
        url: peerUrl,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 🔍 Ping a un peer (verificar disponibilidad rápida)
   * @param {string} peerUrl - URL HTTP del peer
   * @returns {Promise<Object>} - Status y tiempo de respuesta
   */
  async pingPeer(peerUrl) {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${peerUrl}/system-info`, {
        method: 'HEAD', // Solo headers, más rápido
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        online: response.ok,
        responseTime: responseTime,
        status: response.status,
        url: peerUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        online: false,
        responseTime: Date.now() - startTime,
        error: error.message,
        url: peerUrl,
        timestamp: new Date().toISOString()
      };
    }
  }
  
}

// Exportar para uso en Node.js y navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagnusmasterAPI;
} else if (typeof window !== 'undefined') {
  window.MagnusmasterAPI = MagnusmasterAPI;
}



export default MagnusmasterAPI;