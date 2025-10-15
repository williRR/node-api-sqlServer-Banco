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

export default router;

