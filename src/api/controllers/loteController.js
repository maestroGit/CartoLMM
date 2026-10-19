/**
 * loteController.js
 * Proxy para lotes de producción y trazabilidad de bodegas
 */

import { proxyGetRequest } from '../helpers/backendClient.js';

export const getLoteById = async (req, res) => {
  try {
    const { loteId } = req.params;
    const result = await proxyGetRequest(`/lotes/${loteId}`, req.query, {
      cacheKeyPrefix: `lotes:${loteId}`,
      cacheTtl: 60000
    });
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Error obteniendo lote ${req.params.loteId}`,
      details: error.message
    });
  }
};
