/**
 * wineloverRoutes.js
 * Rutas de portfolio y botellas Magnum
 */

import express from 'express';
import { getPortfolio, getMagnumDetail } from '../controllers/wineloverController.js';

const router = express.Router();

router.get('/portfolio', getPortfolio);
router.get('/magnums', getPortfolio);
router.get('/magnums/:idOrToken', getMagnumDetail);

export default router;
