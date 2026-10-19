/**
 * catalogRoutes.js
 * Rutas de catálogo (Denominaciones de Origen, Variedades, Tipos de Vino)
 */

import express from 'express';
import {
  getDenominaciones,
  getDenominacionById,
  getVariedades,
  getTiposVino
} from '../controllers/catalogController.js';

const router = express.Router();

router.get('/denominaciones', getDenominaciones);
router.get('/denominaciones/:id', getDenominacionById);
router.get('/variedades', getVariedades);
router.get('/tipos-vino', getTiposVino);

export default router;
