  // --- Insertar card de usuario al inicio del popup ---
console.log('[WALLET][INIT] wallet-utxo.js cargado y ejecutándose');

// --- Helper para convertir hex a buffer ---
function hexToBuf(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(h => parseInt(h, 16)));
}

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
    
    // Volver a mostrar el contenedor del botón "Select file"
    const fileInputWrapper = fileInput?.closest('.custom-file-input-wrapper');
    if (fileInputWrapper) {
      fileInputWrapper.style.display = '';
      console.log('[WALLET][RESET] Botón "Select file" restaurado');
    }
    // Volver a mostrar el grupo de import (si es necesario)
    const importGroup = popupNode.querySelector('.wallet-import-group');
    if (importGroup) {
      importGroup.style.display = 'none'; // Mantener oculto hasta que se seleccione archivo
      console.log('[WALLET][RESET] Grupo de import oculto hasta selección de archivo');
    }
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
      
      // Ocultar el contenedor del botón "Select file" para limpiar la UI
      const fileInputWrapper = fileInput?.closest('.custom-file-input-wrapper');
      if (fileInputWrapper) {
        fileInputWrapper.style.display = 'none';
        console.log('[WALLET][UI] Botón "Select file" ocultado tras carga exitosa');
      }
      // Ocultar también el grupo de import (passphrase + botón Import)
      const importGroup = popupNode.querySelector('.wallet-import-group');
      if (importGroup) {
        importGroup.style.display = 'none';
        console.log('[WALLET][UI] Grupo de import ocultado tras carga exitosa');
      }
      
      // --- Fetch y mostrar UTXOs ---
      const utxoResult = await fetchUTXOs(walletState.pub);
      // Nueva estructura: { utxos, utxosPendientes }
      const utxos = utxoResult?.utxos || (Array.isArray(utxoResult) ? utxoResult : []);
      const utxosPendientes = utxoResult?.utxosPendientes || [];
      walletState.utxos = utxos;
      walletState.utxosPendientes = utxosPendientes;
      let total = 0;
      utxoListEl.innerHTML = '';
      
      // Renderizar UTXOs disponibles
      if (Array.isArray(utxos) && utxos.length > 0) {
        // Encabezado de UTXOs disponibles
        const availableHeader = document.createElement('div');
        availableHeader.style.cssText = `
          font-weight: 700;
          color: #5fd3a5;
          margin-bottom: 16px;
          margin-top: 8px;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(95,211,165,0.3);
        `;
        availableHeader.textContent = '✓ Disponibles';
        utxoListEl.appendChild(availableHeader);
        
        utxos.forEach((u, i) => {
          total += u.amount || 0;
          const div = document.createElement('div');
          div.className = 'utxo-container wallet-utxo-container';
          
          // Estilos mejorados para dar más protagonismo
          div.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 16px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, rgba(95,211,165,0.1) 0%, rgba(95,211,165,0.05) 100%);
            border: 2px solid rgba(95,211,165,0.3);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
          `;
          
          // Hover effect
          div.onmouseenter = () => {
            div.style.transform = 'translateY(-2px)';
            div.style.boxShadow = '0 6px 20px rgba(95,211,165,0.3)';
            div.style.borderColor = 'rgba(95,211,165,0.6)';
          };
          div.onmouseleave = () => {
            div.style.transform = 'translateY(0)';
            div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            div.style.borderColor = 'rgba(95,211,165,0.3)';
          };
          
          // Fila superior: checkbox + monto destacado
          const topRow = document.createElement('div');
          topRow.style.cssText = 'display: flex; align-items: center; width: 100%; gap: 12px; justify-content: center;';
          
          // Checkbox
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'utxo-checkbox';
          cb.id = 'utxo_' + i;
          cb.dataset.txid = u.txId;
          cb.dataset.outputindex = u.outputIndex;
          cb.dataset.amount = u.amount;
          cb.dataset.address = u.address;
          cb.style.cssText = 'width: 20px; height: 20px; cursor: pointer; accent-color: #5fd3a5;';
          
          // Badge del monto (destacado)
          const amountBadge = document.createElement('div');
          amountBadge.style.cssText = `
            font-size: 24px;
            font-weight: 700;
            color: #5fd3a5;
            text-shadow: 0 2px 8px rgba(95,211,165,0.3);
            letter-spacing: 0.5px;
          `;
          amountBadge.textContent = `${u.amount} LMM`;
          
          topRow.appendChild(cb);
          topRow.appendChild(amountBadge);
          
          // Info del UTXO (txId + outputIndex) - más compacto
          const infoRow = document.createElement('div');
          infoRow.style.cssText = `
            font-size: 11px;
            color: #888;
            text-align: center;
            word-break: break-all;
            padding: 8px 12px;
            background: rgba(0,0,0,0.05);
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            max-width: 100%;
          `;
          infoRow.textContent = `${u.txId.substring(0, 20)}...${u.txId.substring(u.txId.length - 20)} #${u.outputIndex}`;
          
          // Botón Burn (solo si no es winelover con imagen)
          const burnBtn = document.createElement('button');
          burnBtn.textContent = 'Burn';
          burnBtn.className = 'burn-btn';
          burnBtn.style.cssText = `
            padding: 8px 24px;
            border-radius: 8px;
            background: linear-gradient(135deg, #c00 0%, #a00 100%);
            color: #fff;
            border: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(204,0,0,0.3);
          `;
          burnBtn.onmouseenter = () => {
            burnBtn.style.transform = 'scale(1.05)';
            burnBtn.style.boxShadow = '0 4px 12px rgba(204,0,0,0.5)';
          };
          burnBtn.onmouseleave = () => {
            burnBtn.style.transform = 'scale(1)';
            burnBtn.style.boxShadow = '0 2px 8px rgba(204,0,0,0.3)';
          };
          burnBtn.onclick = (e) => {
            e.preventDefault();
            showToast('Funcionalidad Burn no implementada en esta demo');
          };
          
          // Estructura común: topRow + infoRow
          div.appendChild(topRow);
          div.appendChild(infoRow);
          
          // Si es winelover, añadir la imagen y botón Move
          if (userType === 'winelover' && userImg) {
            console.log(`[UTXO][${i}] Añadiendo imagen y botón Move para winelover`, {userImg, utxo: u});
            
            // Imagen de la botella (img-bottle)
            const imgDiv = document.createElement('div');
            imgDiv.className = 'user-bottle-img-wrapper';
            imgDiv.style.cssText = 'width: 100%; margin-top: 8px; text-align: center;';
            imgDiv.innerHTML = `<img src="${userBottleImg || '/public/images/default-bottle.png'}" 
              alt="Imagen botella o icono" 
              style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.15);"
              onclick="window.showZoomImage && window.showZoomImage('${userBottleImg || '/public/images/default-bottle.png'}')">`;
            div.appendChild(imgDiv);

            // Fila de botones: Burn y Move alineados
            const btnRow = document.createElement('div');
            btnRow.style.cssText = 'display: flex; justify-content: center; align-items: center; width: 100%; gap: 12px; margin-top: 12px;';

            // Actualizar estilos del burnBtn para que coincida con moveBtn
            burnBtn.style.cssText = `
              padding: 8px 24px;
              border-radius: 8px;
              background: linear-gradient(135deg, #c00 0%, #a00 100%);
              color: #fff;
              border: none;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(204,0,0,0.3);
            `;

            const moveBtn = document.createElement('button');
            moveBtn.className = 'move-btn-user-popup';
            moveBtn.textContent = 'Move';
            moveBtn.style.cssText = `
              padding: 8px 24px;
              border-radius: 8px;
              background: linear-gradient(135deg, #FFA726 0%, #FB8C00 100%);
              color: #fff;
              border: none;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(255,167,38,0.3);
            `;
            moveBtn.onmouseenter = () => {
              moveBtn.style.transform = 'scale(1.05)';
              moveBtn.style.boxShadow = '0 4px 12px rgba(255,167,38,0.5)';
            };
            moveBtn.onmouseleave = () => {
              moveBtn.style.transform = 'scale(1)';
              moveBtn.style.boxShadow = '0 2px 8px rgba(255,167,38,0.3)';
            };
            moveBtn.onclick = () => window.open(`http://localhost:3000/demo-wallet/web-demo.html`,'_blank');

            btnRow.appendChild(burnBtn);
            btnRow.appendChild(moveBtn);
            div.appendChild(btnRow);

            console.log(`[UTXO][${i}] Imagen y botones alineados añadidos al contenedor`, div);
          } else {
            // Para bodegas u otros: solo agregar el botón Burn
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = 'width: 100%; display: flex; justify-content: center; margin-top: 8px;';
            btnContainer.appendChild(burnBtn);
            div.appendChild(btnContainer);
          }
          
          utxoListEl.appendChild(div);
        });
      }
      
      // Renderizar UTXOs pendientes
      if (Array.isArray(utxosPendientes) && utxosPendientes.length > 0) {
        // Encabezado de UTXOs pendientes
        const pendingHeader = document.createElement('div');
        pendingHeader.style.cssText = `
          font-weight: 700;
          color: #fdb45d;
          margin-bottom: 16px;
          margin-top: 20px;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding-bottom: 8px;
          border-bottom: 2px solid rgba(253,180,93,0.3);
        `;
        pendingHeader.textContent = '⏳ Pendientes';
        utxoListEl.appendChild(pendingHeader);
        
        utxosPendientes.forEach((u, i) => {
          // No se suman al total porque están pendientes
          const div = document.createElement('div');
          div.className = 'utxo-container wallet-utxo-container';
          
          // Estilos mejorados para UTXOs pendientes (tema naranja/amarillo)
          div.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            padding: 16px;
            margin-bottom: 12px;
            background: linear-gradient(135deg, rgba(253,180,93,0.15) 0%, rgba(253,180,93,0.05) 100%);
            border: 2px solid rgba(253,180,93,0.4);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(253,180,93,0.2);
            opacity: 0.85;
          `;
          
          // Badge de "PENDIENTE"
          const pendingBadge = document.createElement('div');
          pendingBadge.style.cssText = `
            background: linear-gradient(135deg, #fdb45d 0%, #FB8C00 100%);
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 2px 8px rgba(253,180,93,0.4);
          `;
          pendingBadge.textContent = 'Pendiente';
          
          // Fila del monto
          const amountRow = document.createElement('div');
          amountRow.style.cssText = `
            font-size: 22px;
            font-weight: 700;
            color: #fdb45d;
            text-shadow: 0 2px 8px rgba(253,180,93,0.3);
            letter-spacing: 0.5px;
          `;
          amountRow.textContent = `${u.amount} LMM`;
          
          // Info del UTXO (txId + outputIndex)
          const infoRow = document.createElement('div');
          infoRow.style.cssText = `
            font-size: 11px;
            color: #888;
            text-align: center;
            word-break: break-all;
            padding: 8px 12px;
            background: rgba(253,180,93,0.1);
            border-radius: 6px;
            font-family: 'Courier New', monospace;
            max-width: 100%;
          `;
          infoRow.textContent = `${u.txId.substring(0, 20)}...${u.txId.substring(u.txId.length - 20)} #${u.outputIndex}`;
          
          div.appendChild(pendingBadge);
          div.appendChild(amountRow);
          div.appendChild(infoRow);
          utxoListEl.appendChild(div);
        });
      }
      
      // Mostrar mensaje si no hay UTXOs
      if ((!Array.isArray(utxos) || utxos.length === 0) && (!Array.isArray(utxosPendientes) || utxosPendientes.length === 0)) {
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
  utxosPendientes: [],
  loaded: false
};

// --- Limpiar estado y UI ---
function resetWalletUI() {
  console.log('[WALLET][RESET] Limpiando estado y UI');
  walletState = { pub: null, priv: null, utxos: [], utxosPendientes: [], loaded: false };
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
    const url = `/api/utxo-balance?address=${encodeURIComponent(address)}`;
    console.log('[WALLET][FETCH UTXOS] URL:', url);
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch utxos: " + res.status);
    const data = await res.json();
    console.log('[WALLET][FETCH UTXOS] Data:', data);
    // Nueva estructura: { success, data: { utxos, utxosPendientes } }
    if (data && data.success && data.data) {
      if (Array.isArray(data.data.utxos) || Array.isArray(data.data.utxosPendientes)) {
        return {
          utxos: Array.isArray(data.data.utxos) ? data.data.utxos : [],
          utxosPendientes: Array.isArray(data.data.utxosPendientes) ? data.data.utxosPendientes : [],
        };
      }
      // Legacy: si solo hay un array
      if (Array.isArray(data.data)) return { utxos: data.data, utxosPendientes: [] };
    }
    if (Array.isArray(data)) return { utxos: data, utxosPendientes: [] };
    if (data && Array.isArray(data.utxos)) return { utxos: data.utxos, utxosPendientes: [] };
    return { utxos: [], utxosPendientes: [] };
  } catch (err) {
    console.error('[WALLET][FETCH UTXOS][ERROR]', err);
    return [];
  }
}

