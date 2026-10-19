/**
 * catalogController.js
 * Proxy para catálogo de Denominaciones de Origen, Variedades de Uva y Tipos de Vino
 */

import { proxyGetRequest } from '../helpers/backendClient.js';

export const getDenominaciones = async (req, res) => {
  try {
    const result = await proxyGetRequest('/denominaciones', req.query, {
      cacheKeyPrefix: 'catalog:do',
      cacheTtl: 120000 // 2 minutos de caché para catálogo
    });
    return res.json(result);
  } catch (error) {
    console.warn('[Catalog] Error obteniendo denominaciones:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudieron obtener las denominaciones de origen',
      details: error.message
    });
  }
};

export const getDenominacionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await proxyGetRequest(`/denominaciones/${id}`, req.query, {
      cacheKeyPrefix: `catalog:do:${id}`,
      cacheTtl: 120000
    });
    return res.json(result);
  } catch (error) {
    return res.status(502).json({
      success: false,
      error: `Error obteniendo denominación ${req.params.id}`,
      details: error.message
    });
  }
};

export const getVariedades = async (req, res) => {
  try {
    const result = await proxyGetRequest('/variedades', req.query, {
      cacheKeyPrefix: 'catalog:variedades',
      cacheTtl: 120000
    });
    return res.json(result);
  } catch (error) {
    console.warn('[Catalog] Error obteniendo variedades:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudieron obtener las variedades',
      details: error.message
    });
  }
};

export const getTiposVino = async (req, res) => {
  try {
    const result = await proxyGetRequest('/tipos-vino', req.query, {
      cacheKeyPrefix: 'catalog:tipos-vino',
      cacheTtl: 120000
    });
    return res.json(result);
  } catch (error) {
    console.warn('[Catalog] Error obteniendo tipos de vino:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudieron obtener los tipos de vino',
      details: error.message
    });
  }
};
