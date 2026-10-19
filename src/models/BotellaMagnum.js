/**
 * BotellaMagnum.js
 * Modelo para activos RWA de botellas Magnum de 1.5L en protocolo BlocksWine
 */

export class BotellaMagnum {
  constructor({
    id,
    token_id,
    lote_id,
    numero_botella,
    nombre = '',
    bodega_id = '',
    bodega_nombre = '',
    denominacion = '',
    anada = null,
    variedad = '',
    tipo_vino = 'Tinto',
    graduacion = null,
    formato = 'Magnum 1.5L',
    estado_custodia = 'en_bodega', // 'en_bodega' | 'transferida' | 'descorchada'
    temperatura_servicio = '16-18°C',
    notas_cata = '',
    imagen_url = '',
    tx_minado = null,
    propietario_actual = null
  } = {}) {
    this.id = id;
    this.token_id = token_id;
    this.lote_id = lote_id;
    this.numero_botella = numero_botella;
    this.nombre = nombre;
    this.bodega_id = bodega_id;
    this.bodega_nombre = bodega_nombre;
    this.denominacion = denominacion;
    this.anada = anada;
    this.variedad = variedad;
    this.tipo_vino = tipo_vino;
    this.graduacion = graduacion;
    this.formato = formato;
    this.estado_custodia = estado_custodia;
    this.temperatura_servicio = temperatura_servicio;
    this.notas_cata = notas_cata;
    this.imagen_url = imagen_url;
    this.tx_minado = tx_minado;
    this.propietario_actual = propietario_actual;
  }

  isUncorked() {
    return this.estado_custodia === 'descorchada' || this.estado_custodia === 'burned';
  }

  isInVault() {
    return this.estado_custodia === 'en_bodega';
  }
}

export default BotellaMagnum;
