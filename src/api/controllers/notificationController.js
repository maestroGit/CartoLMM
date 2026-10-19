/**
 * notificationController.js
 * Proxy para eventos de descorche / burn events persistentes desde el backend
 */

import { proxyGetRequest } from '../helpers/backendClient.js';

export const getNotifications = async (req, res) => {
  try {
    const result = await proxyGetRequest('/notifications', req.query, {
      cacheKeyPrefix: 'notifications',
      cacheTtl: 15000 // 15s para eventos reactivos
    });
    return res.json(result);
  } catch (error) {
    console.warn('[Notifications] Error obteniendo notificaciones:', error.message);
    return res.status(502).json({
      success: false,
      error: 'No se pudieron obtener las notificaciones de descorche',
      details: error.message
    });
  }
};

export const handleBurnWebhook = async (req, res) => {
  try {
    const payload = req.body || {};
    const { broadcastUncorkEvent } = await import('../../websocket/events.js');
    broadcastUncorkEvent(payload);
    return res.status(200).json({ success: true, message: 'Burn event broadcasted to connected map clients' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
