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
    this.retryDelay = 1000; // 1 segundo
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
    const { retries = this.retryAttempts, ...fetchOptions } = options;
    
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return { success: true, data, timestamp: new Date().toISOString() };

      } catch (error) {
        console.warn(`🔄 Intento ${attempt}/${retries} falló para ${endpoint}:`, error.message);
        
        if (attempt === retries) {
          return { 
            success: false, 
            error: error.message, 
            endpoint,
            timestamp: new Date().toISOString()
          };
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
  }

  /**
   * ⛓️ Obtener información de la blockchain
   */
  async getBlocks() {
    return await this.makeRequest('/blocks');
  }

  /**
   * 🏊‍♂️ Obtener pool de transacciones
   */
  async getTransactionsPool() {
    return await this.makeRequest('/transactionsPool');
  }

  /**
   * 💰 Obtener balance de una dirección específica
   */
  async getAddressBalance(address) {
    return await this.makeRequest('/address-balance', {
      method: 'POST',
      body: JSON.stringify({ address })
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
    return await this.makeRequest('/balance');
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
    return await this.makeRequest('/system-info');
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
  
}

// Exportar para uso en Node.js y navegador
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MagnusmasterAPI;
} else if (typeof window !== 'undefined') {
  window.MagnusmasterAPI = MagnusmasterAPI;
}



export default MagnusmasterAPI;