// --- Importar wallet: descifrado y visualización ---
document.getElementById('wallet-import').addEventListener('click', async () => {
      const { utxos, utxosPendientes } = await fetchUTXOs(walletState.pub);
      walletState.utxos = utxos;
      walletState.utxosPendientes = utxosPendientes;
      let total = 0;
      utxoListEl.innerHTML = '';
      // Mostrar UTXOs disponibles
      if (Array.isArray(utxos) && utxos.length > 0) {
        const title = document.createElement('div');
        title.innerHTML = '<b>UTXOs Disponibles</b>';
        utxoListEl.appendChild(title);
        utxos.forEach((u, i) => {
          total += u.amount || 0;
          const div = document.createElement('div');
          div.className = 'utxo-container wallet-utxo-container';
          const cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.className = 'utxo-checkbox';
          cb.id = 'utxo_' + i;
          cb.dataset.txid = u.txId;
          cb.dataset.outputindex = u.outputIndex;
          cb.dataset.amount = u.amount;
          cb.dataset.address = u.address;
          const label = document.createElement('label');
          label.htmlFor = cb.id;
          label.style = 'flex:1;cursor:pointer;';
          label.innerHTML = `<span style=\"font-weight:500;\">${u.amount}</span> <span class=\"wallet-utxo-label\">${u.txId} #${u.outputIndex}</span>`;
          div.appendChild(cb);
          div.appendChild(label);
          utxoListEl.appendChild(div);
        });
      } else {
        utxoListEl.innerHTML += '<span class=\"muted\">No hay UTXOs disponibles.</span>';
      }
      // Mostrar UTXOs pendientes
      if (Array.isArray(utxosPendientes) && utxosPendientes.length > 0) {
        const title = document.createElement('div');
        title.innerHTML = '<b>UTXOs Pendientes</b>';
        utxoListEl.appendChild(title);
        utxosPendientes.forEach((u, i) => {
          const div = document.createElement('div');
          div.className = 'utxo-container wallet-utxo-container utxo-pending';
          const label = document.createElement('span');
          label.innerHTML = `<span style=\"font-weight:500;\">${u.amount}</span> <span class=\"wallet-utxo-label\">${u.txId} #${u.outputIndex}</span>`;
          div.appendChild(label);
          utxoListEl.appendChild(div);
        });
      }
      balanceEl.textContent = String(total);
      console.log('[WALLET][IMPORT][POPUP] Wallet importada y UTXOs mostrados.');

});
