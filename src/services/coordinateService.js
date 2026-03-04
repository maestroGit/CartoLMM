/**
 * Servicio para asignar coordenadas geográficas a peers blockchain
 * Soporta GeoIP lookup y coordenadas mock para desarrollo
 */
class CoordinateService {
  constructor() {
    this.cache = new Map();
    this.useMockCoordinates = false; // GeoIP real por defecto
    this.geoIPApiUrl = 'http://ip-api.com/json/';
    
    // Fallback explícito: sin coordenadas para evitar ubicaciones engañosas
    this.unresolvedLocation = { lat: null, lng: null, city: 'No disponible', locationSource: 'unresolved' };
    
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
    console.log('[CoordinateService] Asignando coordenadas MOCK a peers (visualización, no reales)');
    return peers.map((peer, index) => {
      // Nodo local: mock explícito
      if (peer.isLocal) {
        return {
          ...peer,
          lat: this.mockRegions[0].lat,
          lng: this.mockRegions[0].lng,
          city: this.mockRegions[0].name,
          locationSource: 'mock'
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
        city: region.name,
        locationSource: 'mock'
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
        const ip = peer.isLocal ? 'self' : this.extractIP(peer.httpUrl);

        if (!ip) {
          return {
            ...peer,
            ...this.unresolvedLocation
          };
        }
        
        // Verificar cache
        if (this.cache.has(ip)) {
          const cached = this.cache.get(ip);
          return { ...peer, ...cached };
        }

        // GeoIP lookup con fallback
        try {
          if (!peer.isLocal && this.isPrivateOrLocalHost(ip)) {
            const base = await this.geoIPLookup('self');
            const offset = this.buildDeterministicOffset(`${peer.nodeId || ''}|${peer.httpUrl || ip}`);
            const approxCoords = {
              lat: base.lat + offset.lat,
              lng: base.lng + offset.lng,
              city: `${base.city} (aprox peer privado)`,
              locationSource: 'geoip-private-approx'
            };
            this.cache.set(ip, approxCoords);
            return { ...peer, ...approxCoords };
          }

          const coords = await this.geoIPLookup(ip);
          this.cache.set(ip, coords);
          return { ...peer, ...coords };
        } catch (error) {
          console.warn(`GeoIP failed para ${ip}:`, error.message);
          return { ...peer, ...this.unresolvedLocation };
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
      const hostname = (urlObj.hostname || '').trim().toLowerCase();
      if (!hostname) return null;
      
      return hostname;
    } catch (error) {
      console.warn('CoordinateService: Error parseando URL', url);
      return null;
    }
  }

  isPrivateOrLocalHost(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    const ip = hostname.trim().toLowerCase();
    return (
      ip === 'localhost' ||
      ip === '127.0.0.1' ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
      ip.startsWith('172.20.') || ip.startsWith('172.21.') || ip.startsWith('172.22.') || ip.startsWith('172.23.') ||
      ip.startsWith('172.24.') || ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
      ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') || ip.startsWith('172.31.')
    );
  }

  buildDeterministicOffset(seed) {
    const safeSeed = String(seed || 'peer');
    let hash = 0;
    for (let i = 0; i < safeSeed.length; i += 1) {
      hash = ((hash << 5) - hash) + safeSeed.charCodeAt(i);
      hash |= 0;
    }
    const normalized = Math.abs(hash % 1000) / 1000;
    const lat = (normalized - 0.5) * 0.3;
    const lng = (((normalized * 1.37) % 1) - 0.5) * 0.3;
    return { lat, lng };
  }

  /**
   * Realiza lookup GeoIP usando ip-api.com
   * @param {string} ip - Dirección IP
   * @returns {Promise<Object>} Coordenadas {lat, lng, city}
   */
  async geoIPLookup(ip) {
    // Nodo local: resolver IP pública del host que ejecuta CartoLMM
    if (ip === 'self') {
      const responseSelf = await fetch(this.geoIPApiUrl);
      if (!responseSelf.ok) {
        throw new Error(`GeoIP self HTTP error: ${responseSelf.status}`);
      }
      const dataSelf = await responseSelf.json();
      if (dataSelf.status !== 'success') {
        throw new Error(`GeoIP self lookup failed: ${dataSelf.message || 'Unknown error'}`);
      }
      return {
        lat: dataSelf.lat,
        lng: dataSelf.lon,
        city: dataSelf.city || dataSelf.regionName || 'No disponible',
        locationSource: 'geoip'
      };
    }

    // IP privada/local: no geolocalizable por GeoIP público
    if (this.isPrivateOrLocalHost(ip)) {
      throw new Error('IP privada/local no geolocalizable por GeoIP público');
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
      city: data.city || data.regionName || 'No disponible',
      locationSource: 'geoip'
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
