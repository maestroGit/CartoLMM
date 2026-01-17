/**
 * Archivo principal para CartoLMM
 * Inicializa todo el sistema cuando se carga la página
 */

// Importar VineyardLayer y WineryLayer
import { VineyardLayer } from './leaflet/VineyardLayer.js';
import { WineryLayer } from './leaflet/WineryLayer.js';
let vineyardLayerInstance = null;
let wineryLayerInstance = null;
// Configuración global
window.CartoLMM = {
    version: '1.0.0',
    initialized: false,
    startTime: null,
    config: {
        debug: true,
        updateInterval: 30000, // 30 segundos
        animationDuration: 2000, // 2 segundos
        maxRetries: 3
    }
};

/**
 * Función principal de inicialización
 */
async function initializeCartoLMM() {
    // Inicializar capas de viñedos y bodegas después de crear el mapa
    setTimeout(() => {
        if (window.mapService && window.mapService.map) {
            vineyardLayerInstance = new VineyardLayer(window.mapService.map);
            wineryLayerInstance = new WineryLayer(window.mapService.map);
            // Añadir la capa de viñedos al control de capas como overlay
            if (window.mapService.layersControl) {
                if (vineyardLayerInstance.layer) {
                    window.mapService.layersControl.addOverlay(
                        vineyardLayerInstance.layer,
                        'Viñedos (landuse=vineyard)'
                    );
                }
                if (wineryLayerInstance.layer) {
                    window.mapService.layersControl.addOverlay(
                        wineryLayerInstance.layer,
                        'Bodegas (amenity=winery)'
                    );
                }
            }
        }
    }, 1000);
    try {
        console.log('🚀 Iniciando CartoLMM v' + window.CartoLMM.version);
        window.CartoLMM.startTime = Date.now();

        // Mostrar loader
        showLoader();

        // Verificar que todos los servicios estén disponibles
        if (!verifyServices()) {
            throw new Error('Servicios requeridos no disponibles');
        }

        // Inicializar dashboard (que inicializa todos los demás servicios)
        const initialized = await window.dashboardService.initialize();
        
        if (!initialized) {
            throw new Error('No se pudo inicializar el dashboard');
        }

        // Configurar listeners globales
        setupGlobalListeners();

        // Inicializar servicio de tiempo real si existe
        initializeRealtimeService();

        // Marcar como inicializado
        window.CartoLMM.initialized = true;

        // Ocultar loader
        hideLoader();

        // Mostrar mensaje de éxito
        const initTime = Date.now() - window.CartoLMM.startTime;
        console.log(`✅ CartoLMM inicializado en ${initTime}ms`);
        
        // Mostrar bienvenida
        showWelcomeMessage();

    } catch (error) {
        console.error('💥 Error fatal inicializando CartoLMM:', error);
        handleInitializationError(error);
    }
}

/**
 * Verifica que todos los servicios necesarios estén disponibles
 */
function verifyServices() {
    const requiredServices = [
        'mapService',
        'blockchainService', 
        'dashboardService'
    ];

    const missingServices = requiredServices.filter(service => !window[service]);
    
    if (missingServices.length > 0) {
        console.error('❌ Servicios faltantes:', missingServices);
        return false;
    }

    console.log('✅ Todos los servicios disponibles');
    return true;
}

/**
 * Inicializa el servicio de actualizaciones en tiempo real
 */
function initializeRealtimeService() {
    try {
        // Si ya existe desde el módulo ES6, reconectar mapService
        if (window.realtimeDashboardService) {
            console.log('🔄 Reconectando mapService a realtimeDashboardService...');
            window.realtimeDashboardService.mapService = window.mapService;
            
            // Cargar peers iniciales en el mapa
            if (window.mapService) {
                fetch('/api/peers')
                    .then(r => r.json())
                    .then(data => {
                        if (data.success && data.peers) {
                            console.log(`🗺️ Cargando ${data.peers.length} peers en el mapa...`);
                            window.mapService.loadPeersOnMap(data.peers);
                        }
                    })
                    .catch(err => console.error('❌ Error cargando peers:', err));
            }
        } else {
            console.warn('⚠️ realtimeDashboardService no encontrado');
        }
    } catch (error) {
        console.error('❌ Error inicializando servicio tiempo real:', error);
    }
}

