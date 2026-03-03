/**
 * Servicio de métricas de negocio basado en endpoints respaldados por BD (magnumslocal)
 * Devuelve contadores para Winery, Wine Lovers, D.O., variedades y tipos de vino.
 */
class BusinessStatsService {
  constructor(baseUrl) {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '');
    this.cache = null;
    this.cacheTimestamp = 0;
    this.cacheTtlMs = 60 * 1000;
  }

  async fetchJson(path) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} en ${path}`);
    }

    return response.json();
  }

  isCacheFresh() {
    return this.cache && (Date.now() - this.cacheTimestamp) < this.cacheTtlMs;
  }

  extractCount(payload) {
    if (!payload) return null;
    if (typeof payload.count === 'number') return payload.count;
    if (typeof payload?.pagination?.total === 'number') return payload.pagination.total;
    if (Array.isArray(payload?.data)) return payload.data.length;
    if (Array.isArray(payload)) return payload.length;
    return null;
  }

  getRoleCount(byRole, roleNames) {
    if (!Array.isArray(byRole)) return null;

    const names = roleNames.map((r) => String(r).toLowerCase());

    return byRole.reduce((sum, row) => {
      const role = String(row?.role ?? row?.dataValues?.role ?? '').toLowerCase();
      if (!names.includes(role)) return sum;

      const rawCount = row?.count ?? row?.dataValues?.count ?? 0;
      const numericCount = Number(rawCount);
      return sum + (Number.isFinite(numericCount) ? numericCount : 0);
    }, 0);
  }

  estimateMagnumsFromBlocks(blocksPayload) {
    if (!blocksPayload) return null;

    const blocks = Array.isArray(blocksPayload?.data)
      ? blocksPayload.data
      : Array.isArray(blocksPayload)
        ? blocksPayload
        : [];

    let total = 0;

    for (const block of blocks) {
      const txs = Array.isArray(block?.data)
        ? block.data
        : Array.isArray(block?.transactions)
          ? block.transactions
          : [];

      for (const tx of txs) {
        const metadata = tx?.metadata || {};
        const bottlesRaw = metadata.bottles ?? metadata.botellas;
        const bottles = Number(bottlesRaw);
        if (Number.isFinite(bottles) && bottles > 0) {
          total += bottles;
        }
      }
    }

    return total;
  }

  async getStats() {
    if (this.isCacheFresh()) {
      return {
        ...this.cache,
        source: this.cache.source === 'database' ? 'database-cache' : 'partial-cache',
        cached: true
      };
    }

    const [usersRes, denominacionesRes, variedadesRes, tiposVinoRes, blocksRes] = await Promise.allSettled([
      this.fetchJson('/users/stats'),
      this.fetchJson('/denominaciones?page=1&limit=1'),
      this.fetchJson('/variedades'),
      this.fetchJson('/tipos-vino'),
      this.fetchJson('/blocks')
    ]);

    const warnings = [];
    const users = usersRes.status === 'fulfilled' ? usersRes.value : null;
    const denominaciones = denominacionesRes.status === 'fulfilled' ? denominacionesRes.value : null;
    const variedades = variedadesRes.status === 'fulfilled' ? variedadesRes.value : null;
    const tiposVino = tiposVinoRes.status === 'fulfilled' ? tiposVinoRes.value : null;
    const blocks = blocksRes.status === 'fulfilled' ? blocksRes.value : null;

    if (usersRes.status === 'rejected') warnings.push(usersRes.reason?.message || 'users/stats unavailable');
    if (denominacionesRes.status === 'rejected') warnings.push(denominacionesRes.reason?.message || 'denominaciones unavailable');
    if (variedadesRes.status === 'rejected') warnings.push(variedadesRes.reason?.message || 'variedades unavailable');
    if (tiposVinoRes.status === 'rejected') warnings.push(tiposVinoRes.reason?.message || 'tipos-vino unavailable');
    if (blocksRes.status === 'rejected') warnings.push(blocksRes.reason?.message || 'blocks unavailable');

    const byRole = users?.data?.byRole || null;

    let result = {
      wineries: usersRes.status === 'fulfilled' ? this.getRoleCount(byRole, ['winery', 'bodega']) : null,
      wineLovers: usersRes.status === 'fulfilled' ? this.getRoleCount(byRole, ['wine_lover', 'winelover', 'wine-lover', 'user']) : null,
      doRegions: denominacionesRes.status === 'fulfilled' ? this.extractCount(denominaciones) : null,
      grapeTypes: variedadesRes.status === 'fulfilled' ? this.extractCount(variedades) : null,
      wineTypes: tiposVinoRes.status === 'fulfilled' ? this.extractCount(tiposVino) : null,
      magnums: blocksRes.status === 'fulfilled' ? this.estimateMagnumsFromBlocks(blocks) : null,
      source: warnings.length === 0 ? 'database' : 'partial',
      warnings,
      lastUpdate: new Date().toISOString()
    };

    // Si hubo errores pero tenemos caché previa, conservar valores no-cero de la caché.
    if (warnings.length > 0 && this.cache) {
      result = {
        ...this.cache,
        ...result,
        wineries: result.wineries ?? this.cache.wineries ?? null,
        wineLovers: result.wineLovers ?? this.cache.wineLovers ?? null,
        doRegions: result.doRegions ?? this.cache.doRegions ?? null,
        grapeTypes: result.grapeTypes ?? this.cache.grapeTypes ?? null,
        wineTypes: result.wineTypes ?? this.cache.wineTypes ?? null,
        magnums: result.magnums ?? this.cache.magnums ?? null,
        source: 'partial-stale',
        warnings
      };
    }

    this.cache = result;
    this.cacheTimestamp = Date.now();

    return result;
  }
}

export default BusinessStatsService;
