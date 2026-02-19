/**
 * userService.js
 * Servicio para gestión de usuarios registrados en el mapa
 */

class UserService {
  constructor() {
    this.users = [];
    this.userMarkers = new Map();
    this.map = null;
    this.userLayer = null;
  }

  initialize(map) {
    this.map = map;
    console.log("✅ UserService inicializado");
  }

  async loadUsers() {
    try {
      console.log("📥 Cargando usuarios desde API /api/users?includeWallets=true...");
      
      const response = await fetch('/api/users?includeWallets=true');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const responseData = await response.json();
      
      // La API devuelve { success, data, source, timestamp }
      // Extraer el array de usuarios
      this.users = responseData.data || responseData;

      console.log(`✅ ${this.users.length} usuarios cargados desde ${responseData.source || 'API'}`);
      return this.users;

    } catch (error) {
      console.error("❌ Error cargando usuarios desde API:", error);
      console.warn("⚠️ Intentando fallback a datos locales...");
      
      try {
        // Fallback a archivo local si API falla
        const response = await fetch('/public/data/users.json');
        if (response.ok) {
          const data = await response.json();
          this.users = data;
          console.log(`⚠️ ${this.users.length} usuarios cargados desde fallback (JSON local)`);
          return this.users;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback también falló:", fallbackError);
      }
      
      this.users = [];
      return [];
    }
  }

  async renderUsersOnMap(users = this.users) {
    if (!this.map) {
      console.error("❌ Mapa no inicializado en userService");
      return;
    }

    const userMarkerReady = await this.ensureUserMarker();
    if (!userMarkerReady) {
      console.warn("⚠️  UserMarker no disponible, se omite renderizado de usuarios");
      return;
    }

    const normalizedUsers = users.map((user) => this.normalizeUserLocation(user));

    console.log(`🗺️ Renderizando ${normalizedUsers.length} usuarios en el mapa...`);

    // Filtrar usuarios que tienen coordenadas válidas
    const usersWithCoords = normalizedUsers.filter(user => {
      const hasCoords = user.localizacion && 
                       typeof user.localizacion.lat !== 'undefined' && 
                       typeof user.localizacion.lng !== 'undefined';
      if (!hasCoords) {
        console.warn(`⚠️  Usuario sin coordenadas: ${user.nombre} (${user.id})`);
      }
      return hasCoords;
    });

    console.log(`📍 ${usersWithCoords.length}/${users.length} usuarios con coordenadas válidas`);

    // Limpiar marcadores existentes
    this.clearMarkers();

    // Crear marcador para cada usuario con coordenadas
    usersWithCoords.forEach(user => {
      try {
        const marker = new window.UserMarker(user, this.map);
        this.userMarkers.set(user.id, marker);
      } catch (error) {
        console.error(`❌ Error creando marcador para ${user.nombre}:`, error);
      }
    });

    console.log(`✅ ${this.userMarkers.size} usuarios renderizados en el mapa`);
  }

  async ensureUserMarker() {
    if (typeof window.UserMarker === 'function') {
      return true;
    }

    try {
      await import('../leaflet/UserMarker.js');
    } catch (error) {
      console.error('❌ Error cargando UserMarker:', error);
      return false;
    }

    if (typeof window.UserMarker !== 'function') {
      console.warn('⚠️  UserMarker no es constructor:', typeof window.UserMarker);
      return false;
    }

    return true;
  }

  normalizeUserLocation(user) {
    if (!user) return user;

    const normalized = { ...user };

    if (!normalized.localizacion) {
      const latValue = normalized.localizacion_lat;
      const lngValue = normalized.localizacion_lng;
      const lat = latValue !== null && typeof latValue !== 'undefined' ? parseFloat(latValue) : null;
      const lng = lngValue !== null && typeof lngValue !== 'undefined' ? parseFloat(lngValue) : null;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        normalized.localizacion = { lat, lng };
      }
    } else {
      const lat = typeof normalized.localizacion.lat === 'string'
        ? parseFloat(normalized.localizacion.lat)
        : normalized.localizacion.lat;
      const lng = typeof normalized.localizacion.lng === 'string'
        ? parseFloat(normalized.localizacion.lng)
        : normalized.localizacion.lng;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        normalized.localizacion = { ...normalized.localizacion, lat, lng };
      }
    }

    return normalized;
  }

  clearMarkers() {
    this.userMarkers.forEach(marker => marker.remove());
    this.userMarkers.clear();
  }

  getUserById(userId) {
    return this.users.find(u => u.id === userId);
  }

  updateUser(userId, newData) {
    const userIndex = this.users.findIndex(u => u.id === userId);
    
    if (userIndex !== -1) {
      this.users[userIndex] = { ...this.users[userIndex], ...newData };
      
      // Actualizar marcador
      const marker = this.userMarkers.get(userId);
      if (marker) {
        marker.updateData(newData);
      }
      
      return true;
    }
    
    return false;
  }

  filterByCategoria(categoria) {
    return this.users.filter(u => u.categorias.includes(categoria));
  }

  filterByBlockchainActive(active = true) {
    return this.users.filter(u => u.blockchainActive === active);
  }

  getStats() {
    const stats = {
      total: this.users.length,
      bodegas: 0,
      wineLovers: 0,
      mineros: 0,
      blockchainActive: 0
    };

    this.users.forEach(user => {
      if (user.categorias.includes('bodega')) stats.bodegas++;
      if (user.categorias.includes('wine_lover')) stats.wineLovers++;
      if (user.categorias.includes('minero')) stats.mineros++;
      if (user.blockchainActive) stats.blockchainActive++;
    });

    return stats;
  }

  showUser(userId) {
    const marker = this.userMarkers.get(userId);
    if (marker) marker.show();
  }

  hideUser(userId) {
    const marker = this.userMarkers.get(userId);
    if (marker) marker.hide();
  }

  toggleCategoria(categoria, show = true) {
    this.users.forEach(user => {
      if (user.categorias.includes(categoria)) {
        const marker = this.userMarkers.get(user.id);
        if (marker) {
          show ? marker.show() : marker.hide();
        }
      }
    });
  }

  focusOnUser(userId) {
    const marker = this.userMarkers.get(userId);
    if (marker) {
      const pos = marker.getPosition();
      if (pos) {
        this.map.setView(pos, 12);
        marker.openPopup();
      }
    }
  }

  searchUsers(query) {
    const lowerQuery = query.toLowerCase();
    return this.users.filter(user => 
      user.nombre.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }
}

// Exponer globalmente
window.UserService = UserService;