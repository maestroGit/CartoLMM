/**
 * BurnEvent.js
 * Modelo para eventos de descorche privado en bodega / quema de token
 */

export class BurnEvent {
  constructor({
    id,
    token_id,
    botella_id = null,
    bodega_id = '',
    bodega_nombre = '',
    owner_address = '',
    tx_hash = '',
    block_index = null,
    motivo = 'Private uncorking ritual',
    ubicacion_ritual = 'Bodega de origen',
    timestamp = new Date()
  } = {}) {
    this.id = id;
    this.token_id = token_id;
    this.botella_id = botella_id;
    this.bodega_id = bodega_id;
    this.bodega_nombre = bodega_nombre;
    this.owner_address = owner_address;
    this.tx_hash = tx_hash;
    this.block_index = block_index;
    this.motivo = motivo;
    this.ubicacion_ritual = ubicacion_ritual;
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp || Date.now());
  }
}

export default BurnEvent;
