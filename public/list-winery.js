/**
 * list-winery.js - CartoLMM Version
 * Funcionalidad para el listado de bodegas desde la API proxy de CartoLMM
 * GET /api/users?role=winery&kyc_status=...&subscription_status=...&badges=...
 */

const API_BASE_URL = window.location.origin;

class WineryListManager {
  constructor() {
    this.wineries = [];
    this.filteredWineries = [];
    this.currentPage = 1;
    this.itemsPerPage = 12;
    
    // Filtros
    this.searchQuery = '';
    this.kycStatus = '';
    this.subscriptionStatus = '';
    this.badges = [];
    this.sortBy = 'name-asc';
    this.hasSearched = false;

    // Cache de labels para badges dinámicos
    this.badgeLabels = {};
    this.catalogToastShown = false;

    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.syncHeaderOffset();
    window.addEventListener('resize', () => this.syncHeaderOffset());

    await this.populateFilterOptions();
    
    // Cargar filtros desde URL
    this.loadFiltersFromURL();
    
    // Si hay filtros en URL, ejecutar búsqueda automáticamente
    if (this.hasSearched) {
      await this.loadWineries();
    }
  }

  async populateFilterOptions() {
    try {
      const catalog = await this.loadCatalogFromWineries();

      this.populateSelect('doFilter', catalog.denominaciones, 'Select DO');
      this.populateSelect('uvaFilter', catalog.variedades, 'Select grape');
      this.populateSelect('estiloFilter', catalog.tiposVino, 'Select style');

      this.setSelectAvailability('doFilter', catalog.denominaciones.length > 0, 'No DO available');
      this.setSelectAvailability('uvaFilter', catalog.variedades.length > 0, 'No grapes available');
      this.setSelectAvailability('estiloFilter', catalog.tiposVino.length > 0, 'No styles available');

      const hasAnyCatalogData =
        catalog.denominaciones.length > 0 ||
        catalog.variedades.length > 0 ||
        catalog.tiposVino.length > 0;

      if (!hasAnyCatalogData) {
        this.showCatalogToast('warning', 'Catalog is empty. Dynamic filters are disabled.');
      }

      console.log('✅ [CartoLMM Winery] Filtros dinámicos cargados:', {
        denominaciones: catalog.denominaciones.length,
        variedades: catalog.variedades.length,
        tiposVino: catalog.tiposVino.length
      });
    } catch (error) {
      console.error('❌ [CartoLMM Winery] Error cargando filtros dinámicos:', error);
      this.setSelectAvailability('doFilter', false, 'Catalog unavailable');
      this.setSelectAvailability('uvaFilter', false, 'Catalog unavailable');
      this.setSelectAvailability('estiloFilter', false, 'Catalog unavailable');
      this.showCatalogToast('error', 'Unable to load catalog. Dynamic filters are disabled.');
    }
  }

  async loadCatalogFromWineries() {
    const response = await fetch(`${API_BASE_URL}/api/users?role=winery&limit=500`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = await response.json();
    const wineries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.users)
          ? payload.users
          : [];

    const denominacionesById = new Map();
    const variedadesByToken = new Map();
    const tiposByToken = new Map();

    wineries.forEach((winery) => {
      const denominaciones = Array.isArray(winery?.denominaciones) ? winery.denominaciones : [];

      denominaciones.forEach((do_) => {
        if (do_?.id && do_?.nombre) {
          denominacionesById.set(do_.id, {
            value: `do_${do_.id}`,
            label: `${do_.tipo || 'DO'} ${do_.nombre}`
          });
        }

        const variedades = Array.isArray(do_?.variedades) ? do_.variedades : [];
        variedades.forEach((variedad) => {
          const nombre = variedad?.nombre;
          if (!nombre) return;
          const token = this.normalizeBadgeToken(nombre);
          variedadesByToken.set(token, {
            value: `uva_${token}`,
            label: nombre
          });
        });

        const tiposVino = Array.isArray(do_?.tipos_vino) ? do_?.tipos_vino : [];
        tiposVino.forEach((tipo) => {
          const nombre = tipo?.nombre;
          if (!nombre) return;
          const token = this.normalizeBadgeToken(nombre);
          tiposByToken.set(token, {
            value: `estilo_${token}`,
            label: nombre
          });
        });
      });
    });

    const denominaciones = Array.from(denominacionesById.values())
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    const variedades = Array.from(variedadesByToken.values())
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    const tiposVino = Array.from(tiposByToken.values())
      .sort((a, b) => a.label.localeCompare(b.label, 'es'));

    return { denominaciones, variedades, tiposVino };
  }

