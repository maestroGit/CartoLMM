/**
 * Clase AccountTransaction - Representa una transacción registrada en la aplicación
 * Referencia a transacciones de blockchain, no es la transacción blockchain real
 * Almacena metadata y relación con wallets de usuarios
 * 
 * @class
 * @property {string} id - Hash o ID único (referencia a TX blockchain)
 * @property {AccountWallet|string} fromWallet - Wallet origen (objeto o publicKey)
 * @property {AccountWallet|string} toWallet - Wallet destino (objeto o publicKey)
 * @property {string} tipo - Tipo de transacción ("compra", "transferencia", "custodia", etc.)
 * @property {Date} fecha - Fecha de la transacción
 * @property {string} firma - Firma criptográfica de la transacción
 * @property {Object} datosExtra - Metadata adicional (vino, botellas, denominación, etc.)
 */
class AccountTransaction {
  /**
   * @param {Object} params - Parámetros del constructor
   * @param {string} params.id - ID único o hash de la transacción
   * @param {AccountWallet|string} params.fromWallet - Wallet origen
   * @param {AccountWallet|string} params.toWallet - Wallet destino
   * @param {string} params.tipo - Tipo de transacción
   * @param {Date} params.fecha - Fecha de ejecución
   * @param {string} params.firma - Firma criptográfica
   * @param {Object} [params.datosExtra] - Información adicional
   */
  constructor({ 
    id, 
    fromWallet, 
    toWallet, 
    tipo, 
    fecha, 
    firma, 
    datosExtra 
  }) {
    this.id = id; // hash o id único (referencia a TX blockchain)
    this.fromWallet = fromWallet; // objeto AccountWallet o solo publicKey
    this.toWallet = toWallet; // objeto AccountWallet o solo publicKey
    this.tipo = tipo; // "compra", "transferencia", "custodia", etc.
    this.fecha = fecha;
    this.firma = firma;
    this.datosExtra = datosExtra || {}; // metadata adicional (vino, botellas, etc.)
  }
}

export { AccountTransaction };
