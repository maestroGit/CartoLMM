
console.log('[WALLET][INIT] wallet-utxo.js cargado y ejecutándose');

// --- Inicialización dinámica en popups de Leaflet ---
function initWalletPopupLogic(popupNode) {
  if (!popupNode) return;
  // Usar querySelector para buscar los controles dentro del nodo del popup
  const importBtn = popupNode.querySelector('#wallet-import');
  const fileInput = popupNode.querySelector('#wallet-file');
  const passInput = popupNode.querySelector('#wallet-passphrase');
  const badge = popupNode.querySelector('#wallet-badge');
  const resetBtn = popupNode.querySelector('#wallet-reset');
  const historyBtn = popupNode.querySelector('#wallet-history');
  const statusEl = popupNode.querySelector('#wallet-status');
  const balanceEl = popupNode.querySelector('#wallet-balance');
  const utxoListEl = popupNode.querySelector('#wallet-utxo-list');
  if (!importBtn) {
    console.warn('[WALLET][POPUP] No se encontró el botón wallet-import en el popup actual');
    return;
  }
  if (importBtn._walletListenerAttached) return;
  importBtn._walletListenerAttached = true;
  console.log('[WALLET][POPUP] Listener de importBtn añadido');

  // Estado local por popup
  let walletState = { pub: null, priv: null, utxos: [], loaded: false };
  function resetWalletUI() {
    console.log('[WALLET][RESET] Limpiando estado y UI');
    walletState = { pub: null, priv: null, utxos: [], loaded: false };
    if (fileInput) fileInput.value = '';
    if (passInput) passInput.value = '';
    if (badge) badge.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (historyBtn) historyBtn.style.display = 'none';
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }
    if (balanceEl) balanceEl.textContent = '0';
    if (utxoListEl) utxoListEl.innerHTML = '';
  }
  resetWalletUI();

  if (importBtn) importBtn.addEventListener('click', async () => {
    console.log('[WALLET][POPUP] Click en botón Importar PublicKey');
    try {
      console.log('[WALLET][IMPORT][POPUP] Click en importar wallet');
      if (!fileInput.files[0]) {
        statusEl.textContent = 'Selecciona un archivo de keystore (.json)';
        statusEl.style.color = '#c00';
        return;
      }
      if (!passInput.value) {
        statusEl.textContent = 'Introduce la passphrase para descifrar el keystore';
        statusEl.style.color = '#c00';
        return;
      }
      const raw = await fileInput.files[0].text();
      const data = JSON.parse(raw);
      const passBuf = new TextEncoder().encode(passInput.value);
      const salt = data.kdfParams?.salt ? hexToBuf(data.kdfParams.salt) : crypto.getRandomValues(new Uint8Array(16));
      const passKey = await crypto.subtle.importKey(
        "raw", passBuf, { name: "PBKDF2" }, false, ["deriveBits"]
      );
      const derived = await crypto.subtle.deriveBits(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        passKey, 256
      );
      const keyBytes = new Uint8Array(derived);
      const iv = hexToBuf(data.cipherParams.iv);
      const ct = hexToBuf(data.encryptedPrivateKey);
      const cryptoKey = await crypto.subtle.importKey(
        "raw", keyBytes, "AES-GCM", false, ["decrypt"]
      );
      let priv;
      try {
        const pt = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv }, cryptoKey, ct
        );
        priv = new TextDecoder().decode(pt);
      } catch (decryptErr) {
        statusEl.textContent = '❌ Passphrase incorrecta o keystore inválido';
        statusEl.style.color = '#c00';
        showToast('❌ Passphrase incorrecta o keystore inválido');
        console.error('[WALLET][IMPORT][DECRYPT ERROR]', decryptErr);
        return;
      }
      walletState.priv = priv;
      walletState.pub = data.publicKey;
      walletState.loaded = true;
      badge.style.display = '';
      resetBtn.style.display = '';
      historyBtn.style.display = '';
      statusEl.textContent = 'Wallet cargada';
      statusEl.style.color = '#2a2';
      // --- Fetch y mostrar UTXOs ---
      const utxos = await fetchUTXOs(walletState.pub);
      walletState.utxos = utxos;
      let total = 0;
      utxoListEl.innerHTML = '';
      if (Array.isArray(utxos) && utxos.length > 0) {
        utxos.forEach((u, i) => {
          total += u.amount || 0;
          const div = document.createElement('div');
          div.className = 'utxo-container';
          // Checkbox
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'utxo-checkbox';
          cb.id = 'utxo_' + i;
          cb.dataset.txid = u.txId;
          cb.dataset.outputindex = u.outputIndex;
          cb.dataset.amount = u.amount;
          cb.dataset.address = u.address;
          // Label
          const label = document.createElement('label');
          label.htmlFor = cb.id;
          label.style = 'flex:1;cursor:pointer;';
          label.innerHTML = `<span style=\"font-weight:500;\">${u.amount}</span> <span style=\"color:#888;word-break:break-all;\">${u.txId} #${u.outputIndex}</span>`;
          // Burn button
          const burnBtn = document.createElement('button');
          burnBtn.textContent = 'Burn';
          burnBtn.className = 'burn-btn';
          burnBtn.style = 'margin-left:8px;padding:2px 10px;border-radius:4px;background:#c00;color:#fff;border:none;cursor:pointer;';
          burnBtn.onclick = (e) => {
            e.preventDefault();
            showToast('Funcionalidad Burn no implementada en esta demo');
          };
          div.appendChild(cb);
          div.appendChild(label);
          div.appendChild(burnBtn);
          utxoListEl.appendChild(div);
        });
      } else {
        utxoListEl.innerHTML = '<span class=\"muted\">No hay UTXOs disponibles.</span>';
      }
      balanceEl.textContent = String(total);
      console.log('[WALLET][IMPORT][POPUP] Wallet importada y UTXOs mostrados.');
    } catch (err) {
      statusEl.textContent = 'Error al importar wallet: ' + (err && err.message);
      statusEl.style.color = '#c00';
      console.error('[WALLET][IMPORT][ERROR]', err);
      resetWalletUI();
      showToast('Error al importar wallet');
    }
  });
  if (resetBtn) resetBtn.addEventListener('click', () => {
    resetWalletUI();
    showToast('wallet reiniciada');
  });
}

