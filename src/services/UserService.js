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
      console.log("📥 Cargando usuarios desde /data/users.json...");
      
      const response = await fetch('/public/data/users.json');
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      this.users = data;

      console.log(`✅ ${this.users.length} usuarios cargados`);
      return this.users;

    } catch (error) {
      console.error("❌ Error cargando usuarios:", error);
      this.users = [];
      return [];
    }
  }

  renderUsersOnMap(users = this.users) {
    if (!this.map) {
      console.error("❌ Mapa no inicializado en userService");
      return;
    }

    console.log(`🗺️ Renderizando ${users.length} usuarios en el mapa...`);

    // Limpiar marcadores existentes
    this.clearMarkers();

    // Crear marcador para cada usuario
    users.forEach(user => {
      try {
        const marker = new window.UserMarker(user, this.map);
        this.userMarkers.set(user.id, marker);
      } catch (error) {
        console.error(`❌ Error creando marcador para ${user.nombre}:`, error);
      }
    });

    console.log(`✅ ${this.userMarkers.size} usuarios renderizados`);
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