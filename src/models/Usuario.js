/**
 * Clase Usuario - Representa un usuario registrado en la plataforma BlocksWine / CartoLMM
 * Compatible con el modelo Sequelize de magnumslocal (roles, KYC, metadatos enológicos y wallets)
 */

class Usuario {
  constructor({
    id,
    provider = 'google',
    nombre = '',
    email = '',
    role = 'wine_lover',
    localizacion = null,
    direccion = '',
    latitud = null,
    longitud = null,
    lat = null,
    lng = null,
    categorias = [],
    badges = [],
    wallets = [],
    blockchainActive = false,
    registrado = false,
    kyc_status = 'none',
    subscription_status = 'active',
    founded = null,
    enologo = null,
    manager = null,
    website = null,
    web = null,
    descripcion = '',
    denominaciones = [],
    fechaRegistro = new Date()
  } = {}) {
    this.id = id;
    this.provider = provider;
    this.nombre = nombre;
    this.email = email;
    this.role = role || (categorias && categorias.includes('bodega') ? 'winery' : 'wine_lover');
    this.categorias = Array.isArray(categorias) && categorias.length > 0 
      ? categorias 
      : (this.role === 'winery' ? ['bodega'] : [this.role]);
    this.badges = Array.isArray(badges) ? badges : [];

    // Normalizar coordenadas geográficas
    const finalLat = latitud ?? lat ?? localizacion?.lat;
    const finalLng = longitud ?? lng ?? localizacion?.lng;
    const finalDir = direccion || localizacion?.direccion || '';

    this.localizacion = (finalLat !== null && finalLng !== null && !isNaN(finalLat) && !isNaN(finalLng))
      ? { direccion: finalDir, lat: Number(finalLat), lng: Number(finalLng) }
      : null;

    this.wallets = Array.isArray(wallets) ? wallets : [];
    this.blockchainActive = Boolean(blockchainActive || (this.wallets.length > 0));
    this.registrado = Boolean(registrado);
    this.kyc_status = kyc_status;
    this.subscription_status = subscription_status;

    // Metadatos de bodega / perfil profesional
    this.founded = founded;
    this.enologo = enologo;
    this.manager = manager;
    this.website = website || web;
    this.descripcion = descripcion;
    this.denominaciones = Array.isArray(denominaciones) ? denominaciones : [];
    this.fechaRegistro = fechaRegistro instanceof Date ? fechaRegistro : new Date(fechaRegistro || Date.now());
  }

  agregarWallet(wallet) {
    if (!wallet) return;
    const address = typeof wallet === 'string' ? wallet : (wallet.address || wallet.publicKey);
    if (!address) return;
    const exists = this.wallets.some(w => (w.address || w.publicKey) === address);
    if (!exists) {
      this.wallets.push(typeof wallet === 'object' ? wallet : { address });
      this.blockchainActive = true;
    }
  }

  isWinery() {
    return this.role === 'winery' || this.categorias.includes('bodega');
  }

  isWineLover() {
    return this.role === 'wine_lover' || this.categorias.includes('wine_lover');
  }

  isVerified() {
    return this.kyc_status === 'verified';
  }
}

export { Usuario };
export default Usuario;
