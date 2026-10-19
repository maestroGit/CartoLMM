/**
 * loteRoutes.js
 * Rutas para lotes de producción
 */

import express from 'express';
import { getLoteById } from '../controllers/loteController.js';

const router = express.Router();

router.get('/:loteId', getLoteById);

export default router;