  populateSelect(selectId, options, placeholder) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.disabled = false;

    select.innerHTML = `<option value="" disabled selected>${placeholder}</option>`;

    options.forEach((option) => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      select.appendChild(optionElement);

      this.badgeLabels[option.value] = option.label;
    });
  }

  setSelectAvailability(selectId, hasOptions, emptyMessage) {
    const select = document.getElementById(selectId);
    if (!select) return;

    if (hasOptions) {
      select.disabled = false;
      return;
    }

    select.disabled = true;
    select.innerHTML = `<option value="" disabled selected>${emptyMessage}</option>`;
  }

  showCatalogToast(type, message) {
    if (this.catalogToastShown) return;
    this.catalogToastShown = true;

    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 4500);
  }

  setupEventListeners() {
    // Botón Buscar
    document.getElementById('searchButton')?.addEventListener('click', () => {
      // Actualizar badges desde los select antes de buscar
      this.badges = [
        ...this.getSelectValues('doFilter'),
        ...this.getSelectValues('uvaFilter'),
        ...this.getSelectValues('estiloFilter'),
        ...this.getSelectValues('medallaFilter'),
      ];
      this.currentPage = 1;
      this.hasSearched = true;
      this.updateURLFilters();
      this.loadWineries();
    });

    // Botón Limpiar
    document.getElementById('resetButton')?.addEventListener('click', () => {
      this.clearFilters();
    });

    // Búsqueda (tiempo real)
    document.getElementById('searchWinery')?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      if (this.hasSearched) {
        this.currentPage = 1;
        this.filterAndSort();
        this.render();
      }
    });

    // KYC Status
    document.getElementById('kycStatus')?.addEventListener('change', (e) => {
      this.kycStatus = e.target.value;
    });

    // Subscription Status
    document.getElementById('subscriptionStatus')?.addEventListener('change', (e) => {
      this.subscriptionStatus = e.target.value;
    });

    // Badges (multi-select por listas)
    const updateBadgesFromLists = () => {
      this.badges = [
        ...this.getSelectValues('doFilter'),
        ...this.getSelectValues('uvaFilter'),
        ...this.getSelectValues('estiloFilter'),
        ...this.getSelectValues('medallaFilter'),
      ];
      if (this.hasSearched) {
        this.currentPage = 1;
        this.filterAndSort();
        this.render();
      }
    };

    document.getElementById('doFilter')?.addEventListener('change', updateBadgesFromLists);
    document.getElementById('uvaFilter')?.addEventListener('change', updateBadgesFromLists);
    document.getElementById('estiloFilter')?.addEventListener('change', updateBadgesFromLists);
    document.getElementById('medallaFilter')?.addEventListener('change', updateBadgesFromLists);

    // Ordenamiento
    document.getElementById('sortBy')?.addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      if (this.hasSearched) {
        this.currentPage = 1;
        this.filterAndSort();
        this.render();
      }
    });

    // Reintentar en caso de error
    document.getElementById('retryButton')?.addEventListener('click', () => {
      this.loadWineries();
    });

    // Modal
    document.getElementById('closeWineryModal')?.addEventListener('click', this.closeModal.bind(this));
    document.getElementById('closeWineryModalBtn')?.addEventListener('click', this.closeModal.bind(this));
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    this.searchQuery = params.get('search') || '';
    this.kycStatus = params.get('kyc_status') || '';
    this.subscriptionStatus = params.get('subscription_status') || '';
    this.badges = params.get('badges') ? params.get('badges').split(',').filter(Boolean) : [];
    this.sortBy = params.get('sort') || 'name-asc';

    // Actualizar inputs
    document.getElementById('searchWinery').value = this.searchQuery;
    document.getElementById('kycStatus').value = this.kycStatus;
    document.getElementById('subscriptionStatus').value = this.subscriptionStatus;
    this.applySelectValues('doFilter', this.badges);
    this.applySelectValues('uvaFilter', this.badges);
    this.applySelectValues('estiloFilter', this.badges);
    this.applySelectValues('medallaFilter', this.badges);
    document.getElementById('sortBy').value = this.sortBy;

    // Si hay filtros en URL, buscar automáticamente
    if (this.searchQuery || this.kycStatus || this.subscriptionStatus || this.badges.length > 0) {
      this.hasSearched = true;
    }
  }

  updateURLFilters() {
    const params = new URLSearchParams();
    
    if (this.searchQuery) params.set('search', this.searchQuery);
    if (this.kycStatus) params.set('kyc_status', this.kycStatus);
    if (this.subscriptionStatus) params.set('subscription_status', this.subscriptionStatus);
    if (this.badges.length > 0) params.set('badges', this.badges.join(','));
    if (this.sortBy !== 'name-asc') params.set('sort', this.sortBy);

    const queryString = params.toString();
    const url = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', url);
  }

  clearFilters() {
    this.searchQuery = '';
    this.kycStatus = '';
    this.subscriptionStatus = '';
    this.badges = [];
    this.sortBy = 'name-asc';
    this.hasSearched = false;
    this.wineries = [];
    this.filteredWineries = [];

    // Limpiar inputs
    document.getElementById('searchWinery').value = '';
    document.getElementById('kycStatus').value = '';
    document.getElementById('subscriptionStatus').value = '';
    this.clearSelect('doFilter');
    this.clearSelect('uvaFilter');
    this.clearSelect('estiloFilter');
    this.clearSelect('medallaFilter');
    document.getElementById('sortBy').value = 'name-asc';

    // Limpiar URL
    window.history.replaceState({}, '', window.location.pathname);

    // Limpiar vista
    document.getElementById('wineryListContainer').innerHTML = '';
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('paginationContainer').innerHTML = '';
  }

  async loadWineries() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    
    loadingState.classList.remove('hidden');
    errorState.classList.add('hidden');

    try {
      // Construir URL con filtros usando el endpoint de proxy /api/users
      const params = new URLSearchParams({
        role: 'winery'
      });

      if (this.kycStatus) params.append('kyc_status', this.kycStatus);
      if (this.subscriptionStatus) params.append('subscription_status', this.subscriptionStatus);
      if (this.badges.length > 0) params.append('badges', this.badges.join(','));

      const url = `${API_BASE_URL}/api/users?${params.toString()}`;
      
      console.log('🔍 [CartoLMM Winery] Consultando:', {
        url,
        filters: {
          role: 'winery',
          kyc_status: this.kycStatus || 'all',
          subscription_status: this.subscriptionStatus || 'all',
          badges: this.badges
        }
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Normalizar respuesta del proxy
      if (Array.isArray(data)) {
        this.wineries = data;
      } else if (data.data && Array.isArray(data.data)) {
        this.wineries = data.data;
      } else if (data.users && Array.isArray(data.users)) {
        this.wineries = data.users;
      } else {
        console.warn('Estructura de respuesta inesperada:', data);
        this.wineries = [];
      }

      console.log('📊 [CartoLMM Winery] Bodegas obtenidas:', this.wineries.length);

      if (this.wineries.length === 0) {
        console.warn('No se encontraron bodegas con los filtros especificados');
      }

      loadingState.classList.add('hidden');
      this.filterAndSort();
      this.render();

    } catch (error) {
      console.error('❌ [CartoLMM Winery] Error al cargar bodegas:', error);
      
      loadingState.classList.add('hidden');
      errorState.classList.remove('hidden');
      document.getElementById('errorMessage').textContent = 
        `Error: ${error.message}`;
    }
  }

  filterAndSort() {
    // Filtrar por búsqueda y badges
    this.filteredWineries = this.wineries.filter(winery => {
      // Filtrar por búsqueda
      const nameMatch = (winery.nombre || '').toLowerCase().includes(this.searchQuery);
      const emailMatch = (winery.email || '').toLowerCase().includes(this.searchQuery);
      const searchPass = this.searchQuery === '' || nameMatch || emailMatch;

      // Filtrar por badges
      if (this.badges.length === 0) {
        return searchPass;
      }

      // Generar badges dinámicamente desde las denominaciones de la bodega
      const wineryBadges = this.generateBadgesFromWinery(winery);
      
      // Si hay badges seleccionados, la bodega debe tener AL MENOS UNO de los badges
      const badgesPass = this.badges.some(selectedBadge => 
        wineryBadges.includes(selectedBadge)
      );

      return searchPass && badgesPass;
    });

    console.log('🎯 Filtrado local:', {
      antes: this.wineries.length,
      despues: this.filteredWineries.length,
      query: this.searchQuery || 'ninguna'
    });

    // Ordenar
    this.filteredWineries.sort((a, b) => {
      switch (this.sortBy) {
        case 'name-asc':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'name-desc':
          return (b.nombre || '').localeCompare(a.nombre || '');
        case 'created-newest':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'created-oldest':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        default:
          return 0;
      }
    });
  }

  generateBadgesFromWinery(winery) {
    const badges = [];

    if (!winery.denominaciones || !Array.isArray(winery.denominaciones)) {
      return badges;
    }

    winery.denominaciones.forEach(do_ => {
      // Badge de denominación
      if (do_.id) {
        badges.push(`do_${do_.id}`);
      }

      // Badges de variedades
      if (do_.variedades && Array.isArray(do_.variedades)) {
        do_.variedades.forEach(v => {
          if (v.nombre) {
            const normalizedName = this.normalizeBadgeToken(v.nombre);
            badges.push(`uva_${normalizedName}`);
          }
        });
      }

      // Badges de tipos de vino
      if (do_.tipos_vino && Array.isArray(do_.tipos_vino)) {
        do_.tipos_vino.forEach(t => {
          if (t.nombre) {
            const normalizedName = this.normalizeBadgeToken(t.nombre);
            badges.push(`estilo_${normalizedName}`);
          }
        });
      }
    });

    return badges;
  }

  render() {
    const container = document.getElementById('wineryListContainer');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');

    if (this.filteredWineries.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      paginationContainer.innerHTML = '';
      return;
    }

    emptyState.classList.add('hidden');

    // Calcular paginación
    const totalPages = Math.ceil(this.filteredWineries.length / this.itemsPerPage);
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const endIdx = startIdx + this.itemsPerPage;
    const paginatedWineries = this.filteredWineries.slice(startIdx, endIdx);

    // Renderizar tarjetas
    container.innerHTML = paginatedWineries.map(winery => this.createWineryCard(winery)).join('');

    // Agregar event listeners a botones de tarjetas
    document.querySelectorAll('.winery-view-btn').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        this.showWineryDetail(paginatedWineries[idx]);
      });
    });

    // Renderizar paginación
    this.renderPagination(totalPages, paginationContainer);
  }

  createWineryCard(winery) {
    const nombre = winery.nombre || 'Sin nombre';
    const email = winery.email || 'No especificado';
    const kycStatus = winery.kyc_status || 'pendiente';
    const subscribStatus = winery.subscription_status || 'activa';
    const createdAt = winery.created_at 
      ? new Date(winery.created_at).toLocaleDateString('es-ES') 
      : 'N/A';
    
    const categoriesHtml = winery.categorias && winery.categorias.length > 0
      ? winery.categorias.slice(0, 3).map(cat => 
          `<span class="winery-category-tag">${this.escapeHtml(cat)}</span>`
        ).join('')
      : '<span class="winery-category-tag">Sin categorías</span>';

    const badgesHtml = winery.badges && winery.badges.length > 0
      ? winery.badges.slice(0, 3).map((badge) => 
          `<span class="winery-badge-tag">${this.escapeHtml(this.getBadgeLabel(badge))}</span>`
        ).join('')
      : '<span class="winery-badge-tag">Sin badges</span>';

    const denominacionesData = this.extractDenominacionesInfo(winery);
    const dosHtml = this.createDosSection(denominacionesData);

    const imgSrc = this.getWineryImageSrc(winery);
    return `
      <div class="winery-card">
        <div class="user-bottle-img-wrapper bodega-img-full"><img src="${imgSrc}" alt="Imagen botella o icono" class="bottle-img-card" onclick="window.showZoomImage && window.showZoomImage('${imgSrc}')"></div>
        <div class="winery-card-header">
          <h3 class="winery-card-name">${this.escapeHtml(nombre)}</h3>
          <span class="winery-role-badge">Bodega</span>
        </div>
        <p class="winery-card-email">${this.escapeHtml(email)}</p>
        <div class="winery-card-info">
          <div class="winery-info-row">
            <span class="winery-info-label">KYC:</span>
            <span class="winery-info-value">${this.escapeHtml(kycStatus)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Suscripción:</span>
            <span class="winery-info-value">${this.escapeHtml(subscribStatus)}</span>
          </div>
          <div class="winery-info-row">
            <span class="winery-info-label">Registrado:</span>
            <span class="winery-info-value">${createdAt}</span>
          </div>
        </div>
        <div class="winery-card-categories">
          ${categoriesHtml}
        </div>
        <div class="winery-card-badges">
          ${badgesHtml}
        </div>
        ${dosHtml}
        <div class="winery-card-actions">
          <button class="winery-view-btn">Ver Detalles</button>
        </div>
      </div>
    `;
  }

  showWineryDetail(winery) {
    const modal = document.getElementById('wineryDetailModal');
    
    document.getElementById('modalWineryName').textContent = winery.nombre || 'Sin nombre';
    document.getElementById('modalWineryEmail').textContent = winery.email || 'No especificado';
    document.getElementById('modalWineryId').textContent = winery.id || 'N/A';
    document.getElementById('modalWineryProvider').textContent = winery.provider || 'email';
    document.getElementById('modalWineryKYC').textContent = winery.kyc_status || 'pendiente';
    document.getElementById('modalWinerySubscription').textContent = winery.subscription_status || 'activa';
    const createdAt = winery.created_at 
      ? new Date(winery.created_at).toLocaleDateString('es-ES')
      : 'N/A';
    document.getElementById('modalWineryCreated').textContent = createdAt;

    // Imagen de la bodega en el modal
    let imgSrc = this.getWineryImageSrc(winery);
    let imgHtml = `<div class="user-bottle-img-wrapper bodega-img-full bottle-img-modal"><img src="${imgSrc}" alt="Imagen botella o icono" class="bottle-img" onclick="window.showZoomImage && window.showZoomImage('${imgSrc}')"></div>`;
    // Insertar imagen arriba del modal
    const modalHeader = document.querySelector('.winery-detail-header');
    if (modalHeader && !modalHeader.querySelector('img')) {
      modalHeader.insertAdjacentHTML('afterbegin', imgHtml);
    } else if (modalHeader && modalHeader.querySelector('img')) {
      modalHeader.querySelector('img').src = imgSrc;
    }

    // Categorías
    const categoriesHtml = winery.categorias && winery.categorias.length > 0
      ? winery.categorias.map(cat => `<span class="winery-category-tag">${this.escapeHtml(cat)}</span>`).join(' ')
      : 'Sin categorías';
    document.getElementById('modalWineryCategories').innerHTML = categoriesHtml;

    const badgesHtml = winery.badges && winery.badges.length > 0
      ? winery.badges.map((badge) => `<span class="winery-badge-tag">${this.escapeHtml(this.getBadgeLabel(badge))}</span>`).join(' ')
      : 'Sin badges';
    document.getElementById('modalWineryBadges').innerHTML = badgesHtml;

    // Denominaciones, Variedades y Tipos
    const doData = this.extractDenominacionesInfo(winery);
    const dosHtml = doData.dos.length > 0
      ? doData.dos.map(do_ => `<span class="winery-do-tag">${this.escapeHtml(do_.tipo)} ${this.escapeHtml(do_.nombre)}</span>`).join(' ')
      : 'Sin denominaciones';
    document.getElementById('modalWineryDenominaciones').innerHTML = dosHtml;

    const variedadesHtml = doData.variedades.length > 0
      ? doData.variedades.map(v => `<span class="winery-variedad-tag">${this.escapeHtml(v)}</span>`).join(' ')
      : 'Sin variedades';
    document.getElementById('modalWineryVariedades').innerHTML = variedadesHtml;

    const tiposHtml = doData.tipos.length > 0
      ? doData.tipos.map(t => `<span class="winery-tipo-tag">${this.escapeHtml(t)}</span>`).join(' ')
      : 'Sin tipos';
    document.getElementById('modalWineryTipos').innerHTML = tiposHtml;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    const modal = document.getElementById('wineryDetailModal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }

  renderPagination(totalPages, container) {
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = `<span class="pagination-info">Página ${this.currentPage} de ${totalPages}</span>`;
    
    html += `<button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
             onclick="wineryManager.goToPage(${this.currentPage - 1})">← Anterior</button>`;
    
    const maxButtons = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" onclick="wineryManager.goToPage(1)">1</button>`;
      if (startPage > 2) html += '<span class="pagination-info">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
               onclick="wineryManager.goToPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += '<span class="pagination-info">...</span>';
      html += `<button class="pagination-btn" onclick="wineryManager.goToPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
             onclick="wineryManager.goToPage(${this.currentPage + 1})">Siguiente →</button>`;

    container.innerHTML = html;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredWineries.length / this.itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      this.currentPage = page;
      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getSelectValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions)
      .map((option) => option.value)
      .filter((value) => value);
  }

  applySelectValues(selectId, values) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const hasValues = values.length > 0;
    Array.from(select.options).forEach((option) => {
      if (!option.value) {
        option.selected = !hasValues;
        return;
      }
      option.selected = values.includes(option.value);
    });
  }

  clearSelect(selectId) {
    this.applySelectValues(selectId, []);
  }

  syncHeaderOffset() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const measured = Math.ceil(header.offsetHeight || 0);
    const height = Math.max(96, Math.min(measured || 0, 180));
    document.documentElement.style.setProperty('--header-height', `${height}px`);
  }

  getBadgeLabel(badge) {
    if (this.badgeLabels[badge]) {
      return this.badgeLabels[badge];
    }

    const labels = {
      crianza_joven: 'Crianza Joven',
      crianza_crianza: 'Crianza',
      crianza_reserva: 'Reserva',
      crianza_gran_reserva: 'Gran Reserva',
      cert_ecologico: 'Cert Ecologico',
      cert_biodinamico: 'Cert Biodinamico',
      cert_vegano: 'Cert Vegano',
      cert_sin_sulfitos: 'Cert Sin Sulfitos',
      premiada: 'Premiada',
      medalla_oro: 'Medalla Oro',
      medalla_plata: 'Medalla Plata',
      medalla_bronce: 'Medalla Bronce',
    };

    return labels[badge] || badge;
  }

  normalizeBadgeToken(text) {
    if (!text) return '';

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  getWineryImageSrc(winery) {
    const imageFromProfile = winery?.userCard?.img || winery?.usercard_img;
    const imageFromBottle = winery?.img_bottle || winery?.imgBottle || winery?.['img-bottle'] || winery?.img;
    const selected = imageFromProfile || imageFromBottle;

    if (typeof selected === 'string' && selected.trim()) {
      return selected.trim();
    }

    return '/images/default-bottle.png';
  }

  extractDenominacionesInfo(winery) {
    const result = {
      dos: [],
      variedades: new Set(),
      tipos: new Set()
    };

    if (!winery.denominaciones || !Array.isArray(winery.denominaciones)) {
      return result;
    }

    winery.denominaciones.forEach(do_ => {
      result.dos.push({
        id: do_.id,
        nombre: do_.nombre,
        tipo: do_.tipo || 'DO'
      });

      if (do_.variedades && Array.isArray(do_.variedades)) {
        do_.variedades.forEach(v => result.variedades.add(v.nombre));
      }

      if (do_.tipos_vino && Array.isArray(do_.tipos_vino)) {
        do_.tipos_vino.forEach(t => result.tipos.add(t.nombre));
      }
    });

    result.variedades = Array.from(result.variedades);
    result.tipos = Array.from(result.tipos);

    return result;
  }

  createDosSection(data) {
    if (data.dos.length === 0 && data.variedades.length === 0 && data.tipos.length === 0) {
      return '';
    }

    let html = '<div class="winery-card-dos">';

    if (data.dos.length > 0) {
      html += '<div class="winery-dos-section">';
      html += '<span class="winery-dos-label">🏅 DO:</span> ';
      html += data.dos.slice(0, 2).map(do_ => 
        `<span class="winery-do-tag">${this.escapeHtml(do_.tipo)} ${this.escapeHtml(do_.nombre)}</span>`
      ).join('');
      if (data.dos.length > 2) {
        html += `<span class="winery-more-tag">+${data.dos.length - 2}</span>`;
      }
      html += '</div>';
    }

    if (data.variedades.length > 0) {
      html += '<div class="winery-variedades-section">';
      html += '<span class="winery-dos-label">🍇 Uvas:</span> ';
      html += data.variedades.slice(0, 3).map(v => 
        `<span class="winery-variedad-tag">${this.escapeHtml(v)}</span>`
      ).join('');
      if (data.variedades.length > 3) {
        html += `<span class="winery-more-tag">+${data.variedades.length - 3}</span>`;
      }
      html += '</div>';
    }

    if (data.tipos.length > 0) {
      html += '<div class="winery-tipos-section">';
      html += '<span class="winery-dos-label">🍷 Tipos:</span> ';
      html += data.tipos.slice(0, 3).map(t => 
        `<span class="winery-tipo-tag">${this.escapeHtml(t)}</span>`
      ).join('');
      if (data.tipos.length > 3) {
        html += `<span class="winery-more-tag">+${data.tipos.length - 3}</span>`;
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }
}

// Inicializar cuando el DOM esté listo
let wineryManager;
document.addEventListener('DOMContentLoaded', () => {
  wineryManager = new WineryListManager();
});