/**
 * Configura listeners globales
 */
function setupGlobalListeners() {
    // Manejar errores globales
    window.addEventListener('error', (event) => {
        console.error('🚨 Error global:', event.error);
        handleGlobalError(event.error);
    });

    // Manejar promesas rechazadas
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Promesa rechazada:', event.reason);
        handleGlobalError(event.reason);
    });

    // Manejar visibilidad de la página
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            console.log('👁️ Página oculta - pausando actualizaciones');
            pauseUpdates();
        } else {
            console.log('👁️ Página visible - reanudando actualizaciones');
            resumeUpdates();
        }
    });

    // Manejar cambio de tamaño de ventana
    window.addEventListener('resize', debounce(() => {
        console.log('📏 Ventana redimensionada');
        handleWindowResize();
    }, 250));

    // Manejar teclas de acceso rápido
    document.addEventListener('keydown', (event) => {
        handleKeyboardShortcuts(event);
    });

    // Manejar selección de bodega
    window.addEventListener('bodega:selected', (event) => {
        handleBodegaSelected(event.detail);
    });

    console.log('✅ Listeners globales configurados');
}

/**
 * Maneja atajos de teclado
 */
function handleKeyboardShortcuts(event) {
    // Solo procesar si no estamos en un input
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    switch (event.key) {
        case 'h':
            // Mostrar ayuda
            showHelp();
            break;
        case 'r':
            // Refrescar datos
            if (event.ctrlKey) {
                event.preventDefault();
                refreshData();
            }
            break;
        case 'f':
            // Buscar
            if (event.ctrlKey) {
                event.preventDefault();
                focusSearch();
            }
            break;
        case 'Escape':
            // Cerrar modales
            closeAllModals();
            break;
    }
}

/**
 * Muestra el loader
 */
function showLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

/**
 * Oculta el loader
 */
