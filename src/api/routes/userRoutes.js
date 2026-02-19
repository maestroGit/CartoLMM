/**
 * userRoutes.js
 * Rutas para gestión de usuarios (proxy a magnumslocal)
 */

import express from 'express';
import { getUsers, getUserById, getUserStats } from '../controllers/userController.js';

const router = express.Router();

/**
 * GET /api/users - Listar usuarios
 * Query params: page, limit, role, provider, kyc_status, search, includeWallets
 */
router.get('/', getUsers);

/**
 * GET /api/users/stats - Estadísticas de usuarios
 */
router.get('/stats', getUserStats);

/**
 * GET /api/users/:id - Obtener usuario por ID
 * Query params: includeWallets
 */
router.get('/:id', getUserById);

export default router;
