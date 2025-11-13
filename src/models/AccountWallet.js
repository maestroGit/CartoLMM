/**
 * Clase AccountWallet - Representa una wallet vinculada a un usuario
 * NO es la wallet blockchain (esa está en magnumsmaster), solo metadata
 * Almacena la relación usuario-publicKey y estado de activación
 * 
 * @class
 * @property {string} id - UUID o identificador interno de la vinculación
 * @property {string} publicKey - Clave pública de la wallet blockchain
 * @property {string} status - Estado de la wallet ("active" | "inactive")
 * @property {string} usuarioId - ID del usuario propietario
 * @property {Date} fechaVinculacion - Fecha de vinculación con el usuario
 */
class AccountWallet {
  /**
   * @param {Object} params - Parámetros del constructor
   * @param {string} params.id - ID único de la vinculación
   * @param {string} params.publicKey - Clave pública blockchain
   * @param {string} [params.status="inactive"] - Estado inicial
   * @param {string} params.usuarioId - ID del usuario propietario
   * @param {Date} [params.fechaVinculacion=new Date()] - Fecha de vinculación
   */
  constructor({ 
    id, 
    publicKey, 
    status = "inactive", 
    usuarioId, 
    fechaVinculacion = new Date() 
  }) {
    this.id = id; // UUID u otro identificador interno
    this.publicKey = publicKey; // Referencia a wallet blockchain
    this.status = status; // "active" | "inactive"
    this.usuarioId = usuarioId;
    this.fechaVinculacion = fechaVinculacion;
  }

  /**
   * Activa la wallet para uso en transacciones
   */
  activar() {
    this.status = "active";
  }

  /**
   * Desactiva la wallet, impidiendo su uso en transacciones
   */
  desactivar() {
    this.status = "inactive";
  }
}

export { AccountWallet };
