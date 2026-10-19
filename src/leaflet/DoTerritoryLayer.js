/**
 * DoTerritoryLayer.js
 * Capa Leaflet para visualización de Denominaciones de Origen (D.O.), terruño y clima oficial
 * Consume datos desde /api/denominaciones
 */

// Territorios y centroides de referencia para las principales D.O. vitivinícolas
const DO_REGIONS_GEO = {
  rioja: {
    nombre: 'D.O.Ca. Rioja',
    center: [42.4658, -2.4499],
    bounds: [[42.15, -2.95], [42.65, -1.95]],
    color: '#8B1E3F',
    fillColor: '#6A0D25'
  },
  'ribera-del-duero': {
    nombre: 'D.O. Ribera del Duero',
    center: [41.6714, -3.6892],
    bounds: [[41.45, -4.15], [41.85, -3.20]],
    color: '#722f37',
    fillColor: '#4A0E17'
  },
  priorat: {
    nombre: 'D.O.Q. Priorat',
    center: [41.1736, 0.8222],
    bounds: [[41.05, 0.65], [41.30, 0.95]],
    color: '#9E2A2B',
    fillColor: '#540B0E'
  },
  rueda: {
    nombre: 'D.O. Rueda',
    center: [41.4116, -4.9583],
    bounds: [[41.15, -5.30], [41.60, -4.60]],
    color: '#D4AF37',
    fillColor: '#8C7820'
  },
  'rias-baixas': {
    nombre: 'D.O. Rías Baixas',
    center: [42.4310, -8.6444],
    bounds: [[42.10, -8.90], [42.65, -8.40]],
    color: '#2A9D8F',
    fillColor: '#1B655D'
  },
  toro: {
    nombre: 'D.O. Toro',
    center: [41.5222, -5.3944],
    bounds: [[41.35, -5.60], [41.65, -5.15]],
    color: '#6B0F0F',
    fillColor: '#3B0A0A'
  },
  bierzo: {
    nombre: 'D.O. Bierzo',
    center: [42.5478, -6.5989],
    bounds: [[42.40, -6.85], [42.70, -6.35]],
    color: '#A020F0',
    fillColor: '#551080'
  },
  cava: {
    nombre: 'D.O. Cava',
    center: [41.4253, 1.7850],
    bounds: [[41.25, 1.60], [41.60, 2.05]],
    color: '#DAA520',
    fillColor: '#7A5C10'
  }
};

export class DoTerritoryLayer {
  constructor(map) {
    this.map = map;
    this.layer = L.layerGroup();
    this.visible = false;
    this.denominaciones = [];

    this.layer.on('add', () => this.show());
    this.layer.on('remove', () => this.hide());
  }

  async fetchDenominaciones() {
    try {
      const res = await fetch('/api/denominaciones?limit=100');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      return Array.isArray(payload?.data) ? payload.data : (Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.warn('⚠️ [DoTerritoryLayer] No se pudo obtener DOs remotas, usando catálogo base:', error);
      return [];
    }
  }

  async show() {
    if (!this.map) return;
    this.layer.clearLayers();

    try {
      this.denominaciones = await this.fetchDenominaciones();
      this.renderTerritories();
      this.visible = true;
    } catch (error) {
      console.error('❌ [DoTerritoryLayer] Error renderizando territorios:', error);
    }
  }

  hide() {
    this.visible = false;
    this.layer.clearLayers();
  }

  normalizeKey(str = '') {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  renderTerritories() {
    // Renderizar regiones geográficas
    Object.entries(DO_REGIONS_GEO).forEach(([key, geo]) => {
      // Buscar datos de la D.O. en el backend
      const doData = this.denominaciones.find(d => 
        this.normalizeKey(d.nombre).includes(key) || key.includes(this.normalizeKey(d.nombre))
      ) || {};

      const title = doData.nombre || geo.nombre;
      const tipo = doData.tipo || 'D.O.';
      const region = doData.region || 'España';
      const clima = doData.clima || 'Continental / Mediterráneo';
      const variedadesList = Array.isArray(doData.variedades) 
        ? doData.variedades.map(v => typeof v === 'object' ? v.nombre : v) 
        : [];
      const tiposList = Array.isArray(doData.tipos_vino) 
        ? doData.tipos_vino.map(t => typeof t === 'object' ? t.nombre : t) 
        : [];

      // 1. Polígono o rectángulo del área de denominación
      const rectangle = L.rectangle(geo.bounds, {
        color: geo.color,
        weight: 2,
        fillColor: geo.fillColor,
        fillOpacity: 0.22,
        dashArray: '4, 6'
      });

      // 2. Marcador distintivo central
      const pillIcon = L.divIcon({
        className: 'do-badge-icon',
        html: `
          <div class="do-territory-pill" style="
            background: linear-gradient(135deg, rgba(26,11,16,0.92), rgba(59,10,20,0.95));
            border: 1px solid ${geo.color};
            color: #f7931a;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
          ">
            <span>🏅</span>
            <span>${title}</span>
          </div>
        `,
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });

      const marker = L.marker(geo.center, { icon: pillIcon });

      // Popup informativo con estilo BlocksWine Luxury
      const variedadesBadges = variedadesList.length > 0
        ? variedadesList.slice(0, 4).map(v => `<span style="background:rgba(247,147,26,0.15);color:#ffb14a;border:1px solid rgba(247,147,26,0.4);border-radius:4px;padding:2px 6px;font-size:11px;">🍇 ${v}</span>`).join(' ')
        : '<span style="color:#999;font-size:12px;">Tempranillo, Garnacha</span>';

      const tiposBadges = tiposList.length > 0
        ? tiposList.map(t => `<span style="background:rgba(139,30,63,0.25);color:#f5f5f5;border-radius:4px;padding:2px 6px;font-size:11px;">🍷 ${t}</span>`).join(' ')
        : '<span style="color:#999;font-size:12px;">Tinto Reserva, Crianza</span>';

      const popupContent = `
        <div class="do-popup-card" style="
          min-width: 260px;
          max-width: 320px;
          padding: 8px 4px;
          text-align: left;
          font-family: 'Segoe UI', Arial, sans-serif;
        ">
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:6px;margin-bottom:8px;">
            <strong style="color:#f7931a;font-size:15px;letter-spacing:0.5px;">${title}</strong>
            <span style="background:#6A0D25;color:#fff;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;">${tipo}</span>
          </div>
          <p style="margin:4px 0;font-size:12px;color:#d1d5db;">📍 <strong>Región:</strong> ${region}</p>
          <p style="margin:4px 0;font-size:12px;color:#d1d5db;">⛅ <strong>Clima:</strong> ${clima}</p>
          <div style="margin:8px 0 4px 0;">
            <strong style="font-size:11px;color:#e5e7eb;text-transform:uppercase;letter-spacing:0.5px;">Variedades de Uva:</strong>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${variedadesBadges}</div>
          </div>
          <div style="margin:8px 0 4px 0;">
            <strong style="font-size:11px;color:#e5e7eb;text-transform:uppercase;letter-spacing:0.5px;">Estilos Certificados:</strong>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${tiposBadges}</div>
          </div>
        </div>
      `;

      rectangle.bindPopup(popupContent, { className: 'peer-leaflet-popup' });
      marker.bindPopup(popupContent, { className: 'peer-leaflet-popup' });

      this.layer.addLayer(rectangle);
      this.layer.addLayer(marker);
    });

    if (this.map && !this.map.hasLayer(this.layer)) {
      this.layer.addTo(this.map);
    }
  }
}

export default DoTerritoryLayer;
