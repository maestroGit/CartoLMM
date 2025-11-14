// WineryLayer.js
// Capa Leaflet para mostrar bodegas (amenity=winery) como puntos usando Overpass API

export class WineryLayer {
  constructor(map) {
    this.map = map;
    this.layer = L.layerGroup();
    this.visible = false;

    // Enganchar eventos para cargar/limpiar bodegas al activar/desactivar la capa
    this.layer.on('add', () => {
      this.show();
    });
    this.layer.on('remove', () => {
      this.hide();
    });
  }

  async fetchWineries(bounds) {
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="winery"](${bbox});
        node["building"="winery"](${bbox});
        node["building"="celler"](${bbox});
        node["craft"="winery"](${bbox});
      );
      out body;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }

  async show() {
    if (!this.map) return;
    const bounds = this.map.getBounds();
    this.layer.clearLayers();
    if (window.showLoader) window.showLoader('Cargando bodegas...');
    try {
      const data = await this.fetchWineries(bounds);
      if (data.elements && data.elements.length > 0) {
        data.elements.forEach(el => {
          if (el.type === 'node' && el.lat && el.lon) {
            const marker = L.marker([el.lat, el.lon], {
              title: el.tags && el.tags.name ? el.tags.name : 'Bodega',
              icon: L.divIcon({
                className: 'winery-marker',
                html: '🍷',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
            });
            marker.bindPopup(`<strong>${el.tags && el.tags.name ? el.tags.name : 'Bodega'}</strong>`);
            this.layer.addLayer(marker);
          }
        });
      }
      this.layer.addTo(this.map);
      this.visible = true;
    } catch (e) {
      console.error('Error cargando bodegas:', e);
    } finally {
      if (window.hideLoader) window.hideLoader();
    }
  }

  hide() {
    if (this.map && this.visible) {
      this.map.removeLayer(this.layer);
      this.visible = false;
    }
  }
}
