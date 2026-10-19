/**
 * notificationRoutes.js
 * Rutas para notificaciones de descorche / burn events
 */

import express from 'express';
import { getNotifications, handleBurnWebhook } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', getNotifications);
router.post('/webhook', handleBurnWebhook);

export default router;
