import { Router } from "express";
import * as clientesController from "./clientes.controller.js";

const router = Router();

// Endpoints de clientes
router.post("/", clientesController.crearCliente);
router.get("/:id", clientesController.obtenerCliente);
router.put("/:id", clientesController.actualizarCliente);


// Rutas existentes para clientes
router.post('/', clientesController.crearCliente);
router.get('/:id', clientesController.obtenerCliente);
router.put('/:id', clientesController.actualizarCliente);

// 🆕 Nuevas rutas para funcionalidades de clientes
router.get('/:id/saldo', clientesController.verSaldo);
router.get('/:id/movimientos', clientesController.verMovimientos);
router.post('/:id/transferir', clientesController.realizarTransferencia);
router.post('/:id/pagar-orden', clientesController.pagarOrdenPago);

export default router;