// Hook global: cada vez que se abre un popup de Leaflet, reinicializar lógica wallet
document.addEventListener('DOMContentLoaded', () => {
  // Fallback: MutationObserver global para detectar aparición de wallet-import en cualquier parte del DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            // Buscar el botón dentro del nuevo nodo
            const importBtn = node.querySelector && node.querySelector('#wallet-import');
            if (importBtn && !importBtn._walletListenerAttached) {
              console.log('[WALLET][MUTATION] Detectado #wallet-import en el DOM, inicializando lógica wallet');
              initWalletPopupLogic(node);
            }
          }
        });
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Mantener el hook de popupopen por si el evento se dispara correctamente
  document.addEventListener('popupopen', function(e) {
    if (e && e.popup && e.popup._contentNode) {
      setTimeout(() => {
        initWalletPopupLogic(e.popup._contentNode);
        console.log('[WALLET][POPUP] Lógica wallet inicializada en nuevo popup');
      }, 0);
    }
  });
});
// Lógica de wallet UTXO para CartoLMM, adaptada de demo-wallet
// Prefijo wallet- en todos los IDs/clases
// Este archivo debe ser incluido en public/index.html después de app.js

// --- Toast helper reutilizable ---
function showToast(msg) {
  try {
    console.log('[WALLET][TOAST]', msg);
    const existing = document.querySelector('.wallet-toast');
    if (existing) { existing.remove(); }
    const el = document.createElement('div');
    el.className = 'wallet-toast';
    el.textContent = msg;
    // Esquina inferior derecha del modal
    el.style.position = 'fixed';
    el.style.right = '32px';
    el.style.bottom = '32px';
    el.style.background = '#222';
    el.style.color = '#fff';
    el.style.padding = '10px 22px';
    el.style.borderRadius = '8px';
    el.style.fontSize = '15px';
    el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
    el.style.zIndex = 9999;
    el.style.opacity = '0.97';
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .4s';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 500);
    }, 2300);
  } catch (e) { console.warn('[WALLET][TOAST][ERROR]', e); }
}

