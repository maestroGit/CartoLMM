/**
 * VineyardLayer.js
 * Capa Leaflet optimizada para parcelas de viñedo y terruño BlocksWine
 * Integra caché local de parcelas históricas (Moreda de Álava / Priorat)
 * y consulta dinámica protegida contra rate-limit (Overpass API con umbral de zoom >= 13)
 */

// Parcelas históricas de referencia de BlocksWine para visualización inmediata y offline-first
const HISTORICAL_PARCELS_BLOCKSWINE = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'Parcela La Loma - Moreda de Álava (D.O.Ca. Rioja Alavesa)',
        terroir: 'Arcilloso-calcáreo con ladera sur 580m',
        variety: 'Tempranillo & Graciano',
        custodyStatus: 'Custodia Activa Magnum BlocksWine',
        historicRank: 'Viñedo Singular'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-2.4150, 42.5280],
          [-2.4080, 42.5310],
          [-2.4020, 42.5270],
          [-2.4060, 42.5230],
          [-2.4150, 42.5280]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Costers de Gratallops (D.O.Q. Priorat)',
        terroir: 'Llicorella (pizarra negra silícea en pendientes 40%)',
        variety: 'Garnacha Tinta & Cariñena',
        custodyStatus: 'Custodia Activa Magnum BlocksWine',
        historicRank: 'Vinya Classificada'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [0.7720, 41.1890],
          [0.7810, 41.1920],
          [0.7860, 41.1840],
          [0.7780, 41.1810],
          [0.7720, 41.1890]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: {
        name: 'Pago Traslascuestas - Valcavado de Roa (D.O. Ribera del Duero)',
        terroir: 'Franco-arenoso con base caliza a 850m altitud',
        variety: 'Tinta del País (Tempranillo)',
        custodyStatus: 'Custodia Activa Magnum BlocksWine',
        historicRank: 'Pago de Origen'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-3.9210, 41.7050],
          [-3.9110, 41.7090],
          [-3.9050, 41.7020],
          [-3.9140, 41.6980],
          [-3.9210, 41.7050]
        ]]
      }
    }
  ]
};

export class VineyardLayer {
  constructor(map) {
    this.map = map;
    this.visible = false;
    this.isLoading = false;
    this.cache = new Map();

    // Estilo alineado con BlocksWine (dorado sobrio y vino)
    this.layer = L.geoJSON(null, {
      style: (feature) => {
        const isHistorical = !!feature?.properties?.historicRank;
        return {
          color: isHistorical ? '#c5a880' : '#8B1E3F',
          weight: isHistorical ? 2 : 1,
          dashArray: isHistorical ? null : '3, 4',
          fillColor: isHistorical ? '#6A0D25' : '#8B1E3F',
          fillOpacity: isHistorical ? 0.45 : 0.25
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties || {};
        const title = props.name || props.description || 'Parcela de Viñedo';
        const terroir = props.terroir || 'Terruño vitícola identificado';
        const variety = props.variety || 'Variedad autóctona';
        const status = props.custodyStatus || 'Superficie vitícola registrada';

        layer.bindPopup(`
          <div class="vineyard-popup-card" style="padding: 10px; font-size: 0.92rem; color: #f5f5f5; background: #121212; border-radius: 8px; border: 1px solid rgba(197, 168, 128, 0.3);">
            <div style="font-weight: 700; color: #c5a880; margin-bottom: 4px; font-size: 1rem;">🍇 ${title}</div>
            <div style="font-size: 0.85rem; color: #bbb; margin-bottom: 4px;"><strong>Suelo:</strong> ${terroir}</div>
            <div style="font-size: 0.85rem; color: #bbb; margin-bottom: 4px;"><strong>Variedad:</strong> ${variety}</div>
            <div style="font-size: 0.8rem; color: #f7931a; margin-top: 6px; font-weight: 600;">🛡️ ${status}</div>
          </div>
        `, { className: 'peer-leaflet-popup dark-popup' });
      }
    });

    // Eventos
    this.layer.on('add', () => this.show());
    this.layer.on('remove', () => this.hide());
  }

  async fetchVineyards(bounds) {
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
    if (this.cache.has(bbox)) {
      return this.cache.get(bbox);
    }

    const query = `
      [out:json][timeout:15];
      (
        way["landuse"="vineyard"](${bbox});
        relation["landuse"="vineyard"](${bbox});
      );
      out body;
      >;
      out skel qt;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error(`Overpass status ${response.status}`);
      const data = await response.json();
      const geojson = typeof window.osmtogeojson === 'function' ? window.osmtogeojson(data) : { type: 'FeatureCollection', features: [] };
      this.cache.set(bbox, geojson);
      return geojson;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('⚠️ [VineyardLayer] Overpass no disponible o timeout:', err.message);
      return null;
    }
  }

  async show() {
    if (!this.map) return;
    this.visible = true;
    this.layer.clearLayers();

    // 1. Siempre cargar primero las parcelas históricas BlocksWine (resiliencia y velocidad)
    this.layer.addData(HISTORICAL_PARCELS_BLOCKSWINE);

    // 2. Comprobar nivel de zoom para consultar Overpass dinámico (evita saturación en zoom bajo)
    const zoom = this.map.getZoom();
    if (zoom < 13) {
      console.info('ℹ️ [VineyardLayer] Zoom < 13: Mostrando parcelas históricas de referencia BlocksWine. Acerca el mapa a nivel parcela (zoom >= 13) para explorar catastro OSM.');
      return;
    }

    // 3. Consultar parcelas de alta resolución si zoom >= 13
    if (this.isLoading) return;
    this.isLoading = true;
    try {
      const bounds = this.map.getBounds();
      const dynamicData = await this.fetchVineyards(bounds);
      if (dynamicData && dynamicData.features && dynamicData.features.length > 0) {
        this.layer.addData(dynamicData);
      }
    } catch (error) {
      console.error('❌ [VineyardLayer] Error cargando parcelas dinámicas:', error);
    } finally {
      this.isLoading = false;
    }
  }

  hide() {
    if (this.map && this.visible) {
      this.map.removeLayer(this.layer);
      this.visible = false;
    }
  }
}

export default VineyardLayer;
