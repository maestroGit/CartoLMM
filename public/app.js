    // === Wallet Global Bodega: Cifrado/Descifrado/Carga ===
    const walletFileInput = document.getElementById('wallet-global-file');
    const walletPassInput = document.getElementById('wallet-global-pass');
    const encryptBtn = document.getElementById('wallet-global-encrypt');
    const decryptBtn = document.getElementById('wallet-global-decrypt');
    const uploadBtn = document.getElementById('wallet-global-upload');
    const statusDiv = document.getElementById('wallet-global-status');
    let loadedWalletJson = null;

    // Leer archivo wallet seleccionado
    if (walletFileInput) {
        walletFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    loadedWalletJson = JSON.parse(evt.target.result);
                    statusDiv.textContent = 'Wallet cargada.';
                } catch (err) {
                    statusDiv.textContent = 'Archivo inválido: ' + err.message;
                }
            };
            reader.readAsText(file);
        });
    }

    // Cifrar y descargar wallet
    if (encryptBtn) {
        encryptBtn.addEventListener('click', async () => {
            if (!loadedWalletJson) return statusDiv.textContent = 'Carga primero un archivo wallet.';
            const pass = walletPassInput.value;
            if (!pass) return statusDiv.textContent = 'Introduce una passphrase.';
            // Solo soporta wallets con privateKey y publicKey
            if (!loadedWalletJson.privateKey || !loadedWalletJson.publicKey) {
                return statusDiv.textContent = 'Wallet JSON debe tener privateKey y publicKey.';
            }
            try {
                const res = await fetch(`${apiBaseUrl}/wallet/encrypt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ privateKey: loadedWalletJson.privateKey, passphrase: pass })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error cifrando wallet');
                // Descargar archivo cifrado
                const out = {
                    publicKey: loadedWalletJson.publicKey,
                    ...data
                };
                const blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'wallet_cifrada.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                statusDiv.textContent = 'Wallet cifrada y descargada.';
            } catch (err) {
                statusDiv.textContent = 'Error: ' + err.message;
            }
        });
    }

    // Descifrar wallet (mostrar privateKey)
    if (decryptBtn) {
        decryptBtn.addEventListener('click', async () => {
            if (!loadedWalletJson) return statusDiv.textContent = 'Carga primero un archivo wallet.';
            const pass = walletPassInput.value;
            if (!pass) return statusDiv.textContent = 'Introduce una passphrase.';
            // Debe tener campos cifrados
            const { encryptedPrivateKey, salt, iv, tag } = loadedWalletJson;
            if (!encryptedPrivateKey || !salt || !iv || !tag) {
                return statusDiv.textContent = 'El archivo no parece ser una wallet cifrada.';
            }
            try {
                const res = await fetch(`${apiBaseUrl}/wallet/decrypt`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ encryptedPrivateKey, salt, iv, tag, passphrase: pass })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error descifrando wallet');
                statusDiv.textContent = 'PrivateKey: ' + data.privateKey;
            } catch (err) {
                statusDiv.textContent = 'Error: ' + err.message;
            }
        });
    }

    // Cargar wallet global en backend (como bodega)
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async () => {
            if (!loadedWalletJson) return statusDiv.textContent = 'Carga primero un archivo wallet.';
            const pass = walletPassInput.value;
            if (!pass) return statusDiv.textContent = 'Introduce una passphrase.';
            const { encryptedPrivateKey, salt, iv, tag, publicKey } = loadedWalletJson;
            if (!encryptedPrivateKey || !salt || !iv || !tag || !publicKey) {
                return statusDiv.textContent = 'El archivo no es una wallet cifrada válida.';
            }
            try {
                const res = await fetch(`${apiBaseUrl}/wallet/load-global`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ encryptedPrivateKey, salt, iv, tag, passphrase: pass, publicKey })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || 'Error cargando wallet global');
                statusDiv.textContent = 'Wallet global cargada en backend.';
            } catch (err) {
                statusDiv.textContent = 'Error: ' + err.message;
            }
        });
    }
// Inicializar app y wiring de UI cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando CartoLMM WebSocket Client (separado)...');
    if (window.CartoLMMWebSocket) {
        window.cartoLMMWebSocket = new window.CartoLMMWebSocket();
        // Exponer la instancia real de socket para todos los módulos
        window.socket = window.cartoLMMWebSocket.socket;
    } else {
        console.error('CartoLMMWebSocket no está cargado. Verifica el orden de los scripts.');
    }

    // UI: botón hamburger ejecuta directamente el "Switch" (toggle del sidebar)
    try {
        const toggleBtn = document.getElementById('toggle-metrics');
        const mainGrid = document.querySelector('.cartolmm-main');
        if (toggleBtn && mainGrid) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isOpen = mainGrid.classList.toggle('sidebar-open');
                // mantener atributo aria-expanded actualizado
                toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
                // evento para que otros módulos reaccionen si lo necesitan
                window.dispatchEvent(new CustomEvent('ui:sidebar-toggled', { detail: { open: isOpen } }));
            });
        }
    } catch (err) {
        console.warn('UI hamburger wiring error:', err);
    }

    // UI: botón de capas del mapa (📋 Capas) adaptado al nuevo header unificado
    // UI: Dashboard y BW-Wallet botones (unificados estilo magnumsmaster)
    try {
        const dashboardBtn = document.getElementById('dashboard-btn');
        if (dashboardBtn) {
            dashboardBtn.addEventListener('click', (e) => {
                // No impedir la navegación: permite abrir el href en nueva pestaña (target="_blank")
                console.log('Dashboard button clicked');
                // Si en el futuro quieres manejarlo internamente, puedes impedir la navegación
                // y abrir programáticamente: window.open(dashboardBtn.href, '_blank');
                window.dispatchEvent(new CustomEvent('ui:dashboard'));
            });
        }
        const walletBtn = document.getElementById('bw-wallet-btn');
        if (walletBtn) {
            walletBtn.addEventListener('click', () => {
                console.log('BW-Wallet external link opened');
            });
        }
    } catch (err) {
        console.warn('Dashboard/BW-Wallet wiring error:', err);
    }
    try {
        const layersBtn = document.getElementById('toggle-layers');
        if (layersBtn) {
            layersBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.mapService && typeof window.mapService.toggleLayersControl === 'function') {
                    window.mapService.toggleLayersControl();
                } else {
                    // reintento ligero hasta que mapService esté disponible
                    const retry = setInterval(() => {
                        if (window.mapService && typeof window.mapService.toggleLayersControl === 'function') {
                            clearInterval(retry);
                            window.mapService.toggleLayersControl();
                        }
                    }, 200);
                    // seguridad: cortar el reintento tras 5s
                    setTimeout(() => clearInterval(retry), 5000);
                }
            });
        }

        // --- Botón Vista: alternar entre vista actual y planisferio ---
        const vistaBtn = document.getElementById('toggle-3d');
        if (vistaBtn) {
            let lastView = null;
            vistaBtn.addEventListener('click', () => {
                if (!window.mapService || !window.mapService.map) return;
                const map = window.mapService.map;
                // Si ya estamos en el planisferio, volver a la vista anterior
                const worldZoom = 3;
                const worldCenter = [20, 0];
                const currentZoom = map.getZoom();
                const currentCenter = map.getCenter();
                if (Math.abs(currentZoom - worldZoom) < 0.5 &&
                    Math.abs(currentCenter.lat - worldCenter[0]) < 2 &&
                    Math.abs(currentCenter.lng - worldCenter[1]) < 2) {
                    // Volver a la vista anterior si existe
                    if (lastView) {
                        map.setView(lastView.center, lastView.zoom);
                    }
                } else {
                    // Guardar la vista actual y mostrar el planisferio
                    lastView = { center: [currentCenter.lat, currentCenter.lng], zoom: currentZoom };
                    map.setView(worldCenter, worldZoom);
                }
            });
        }
    } catch (err) {
        console.warn('Layers toggle wiring error:', err);
    }
});