// --- Estado de la wallet ---
let walletState = {
  pub: null,
  priv: null,
  utxos: [],
  loaded: false
};

// --- Limpiar estado y UI ---
function resetWalletUI() {
  console.log('[WALLET][RESET] Limpiando estado y UI');
  walletState = { pub: null, priv: null, utxos: [], loaded: false };
  document.getElementById('wallet-file').value = '';
  document.getElementById('wallet-passphrase').value = '';
  document.getElementById('wallet-badge').style.display = 'none';
  document.getElementById('wallet-reset').style.display = 'none';
  document.getElementById('wallet-history').style.display = 'none';
  document.getElementById('wallet-status').textContent = '';
  document.getElementById('wallet-balance').textContent = '0';
  document.getElementById('wallet-utxo-list').innerHTML = '';
}

// --- Detectar cierre y reapertura del modal ---
const modal = document.getElementById('bodega-modal');
const closeBtn = document.getElementById('modal-close');
if (modal && closeBtn) {
  closeBtn.addEventListener('click', () => {
    console.log('[WALLET][MODAL] Cierre modal detectado');
    resetWalletUI();
    // No mostrar toast aquí
  });
  // Al reabrir el modal, mostrar toast si wallet está vacía
  const observer = new MutationObserver(() => {
    if (!modal.classList.contains('hidden') && !walletState.loaded) {
      console.log('[WALLET][MODAL] Modal abierto, wallet vacía. Mostrando toast.');
      showToast('wallet reiniciada');
    }
  });
  observer.observe(modal, { attributes: true, attributeFilter: ['class'] });
}

// --- Utilidades para descifrado y fetch UTXOs ---
async function fetchUTXOs(address) {
  try {
    const base = location.port && location.port !== "3000"
      ? `${location.protocol}//${location.hostname}:3000`
      : "";
    const url = `${base}/utxo-balance/${encodeURIComponent(address)}`;
    console.log('[WALLET][FETCH UTXOS] URL:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch utxos: " + res.status);
    const data = await res.json();
    console.log('[WALLET][FETCH UTXOS] Data:', data);
    // Normalizar formato: array o { utxos: [...] }
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.utxos)) return data.utxos;
    return [];
  } catch (err) {
    console.error('[WALLET][FETCH UTXOS][ERROR]', err);
    return [];
  }
}

