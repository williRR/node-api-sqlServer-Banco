import {    Router} from 'express';
import * as tarjetasController from './tarjetas.controller.js';

const router = Router();

// Endpoints de tarjetas
router.post('/', tarjetasController.crearTarjeta);

export default router;