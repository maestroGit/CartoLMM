/**
 * wineloverController.js
 * Proxy para colecciones, custodia y métricas patrimoniales de botellas Magnum
 */

import { proxyGetRequest } from '../helpers/backendClient.js';

export const getPortfolio = async (req, res) => {
  try {
    const result = await proxyGetRequest('/api/winelover/portfolio', req.query, {
      cacheKeyPrefix: 'winelover:portfolio',
      cacheTtl: 30000
    });
    return res.json(result);
  } catch (error) {
    console.warn('[Winelover] Error obteniendo portfolio:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudo obtener el portfolio de custodia',
      details: error.message
    });
  }
};

export const getMagnumDetail = async (req, res) => {
  try {
    const { idOrToken } = req.params;
    const result = await proxyGetRequest(`/api/winelover/magnums/${idOrToken}`, req.query, {
      cacheKeyPrefix: `winelover:magnum:${idOrToken}`,
      cacheTtl: 30000
    });
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Error obteniendo detalle de la botella Magnum ${req.params.idOrToken}`,
      details: error.message
    });
  }
};