// --- Importar wallet: descifrado y visualización ---
document.getElementById('wallet-import').addEventListener('click', async () => {
  const fileInput = document.getElementById('wallet-file');
  const passInput = document.getElementById('wallet-passphrase');
  const badge = document.getElementById('wallet-badge');
  const resetBtn = document.getElementById('wallet-reset');
  const historyBtn = document.getElementById('wallet-history');
  const statusEl = document.getElementById('wallet-status');
  const balanceEl = document.getElementById('wallet-balance');
  const utxoListEl = document.getElementById('wallet-utxo-list');
  console.log('[WALLET][IMPORT] Click en importar wallet');
  badge.style.display = 'none';
  resetBtn.style.display = 'none';
  historyBtn.style.display = 'none';
  statusEl.textContent = '';
  balanceEl.textContent = '0';
  utxoListEl.innerHTML = '';
  if (!fileInput.files[0]) {
    statusEl.textContent = 'Selecciona un archivo de keystore (.json)';
    console.warn('[WALLET][IMPORT][ERROR] No file selected');
    return;
  }
  if (!passInput.value) {
    statusEl.textContent = 'Introduce la passphrase para descifrar el keystore';
    console.warn('[WALLET][IMPORT][ERROR] No passphrase');
    return;
  }
  try {
    console.log('[WALLET][IMPORT] Iniciando importación de wallet...');
    const raw = await fileInput.files[0].text();
    console.log('[WALLET][IMPORT] Keystore file loaded');
    const data = JSON.parse(raw);
    // --- Derivar clave con PBKDF2 (demo simplificado) ---
    const passBuf = new TextEncoder().encode(passInput.value);
    const salt = data.kdfParams?.salt ? hexToBuf(data.kdfParams.salt) : crypto.getRandomValues(new Uint8Array(16));
    const passKey = await crypto.subtle.importKey(
      "raw", passBuf, { name: "PBKDF2" }, false, ["deriveBits"]
    );
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      passKey, 256
    );
    const keyBytes = new Uint8Array(derived);
    // --- Descifrar clave privada ---
    const iv = hexToBuf(data.cipherParams.iv);
    const ct = hexToBuf(data.encryptedPrivateKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBytes, "AES-GCM", false, ["decrypt"]
    );
    let priv;
    try {
      console.log('[WALLET][IMPORT] Intentando descifrar clave privada...');
      const pt = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv }, cryptoKey, ct
      );
      priv = new TextDecoder().decode(pt);
      console.log('[WALLET][IMPORT] Descifrado exitoso.');
    } catch (decryptErr) {
      // Passphrase incorrecta o keystore corrupto
      statusEl.textContent = '❌ Passphrase incorrecta o keystore inválido';
      statusEl.style.color = '#c00';
      showToast('❌ Passphrase incorrecta o keystore inválido');
      console.error('[WALLET][IMPORT][DECRYPT ERROR]', decryptErr);
      console.log('[WALLET][IMPORT] Lanzando toast de error de passphrase.');
      return;
    }
    walletState.priv = priv;
    walletState.pub = data.publicKey;
    walletState.loaded = true;
    console.log('[WALLET][IMPORT] Wallet importada. PublicKey:', walletState.pub);
    badge.style.display = '';
    resetBtn.style.display = '';
    historyBtn.style.display = '';
    statusEl.textContent = 'Wallet cargada';
    statusEl.style.color = '#2a2';
    // --- Fetch y mostrar UTXOs ---
    const utxos = await fetchUTXOs(walletState.pub);
    walletState.utxos = utxos;
    let total = 0;
    utxoListEl.innerHTML = '';
    if (Array.isArray(utxos) && utxos.length > 0) {
      console.log('[WALLET][IMPORT] UTXOs recibidos:', utxos);
      utxos.forEach((u, i) => {
        total += u.amount || 0;
        const div = document.createElement('div');
        div.className = 'wallet-utxo-item';
        div.innerHTML = `<span style=\"font-weight:500;\">${u.amount}</span> <span style=\"color:#888;word-break:break-all;\">${u.txId} #${u.outputIndex}</span>`;
        utxoListEl.appendChild(div);
      });
    } else {
      console.log('[WALLET][IMPORT] No hay UTXOs disponibles');
      utxoListEl.innerHTML = '<span class=\"muted\">No hay UTXOs disponibles.</span>';
    }
    balanceEl.textContent = String(total);
    console.log('[WALLET][IMPORT] Balance calculado:', total);
  } catch (err) {
    statusEl.textContent = 'Error al importar wallet: ' + (err && err.message);
    statusEl.style.color = '#c00';
    console.error('[WALLET][IMPORT][ERROR]', err);
    resetWalletUI();
    showToast('Error al importar wallet');
    console.log('[WALLET][IMPORT] Lanzando toast de error general.');
  }
});

document.getElementById('wallet-reset').addEventListener('click', () => {
  resetWalletUI();
  showToast('wallet reiniciada');
});

// --- Hex helpers ---
function hexToBuf(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((h) => parseInt(h, 16)));
}
