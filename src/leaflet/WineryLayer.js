// WineryLayer.js (Leaflet Skill: leaflet-maps)
export class WineryLayer {
  constructor(map) {
    this.map = map;
    this.layer = L.layerGroup();
    this.visible = false;
    // Hooks de ciclo de vida
    this.layer.on('add', () => this.show());
    this.layer.on('remove', () => this.hide());
  }

  // Query robusta: node/way amenity=winery, building=winery, craft=winery, industrial=winery
  async fetchWineries(bounds) {
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"~"winery|cellar"](${bbox});
        way["amenity"~"winery|cellar"](${bbox});
        node["building"="winery"](${bbox});
        way["building"="winery"](${bbox});
        node["craft"="winery"](${bbox});
        way["craft"="winery"](${bbox});
        node["industrial"="winery"](${bbox});
        way["industrial"="winery"](${bbox});
      );
      out center;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error en Overpass API');
    return await response.json();
  }

  async show() {
    if (!this.map) return;
    // Optimización: solo cargar si zoom > 12
    if (this.map.getZoom() < 12) {
      if (window.hideLoader) window.hideLoader();
      console.warn('Zoom demasiado bajo para cargar bodegas');
      return;
    }
    const bounds = this.map.getBounds();
    this.layer.clearLayers();
    if (window.showLoader) window.showLoader('Buscando bodegas oficiales...');
    try {
      const data = await this.fetchWineries(bounds);
      (data.elements || []).forEach(el => {
        // Overpass 'out center' nos da lat/lon incluso para polígonos (ways)
        const lat = el.lat || (el.center && el.center.lat);
        const lon = el.lon || (el.center && el.center.lon);
        if (lat && lon) {
          const tags = el.tags || {};
          const name = tags.name || 'Bodega sin nombre';
          const website = tags.website ? `<br><a href="${tags.website}" target="_blank" rel="noopener">🌐 Web oficial</a>` : '';
          // Icono personalizado 🍷
          const marker = L.marker([lat, lon], {
            icon: L.divIcon({
              className: 'winery-marker',
              html: '<span class="winery-marker">🍷</span>',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          });
          // Popup estilizado + integración blockchain
          marker.bindPopup(`
            <div class="winery-popup">
              <strong style="color: #722f37; font-size: 1.1em;">${name}</strong>
              <p style="margin: 5px 0; font-size: 0.9em;">📍 Fuente: OpenStreetMap${website}</p>
              <hr>
              <button class="btn-blockchain" onclick="window.verifyWinery && window.verifyWinery('${name.replace(/'/g, "\\'")}')">
                Verificar en Blockchain
              </button>
            </div>
          `, { className: 'peer-leaflet-popup' });
          this.layer.addLayer(marker);
        }
      });
      this.layer.addTo(this.map);
      this.visible = true;
    } catch (e) {
      console.error('Error en WineryLayer:', e);
    } finally {
      if (window.hideLoader) window.hideLoader();
    }
  }

  hide() {
    this.visible = false;
    this.layer.clearLayers();
  }
}
