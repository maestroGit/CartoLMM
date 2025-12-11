  // --- Insertar card de usuario al inicio del popup ---
console.log('[WALLET][INIT] wallet-utxo.js cargado y ejecutándose');

// --- Inicialización dinámica en popups de Leaflet ---
function initWalletPopupLogic(popupNode) {
    // Buscar el nodo .user-popup para obtener los atributos correctos
    console.log('[WALLET][INIT] initWalletPopupLogic llamada');
    let userPopupNode = popupNode;
    if (!userPopupNode.classList || !userPopupNode.classList.contains('user-popup')) {
      userPopupNode = popupNode.querySelector('.user-popup') || popupNode.closest('.user-popup') || popupNode;
    }
    const userType = userPopupNode.getAttribute('data-user-type');
    const userImg = userPopupNode.getAttribute('data-user-img');
    // Obtener la imagen de la botella desde el atributo data-img-bottle
    const userBottleImg = userPopupNode.getAttribute('data-img-bottle');
    console.log('[WALLET][INIT] userPopupNode:', userPopupNode, 'userType:', userType, 'userImg:', userImg);
  if (!popupNode) return;
  // Usar querySelector para buscar los controles dentro del nodo del popup
  const importBtn = popupNode.querySelector('#wallet-import');
  // Usar la variable userPopupNode ya existente
  // Obtener el id único del usuario para seleccionar los elementos dinámicos
  let userId = userPopupNode.getAttribute('data-user-id') || userPopupNode.getAttribute('data-user-type');
  // Fallback: buscar input por id dinámico
  // Buscar el input file por id dinámico, si no existe usar el primero disponible
  let fileInput = null;
  if (userId) {
    fileInput = popupNode.querySelector(`#wallet-file-${userId}`);
  }
  if (!fileInput) {
    // Fallback: buscar cualquier input file
    fileInput = popupNode.querySelector('input[type="file"]');
  }
  console.log('[WALLET][INIT] fileInput:', fileInput);
  if (fileInput && !fileInput.classList.contains('wallet-file-input')) fileInput.classList.add('wallet-file-input');
  // Buscar el input de passphrase por id dinámico, si no existe usar el primero disponible
  let passInput = null;
  if (userId) {
    passInput = popupNode.querySelector(`#wallet-passphrase-${userId}`);
  }
  if (!passInput) {
    passInput = popupNode.querySelector('input[type="password"]');
  }
  const badge = popupNode.querySelector('#wallet-badge');
  const historyBtn = popupNode.querySelector('#wallet-history');
  const statusEl = popupNode.querySelector('#wallet-status');
  const balanceEl = popupNode.querySelector('#wallet-balance');
  const utxoListEl = popupNode.querySelector('#wallet-utxo-list');

  // Reordenar: mover el área de balance y UTXOs justo después del nombre y estado
  const walletBalanceArea = popupNode.querySelector('.wallet-balance-area');
  const walletUtxosArea = popupNode.querySelector('.wallet-utxos-area');
  const walletImportControls = popupNode.querySelector('.wallet-import-controls');
  if (walletBalanceArea && walletUtxosArea && walletImportControls) {
    walletImportControls.parentNode.insertBefore(walletBalanceArea, walletImportControls);
    walletImportControls.parentNode.insertBefore(walletUtxosArea, walletImportControls);
  }
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
    if (historyBtn) historyBtn.style.display = 'none';
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }
    if (balanceEl) balanceEl.textContent = '0';
    if (utxoListEl) utxoListEl.innerHTML = '';
  }
  resetWalletUI();

  if (importBtn) importBtn.addEventListener('click', async () => {
    console.log('[WALLET][POPUP] Click en botón Importar PublicKey');
    console.log('[WALLET][DEBUG] userType:', userType, 'userImg:', userImg, 'utxoListEl:', utxoListEl);
    try {
      // --- INICIO FLUJO DE IMPORTACIÓN ---
      console.log('[WALLET][IMPORT][POPUP] Click en importar wallet');
      // Validar que el input de archivo existe y tiene archivo seleccionado
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        statusEl.textContent = 'Selecciona un archivo de keystore (.json)';
        statusEl.style.color = '#c00';
        return;
      }
      // Validar que el input de passphrase existe y tiene valor
      if (!passInput || !passInput.value) {
        statusEl.textContent = 'Introduce la passphrase para descifrar el keystore';
        statusEl.style.color = '#c00';
        return;
      }
      // Log para depuración: archivo seleccionado
      console.log('[WALLET][IMPORT][DEBUG] fileInput.files:', fileInput.files, 'file:', fileInput.files[0]);
      // Leer el archivo y mostrar contenido para depuración
      const raw = await fileInput.files[0].text();
      console.log('[WALLET][IMPORT][DEBUG] raw file content:', raw);
      // Parsear el JSON y mostrar para depuración
      const data = JSON.parse(raw);
      console.log('[WALLET][IMPORT][DEBUG] parsed JSON:', data);
      // --- FIN DE VALIDACIONES Y LECTURA ---
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
          div.className = 'utxo-container wallet-utxo-container';
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
          label.innerHTML = `<span style=\"font-weight:500;\">${u.amount}</span> <span class=\"wallet-utxo-label\">${u.txId} #${u.outputIndex}</span>`;
          // Burn button
          const burnBtn = document.createElement('button');
          burnBtn.textContent = 'Burn';
          burnBtn.className = 'burn-btn';
          burnBtn.style = 'margin-left:8px;padding:2px 10px;border-radius:4px;background:#c00;color:#fff;border:none;cursor:pointer;';
          burnBtn.onclick = (e) => {
            e.preventDefault();
            showToast('Funcionalidad Burn no implementada en esta demo');
          };
          // Si es winelover, añadir la imagen y botón Move después del botón Burn
          if (userType === 'winelover' && userImg) {
            console.log(`[UTXO][${i}] Añadiendo imagen y botón Move para winelover`, {userImg, utxo: u});
            // Estructura: checkbox + label + imagen + botones alineados
            div.style.display = 'flex';
            div.style.flexDirection = 'column';
            div.style.alignItems = 'center';
            div.style.gap = '8px';

            // Fila principal: checkbox y label
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.width = '100%';
            row.style.gap = '10px';

            // Importe
            const amountSpan = document.createElement('span');
            amountSpan.style.fontWeight = '500';
            amountSpan.textContent = u.amount;

            row.appendChild(cb);
            row.appendChild(amountSpan);
            div.appendChild(row);

            // Public key debajo
            const pubkeyRow = document.createElement('div');
            pubkeyRow.className = 'wallet-utxo-label';
            pubkeyRow.style.marginTop = '2px';
            pubkeyRow.style.fontSize = '0.98em';
            pubkeyRow.style.wordBreak = 'break-all';
            pubkeyRow.textContent = `${u.txId} #${u.outputIndex}`;
            div.appendChild(pubkeyRow);

            // Imagen de la botella (img-bottle)
            const imgDiv = document.createElement('div');
            imgDiv.className = 'user-bottle-img-wrapper bodega-img-full';
            imgDiv.innerHTML = `<img src="${userBottleImg || '/public/images/default-bottle.png'}" alt="Imagen botella o icono" onclick="window.showZoomImage && window.showZoomImage('${userBottleImg || '/public/images/default-bottle.png'}')">`;
            div.appendChild(imgDiv);

            // Fila de botones: Burn y Move alineados y del mismo tamaño
            const btnRow = document.createElement('div');
            btnRow.style.display = 'flex';
            btnRow.style.justifyContent = 'center';
            btnRow.style.alignItems = 'center';
            btnRow.style.width = '100%';
            btnRow.style.gap = '8px';

            // Unificar estilos de tamaño
            burnBtn.style.padding = '6px 22px';
            burnBtn.style.fontSize = '15px';
            burnBtn.style.fontWeight = '600';
            burnBtn.style.margin = '0';
            burnBtn.style.maxWidth = '';

            const moveBtn = document.createElement('button');
            moveBtn.className = 'move-btn-user-popup';
            moveBtn.textContent = 'Move';
            moveBtn.style.padding = '6px 22px';
            moveBtn.style.fontSize = '15px';
            moveBtn.style.fontWeight = '600';
            moveBtn.style.margin = '0';
            moveBtn.style.maxWidth = '';
            moveBtn.onclick = () => window.open(`${apiBaseUrl}/demo-wallet/web-demo.html`,'_blank');

            btnRow.appendChild(burnBtn);
            btnRow.appendChild(moveBtn);
            div.appendChild(btnRow);

            console.log(`[UTXO][${i}] Imagen y botones alineados añadidos al contenedor`, div);
          } else {
            div.appendChild(cb);
            div.appendChild(label);
            div.appendChild(burnBtn);
          }
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
}

// Hook global: cada vez que se abre un popup de Leaflet, reinicializar lógica wallet
document.addEventListener('DOMContentLoaded', () => {
  // Fallback: MutationObserver global para detectar aparición de wallet-import en cualquier parte del DOM
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const importBtn = node.querySelector && node.querySelector('#wallet-import');
            if (importBtn && !importBtn._walletListenerAttached) {
              console.log('[WALLET][MUTATION] Detectado #wallet-import en el DOM, inicializando lógica wallet en nodo:', node);
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
      console.log('[WALLET][POPUPOPEN] Evento popupopen detectado, inicializando lógica wallet');
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


// --- Hex helpers ---
function hexToBuf(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map((h) => parseInt(h, 16)));
}
