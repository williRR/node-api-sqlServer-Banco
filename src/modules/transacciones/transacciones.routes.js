// modules/transacciones/transacciones.routes.js
import controller from './transacciones.controller.js'; // Importa el objeto { autorizarPago }
import { Router } from 'express';

const router = Router();

// Endpoint que la Pasarela de Pago llamará para autorizar un débito
// Funciona porque 'controller' es el objeto exportado por defecto
router.post('/autorizar', controller.autorizarPago);

export default router;