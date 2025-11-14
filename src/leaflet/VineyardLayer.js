// NOTA: Si en el futuro se usan iconos emoji para viñedos (en vez de polígonos),
// basta con crear los marcadores usando la clase 'vineyard-marker' y el CSS con
// font-size y transform: scale(var(--marker-scale, 1)) para que respondan al zoom.
// VineyardLayer.js
// Capa Leaflet para mostrar zonas landuse=vineyard usando Overpass API


// Usar L global proporcionado por el CDN de Leaflet
// Usar osmtogeojson global proporcionado por el CDN

export class VineyardLayer {
  constructor(map) {
    this.map = map;
    this.layer = L.geoJSON(null, {
      style: {
        color: '#7D5A3A',
        weight: 1,
        fillColor: '#B6D957',
        fillOpacity: 0.5
      }
    });
    this.visible = false;

    // Enganchar eventos para cargar/limpiar viñedos al activar/desactivar la capa
    this.layer.on('add', () => {
      this.show();
    });
    this.layer.on('remove', () => {
      this.hide();
    });
  }

  async fetchVineyards(bounds) {
    // Construir el bounding box para la consulta
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    const query = `
      [out:json][timeout:25];
      (
        way["landuse"="vineyard"](${bbox});
        relation["landuse"="vineyard"](${bbox});
      );
      out body;
      >;
      out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    const data = await response.json();
    return osmtogeojson(data);
  }

  async show() {
    if (!this.map) return;
    const bounds = this.map.getBounds();
    // Limpiar capa anterior
    this.layer.clearLayers();
    // Mostrar loader opcional
    if (window.showLoader) window.showLoader('Cargando viñedos...');
    try {
      const geojson = await this.fetchVineyards(bounds);
      this.layer.addData(geojson);
      this.layer.addTo(this.map);
      this.visible = true;
    } catch (e) {
      console.error('Error cargando viñedos:', e);
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

// Necesitas incluir osmtogeojson en tu proyecto para convertir OSM JSON a GeoJSON
// Puedes añadirlo como script externo o instalarlo por npm si usas bundler
