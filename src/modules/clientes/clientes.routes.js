import { Router } from "express";
import {
  crearCliente,
  obtenerCliente,
  actualizarCliente,
  verSaldo,
  verMovimientos,
  realizarTransferencia,
  pagarOrdenPago,
  registrarTransaccionPasarela
} from "./clientes.controller.js";

import { obtenerTarjetasCliente } from "../tarjetas/tarjetas.controller.js";

const router = Router();

// Rutas de clientes
router.post("/", crearCliente);
router.get("/:id", obtenerCliente);
router.put("/:id", actualizarCliente);

// Rutas financieras
router.get("/:id/saldo", verSaldo);
router.get("/:id/movimientos", verMovimientos);
router.post("/:id/transferir", realizarTransferencia);
router.post("/:id/pagar-orden", pagarOrdenPago);

// Ruta para registrar transacciones de pasarela
router.post("/transaccion/pasarela", registrarTransaccionPasarela);

// Nuevo endpoint: obtener tarjetas del cliente
// GET /api/v1/cliente/:id/tarjetas
router.get("/:id/tarjetas", obtenerTarjetasCliente);

export default router;

