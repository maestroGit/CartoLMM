/**
 * Clase Usuario - Representa un usuario registrado en la plataforma CartoLMM
 * Gestiona la información del usuario, sus wallets vinculadas y estado en blockchain
 * 
 * @class
 * @property {string} id - ID único del usuario (OAuth UID)
 * @property {string} provider - Proveedor de autenticación ("google", "github", etc.)
 * @property {string} nombre - Nombre completo del usuario
 * @property {string} email - Correo electrónico
 * @property {Object} localizacion - Ubicación geográfica { direccion, lat, lng }
 * @property {string[]} categorias - Categorías del usuario (["bodega"], ["wine_lover"], etc.)
 * @property {AccountWallet[]} wallets - Array de wallets vinculadas
 * @property {boolean} blockchainActive - Estado de activación en blockchain
 * @property {boolean} registrado - Estado de registro completo
 * @property {Date} fechaRegistro - Fecha de registro en la plataforma
 */
class Usuario {
  /**
   * @param {Object} params - Parámetros del constructor
   * @param {string} params.id - ID único del usuario
   * @param {string} params.provider - Proveedor OAuth
   * @param {string} params.nombre - Nombre del usuario
   * @param {string} params.email - Email del usuario
   * @param {Object} params.localizacion - Ubicación geográfica
   * @param {string[]} params.categorias - Categorías del usuario
   * @param {AccountWallet[]} [params.wallets=[]] - Wallets vinculadas
   * @param {boolean} [params.blockchainActive=false] - Estado blockchain
   * @param {boolean} [params.registrado=false] - Estado de registro
   * @param {Date} [params.fechaRegistro=new Date()] - Fecha de registro
   */
  constructor({ 
    id, 
    provider, 
    nombre, 
    email, 
    localizacion, 
    categorias, 
    wallets = [], 
    blockchainActive = false, 
    registrado = false, 
    fechaRegistro = new Date() 
  }) {
    this.id = id; // ID único (OAuth UID)
    this.provider = provider; // "google", "github", etc.
    this.nombre = nombre;
    this.email = email;
    this.localizacion = localizacion; // { direccion, lat, lng }
    this.categorias = categorias; // ["bodega"], ["wine_lover"], etc.
    this.wallets = wallets; // Array de AccountWallet
    this.blockchainActive = blockchainActive;
    this.registrado = registrado;
    this.fechaRegistro = fechaRegistro;
  }
  
  /**
   * Agrega una wallet a la lista de wallets del usuario
   * @param {AccountWallet} wallet - Wallet a agregar
   * @todo Implementar lógica para evitar duplicados por publicKey
   */
  agregarWallet(wallet) {
    this.wallets.push(wallet);
    // TODO: lógica para evitar duplicados por publicKey
  }

  /**
   * Activa el usuario en la blockchain
   */
  activarEnBlockchain() {
    this.blockchainActive = true;
  }

  /**
   * Obtiene las transacciones relacionadas con las wallets del usuario
   * @param {AccountTransaction[]} transaccionesGlobales - Lista de todas las transacciones
   * @returns {AccountTransaction[]} Transacciones donde el usuario es origen o destino
   */
  obtenerTransacciones(transaccionesGlobales) {
    const misWallets = new Set(this.wallets.map(w => w.publicKey));
    return transaccionesGlobales.filter(
      tx => misWallets.has(tx.fromWallet.publicKey) || misWallets.has(tx.toWallet.publicKey)
    );
  }
}

export { Usuario };
