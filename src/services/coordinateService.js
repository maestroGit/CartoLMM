/**
 * Servicio para asignar coordenadas geográficas a peers blockchain
 * Soporta GeoIP lookup y coordenadas mock para desarrollo
 */
class CoordinateService {
  constructor() {
    this.cache = new Map();
    this.useMockCoordinates = true; // Cambiar a false para usar GeoIP real
    this.geoIPApiUrl = 'http://ip-api.com/json/';
    
    // Coordenadas por defecto (Madrid)
    this.defaultCoords = { lat: 40.4168, lng: -3.7038, city: 'Madrid' };
    
    // Regiones españolas para distribución mock
    this.mockRegions = [
      { name: 'Madrid', lat: 40.4168, lng: -3.7038 },
      { name: 'Barcelona', lat: 41.3851, lng: 2.1734 },
      { name: 'Valencia', lat: 39.4699, lng: -0.3763 },
      { name: 'Sevilla', lat: 37.3891, lng: -5.9845 },
      { name: 'Bilbao', lat: 43.2630, lng: -2.9350 },
      { name: 'Málaga', lat: 36.7213, lng: -4.4214 },
      { name: 'Zaragoza', lat: 41.6488, lng: -0.8891 },
      { name: 'Murcia', lat: 37.9922, lng: -1.1307 },
      { name: 'Palma', lat: 39.5696, lng: 2.6502 },
      { name: 'Las Palmas', lat: 28.1248, lng: -15.4300 }
    ];
  }

  /**
   * Asigna coordenadas a un array de peers
   * @param {Array} peers - Array de objetos peer
   * @returns {Promise<Array>} Peers enriquecidos con lat/lng/city
   */
  async assignCoordinates(peers) {
    if (!Array.isArray(peers)) {
      console.error('CoordinateService: peers debe ser un array');
      return [];
    }

    if (this.useMockCoordinates) {
      return this.assignMockCoordinates(peers);
    } else {
      return await this.assignGeoIPCoordinates(peers);
    }
  }

  /**
   * Asigna coordenadas mock distribuidas por regiones
   * @param {Array} peers - Array de peers
   * @returns {Array} Peers con coordenadas mock
   */
  assignMockCoordinates(peers) {
    return peers.map((peer, index) => {
      // Nodo local siempre en Madrid
      if (peer.isLocal) {
        return {
          ...peer,
          lat: this.defaultCoords.lat,
          lng: this.defaultCoords.lng,
          city: this.defaultCoords.city
        };
      }

      // Distribuir peers por regiones de forma determinista
      const region = this.mockRegions[index % this.mockRegions.length];
      
      // Añadir pequeño offset aleatorio para separación visual
      const latOffset = (Math.random() - 0.5) * 0.15;
      const lngOffset = (Math.random() - 0.5) * 0.15;
      
      return {
        ...peer,
        lat: region.lat + latOffset,
        lng: region.lng + lngOffset,
        city: region.name
      };
    });
  }

  /**
   * Asigna coordenadas usando GeoIP lookup
   * @param {Array} peers - Array de peers
   * @returns {Promise<Array>} Peers con coordenadas GeoIP
   */
  async assignGeoIPCoordinates(peers) {
    const enrichedPeers = await Promise.all(
      peers.map(async (peer) => {
        // Nodo local usa coordenadas por defecto
        if (peer.isLocal) {
          return {
            ...peer,
            ...this.defaultCoords
          };
        }

        const ip = this.extractIP(peer.httpUrl);
        
        // Verificar cache
        if (this.cache.has(ip)) {
          const cached = this.cache.get(ip);
          return { ...peer, ...cached };
        }

        // GeoIP lookup con fallback
        try {
          const coords = await this.geoIPLookup(ip);
          this.cache.set(ip, coords);
          return { ...peer, ...coords };
        } catch (error) {
          console.warn(`GeoIP failed para ${ip}:`, error.message);
          return { ...peer, ...this.defaultCoords };
        }
      })
    );

    return enrichedPeers;
  }

  /**
   * Extrae IP de una URL
   * @param {string} url - URL del peer (ej: http://192.168.1.100:3001)
   * @returns {string} Dirección IP o hostname
   */
  extractIP(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // localhost o 127.0.0.1 → usar coordenadas por defecto
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return 'localhost';
      }
      
      return hostname;
    } catch (error) {
      console.warn('CoordinateService: Error parseando URL', url);
      return 'localhost';
    }
  }

  /**
   * Realiza lookup GeoIP usando ip-api.com
   * @param {string} ip - Dirección IP
   * @returns {Promise<Object>} Coordenadas {lat, lng, city}
   */
  async geoIPLookup(ip) {
    // IPs locales usan coordenadas por defecto
    if (ip === 'localhost' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return this.defaultCoords;
    }

    const response = await fetch(`${this.geoIPApiUrl}${ip}`);
    
    if (!response.ok) {
      throw new Error(`GeoIP HTTP error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(`GeoIP lookup failed: ${data.message || 'Unknown error'}`);
    }
    
    return {
      lat: data.lat,
      lng: data.lon,
      city: data.city || 'Unknown'
    };
  }

  /**
   * Limpia la cache de coordenadas
   */
  clearCache() {
    this.cache.clear();
    console.log('CoordinateService: Cache limpiada');
  }

  /**
   * Cambia entre modo mock y GeoIP real
   * @param {boolean} useMock - True para usar coordenadas mock
   */
  setMode(useMock) {
    this.useMockCoordinates = useMock;
    console.log(`CoordinateService: Modo ${useMock ? 'MOCK' : 'GeoIP'} activado`);
  }

  /**
   * Obtiene estadísticas de la cache
   * @returns {Object} Información de la cache
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      mode: this.useMockCoordinates ? 'mock' : 'geoip',
      entries: Array.from(this.cache.keys())
    };
  }
}

// Exportar instancia singleton
export default new CoordinateService();