function hideLoader() {
    const loader = document.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

/**
 * Muestra mensaje de bienvenida
 */
function showWelcomeMessage() {
    const notification = document.createElement('div');
    notification.className = 'notification success welcome';
    notification.innerHTML = `
        <h3>🍷 ¡Bienvenido a BlocksWine Map!</h3>
        <p>Sistema de visualización blockchain para bodegas de vino</p>
        <small>Presiona 'H' para ver atajos de teclado</small>
    `;
    
    document.body.appendChild(notification);
    console.log('[Welcome] Mensaje mostrado:', new Date().toISOString());
    // Mostrar 0.5s, luego fade-out 1s, luego remover
    setTimeout(() => {
        if (notification.parentNode) {
            console.log('[Welcome] DOM antes de eliminar:', document.querySelectorAll('.welcome-message'));
            notification.remove();
            console.log('[Welcome] Mensaje eliminado:', new Date().toISOString());
        }
    }, 3000); // visible duration 3 segundos
}

/**
 * Maneja errores de inicialización
 */
function handleInitializationError(error) {
    hideLoader();
    
    const errorContainer = document.createElement('div');
    errorContainer.className = 'initialization-error';
    errorContainer.innerHTML = `
        <div class="error-content">
            <h2>⚠️ Error de Inicialización</h2>
            <p>No se pudo inicializar CartoLMM correctamente.</p>
            <details>
                <summary>Detalles del error</summary>
                <pre>${error.message}</pre>
                <pre>${error.stack}</pre>
            </details>
            <div class="error-actions">
                <button onclick="location.reload()" class="btn-primary">
                    🔄 Reintentar
                </button>
                <button onclick="loadSafeMode()" class="btn-secondary">
                    🛡️ Modo Seguro
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(errorContainer);
}

/**
 * Maneja errores globales
 */
function handleGlobalError(error) {
    if (window.CartoLMM.config.debug) {
        console.error('🐛 Error debug:', error);
    }
    
    // Mostrar notificación de error no crítico
    showErrorNotification('Error del sistema', error.message);
}

/**
 * Muestra notificación de error
 */
function showErrorNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <strong>${title}</strong><br>
        ${message}
        <button onclick="this.parentElement.remove()" style="float: right;">×</button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 8000);
}

/**
 * Carga modo seguro con funcionalidad mínima
 */
function loadSafeMode() {
    console.log('🛡️ Cargando modo seguro...');
    
    // Limpiar errores
    document.querySelectorAll('.initialization-error').forEach(el => el.remove());
    
    // Inicializar solo el mapa sin conexión blockchain
    if (window.mapService) {
        window.mapService.initialize('map');
        
        // Cargar datos estáticos
        loadStaticData();
    }
    
    // Mostrar aviso de modo seguro
    const notice = document.createElement('div');
    notice.className = 'safe-mode-notice';
    notice.innerHTML = `
        <p>🛡️ Ejecutándose en <strong>Modo Seguro</strong></p>
        <p>Funcionalidad limitada - solo visualización estática</p>
    `;
    
    document.body.appendChild(notice);
}

/**
 * Carga datos estáticos para modo seguro
 */
async function loadStaticData() {
    try {
        // Fuente legacy eliminada. Cargar dataset vacío para modo seguro.
        const emptyData = [];
        if (window.mapService) {
            await window.mapService.loadBodegas(emptyData);
        }
    } catch (error) {
        console.error('❌ Error cargando datos estáticos:', error);
    }
}

/**
 * Pausa actualizaciones cuando la página no es visible
 */
function pauseUpdates() {
    if (window.dashboardService) {
        window.dashboardService.stopPeriodicUpdates();
    }
}

/**
 * Reanuda actualizaciones cuando la página es visible
 */
function resumeUpdates() {
    if (window.dashboardService && window.CartoLMM.initialized) {
        window.dashboardService.startPeriodicUpdates();
    }
}

/**
 * Maneja redimensionamiento de ventana
 */
function handleWindowResize() {
    if (window.mapService && window.mapService.map) {
        // Invalidar tamaño del mapa para que se redibuje
        setTimeout(() => {
            window.mapService.map.invalidateSize();
        }, 100);
    }
}

/**
 * Refrescar datos manualmente
 */
async function refreshData() {
    try {
        console.log('🔄 Refrescando datos...');
        
        if (window.dashboardService) {
            await window.dashboardService.loadInitialData();
        }
        
        showSuccessNotification('Datos actualizados correctamente');
    } catch (error) {
        console.error('❌ Error refrescando datos:', error);
        showErrorNotification('Error', 'No se pudieron actualizar los datos');
    }
}

/**
 * Mostrar ayuda
 */
function showHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'modal';
    helpModal.style.display = 'block';
    helpModal.innerHTML = `
        <div class="modal-content help-content">
            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
            <h2>🆘 Ayuda de CartoLMM</h2>
            
            <div class="help-section">
                <h3>⌨️ Atajos de Teclado</h3>
                <ul>
                    <li><kbd>H</kbd> - Mostrar esta ayuda</li>
                    <li><kbd>Ctrl+R</kbd> - Refrescar datos</li>
                    <li><kbd>Ctrl+F</kbd> - Buscar</li>
                    <li><kbd>Esc</kbd> - Cerrar modales</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>🗺️ Controles del Mapa</h3>
                <ul>
                    <li>Click en bodega - Ver detalles</li>
                    <li>Zoom - Rueda del ratón o +/-</li>
                    <li>Layers - Panel superior derecho</li>
                </ul>
            </div>
            
            <div class="help-section">
                <h3>📊 Información</h3>
                <p>CartoLMM v${window.CartoLMM.version}</p>
                <p>Sistema de visualización blockchain para bodegas</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(helpModal);
}

/**
 * Enfocar búsqueda
 */
function focusSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

/**
 * Cerrar todos los modales
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

/**
 * Mostrar notificación de éxito
 */
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Función debounce para limitar ejecuciones frecuentes
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Verificar estado del sistema
 */
function getSystemStatus() {
    return {
        initialized: window.CartoLMM.initialized,
        version: window.CartoLMM.version,
        uptime: window.CartoLMM.startTime ? Date.now() - window.CartoLMM.startTime : 0,
        services: {
            map: !!window.mapService?.map,
            blockchain: !!window.blockchainService?.isConnected,
            dashboard: !!window.dashboardService?.isInitialized
        }
    };
}

/**
 * Función de limpieza para cerrar la aplicación
 */
function cleanupCartoLMM() {
    console.log('🧹 Limpiando CartoLMM...');
    
    if (window.dashboardService) {
        window.dashboardService.destroy();
    }
    
    if (window.mapService) {
        window.mapService.destroy();
    }
    
    if (window.blockchainService) {
        window.blockchainService.disconnect();
    }
    
    window.CartoLMM.initialized = false;
}

/**
 * Maneja la selección de una bodega
 */
function handleBodegaSelected(bodega) {
    console.log('🍷 Manejando selección de bodega:', bodega);
    
    // Llenar el modal con los datos de la bodega
    const modal = document.getElementById('bodega-modal');
    const modalName = document.getElementById('modal-bodega-name');
    const modalRegion = document.getElementById('modal-region');
    const modalStock = document.getElementById('modal-stock');
    const modalNodeStatus = document.getElementById('modal-node-status');
    const modalLastActivity = document.getElementById('modal-last-activity');
    
    if (modal && modalName && modalRegion && modalStock && modalNodeStatus && modalLastActivity) {
        // Llenar los campos con los datos correctos
        modalName.textContent = bodega.name || 'Sin nombre';
        modalRegion.textContent = bodega.region || 'Sin región';
        modalStock.textContent = `${bodega.inventory?.stockCustodiado || 0} botellas`;
        modalNodeStatus.textContent = bodega.blockchain?.status || 'Desconocido';
        modalLastActivity.textContent = bodega.inventory?.ultimaActividad || 'No disponible';

        // Imagen de la botella
        let img = document.getElementById('modal-bottle-img');
        if (!img) {
            img = document.createElement('img');
            img.id = 'modal-bottle-img';
            img.style.width = '752px';
            img.style.maxWidth = '90%';
            img.style.height = 'auto';
            img.style.display = 'block';
            img.style.margin = '16px auto';
            // Insertar la imagen justo después del título
            modalName.parentNode.insertBefore(img, modalName.nextSibling);
        }
        img.src = bodega.imageUrl || '';
        img.alt = 'Botella de vino';
        img.onerror = function() {
            this.onerror = null;
            this.src = bodega.fallbackImage || '/public/images/IconoMagnum.png';
        };

        // Action buttons container (Custodiado / Disponible) under the image
        let actions = document.getElementById('bodega-modal-actions');
        if (!actions) {
            actions = document.createElement('div');
            actions.id = 'bodega-modal-actions';
            actions.style.display = 'flex';
            actions.style.gap = '24px';
            actions.style.marginBottom = '24px';
            actions.style.justifyContent = 'center';
            // Insert after the image
            img.parentNode.insertBefore(actions, img.nextSibling);
        }

        // Clear previous actions
        actions.innerHTML = '';

        const btnCustodiado = document.createElement('button');
        btnCustodiado.textContent = 'Custodiado';
        btnCustodiado.className = 'modal-action-btn modal-action-btn--custodiado';
        btnCustodiado.onclick = () => console.log('Consulta existencias');

        const btnDisponible = document.createElement('button');
        btnDisponible.textContent = 'Disponible';
        btnDisponible.className = 'modal-action-btn modal-action-btn--disponible';
        btnDisponible.onclick = () => console.log('Consulta disponibilidad');

        actions.appendChild(btnCustodiado);
        actions.appendChild(btnDisponible);

        // Mostrar el modal
        modal.classList.remove('hidden');

        // Cerrar modal al hacer click en el botón de cerrar
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => modal.classList.add('hidden');
        }
        
        // Cerrar modal al hacer click fuera del contenido
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        };
    } else {
        console.error('❌ No se encontraron elementos del modal');
    }
}

// Exponer funciones útiles globalmente
window.CartoLMM.init = initializeCartoLMM;
window.CartoLMM.status = getSystemStatus;
window.CartoLMM.cleanup = cleanupCartoLMM;
window.CartoLMM.refresh = refreshData;
window.CartoLMM.help = showHelp;

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCartoLMM);
} else {
    // DOM ya está listo
    initializeCartoLMM();
}

// Limpieza cuando se cierra la página
window.addEventListener('beforeunload', cleanupCartoLMM);

console.log('📋 main.js cargado - esperando inicialización...');