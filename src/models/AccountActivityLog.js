/**
 * Clase AccountActivityLog - Log de actividades del usuario
 * Registro de acciones realizadas en la plataforma para auditoría
 * 
 * @class
 * @property {string} id - ID único del log
 * @property {string} usuarioId - ID del usuario que realizó la acción
 * @property {string} accion - Descripción de la acción ("registro", "vinculacion_wallet", "transaccion", etc.)
 * @property {Date} fechaHora - Fecha y hora de la acción
 */
class AccountActivityLog {
  /**
   * @param {Object} params - Parámetros del constructor
   * @param {string} params.id - ID único del log
   * @param {string} params.usuarioId - ID del usuario
   * @param {string} params.accion - Acción realizada
   * @param {Date} params.fechaHora - Timestamp de la acción
   */
  constructor({ 
    id, 
    usuarioId, 
    accion, 
    fechaHora 
  }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.accion = accion; // "registro", "vinculacion_wallet", "transaccion", etc.
    this.fechaHora = fechaHora;
  }
}

export { AccountActivityLog };
