// ✅ modules/transacciones/transacciones.routes.js
import { Router } from 'express';
import controller from './transacciones.controller.js';

const router = Router();

/**
 * POST /autorizar
 * Simula la autorización de un débito.
 */
router.post('/autorizar', controller.autorizarPago);

export default router;
