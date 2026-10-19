/**
 * DenominacionOrigen.js
 * Modelo para representar una Denominación de Origen / Terruño vitivinícola
 */

export class DenominacionOrigen {
  constructor({
    id,
    nombre,
    tipo = 'DO',
    pais = 'España',
    region = '',
    clima = '',
    descripcion = '',
    superficie_ha = null,
    altitud_min = null,
    altitud_max = null,
    variedades = [],
    tipos_vino = [],
    bodegas = [],
    geometria = null // Polígono GeoJSON o centroide
  } = {}) {
    this.id = id;
    this.nombre = nombre;
    this.tipo = tipo;
    this.pais = pais;
    this.region = region;
    this.clima = clima;
    this.descripcion = descripcion;
    this.superficie_ha = superficie_ha;
    this.altitud_min = altitud_min;
    this.altitud_max = altitud_max;
    this.variedades = Array.isArray(variedades) ? variedades : [];
    this.tipos_vino = Array.isArray(tipos_vino) ? tipos_vino : [];
    this.bodegas = Array.isArray(bodegas) ? bodegas : [];
    this.geometria = geometria;
  }
}

export default DenominacionOrigen;
