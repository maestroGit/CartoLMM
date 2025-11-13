/**
 * Clase AccountLoginHistory - Registro de historial de logins
 * Auditoría de accesos de usuarios a la plataforma
 * 
 * @class
 * @property {string} id - ID único del registro
 * @property {string} usuarioId - ID del usuario que inició sesión
 * @property {Date} fechaHora - Fecha y hora del login
 * @property {string} ip - Dirección IP del acceso
 */
class AccountLoginHistory {
  /**
   * @param {Object} params - Parámetros del constructor
   * @param {string} params.id - ID único del registro
   * @param {string} params.usuarioId - ID del usuario
   * @param {Date} params.fechaHora - Timestamp del login
   * @param {string} params.ip - Dirección IP
   */
  constructor({ 
    id, 
    usuarioId, 
    fechaHora, 
    ip 
  }) {
    this.id = id;
    this.usuarioId = usuarioId;
    this.fechaHora = fechaHora;
    this.ip = ip;
  }
}

export { AccountLoginHistory };
