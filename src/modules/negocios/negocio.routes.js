

import { Router } from 'express';
import * as negocioController from './negocio.controller.js';

const router = Router();

// Rutas existentes para negocios
router.post('/', negocioController.crearNegocio);
router.get('/', negocioController.obtenerNegocios);
router.get('/:id', negocioController.obtenerNegocio);
router.put('/:id', negocioController.actualizarNegocio);

// 🆕 Nuevas rutas para funcionalidades de negocios
router.get('/:id/dashboard', negocioController.dashboard);
router.post('/:id/generar-orden', negocioController.generarOrdenPago);
router.get('/:id/ordenes', negocioController.verOrdenesPago);
router.get('/:id/ingresos', negocioController.verIngresos);

export default router;
