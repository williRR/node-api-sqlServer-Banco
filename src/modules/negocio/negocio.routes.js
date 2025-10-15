import { Router } from "express";
import {
  crearNegocio,
  obtenerNegocio,
  actualizarNegocio,
  obtenerDashboard,
  verSaldoNegocio,
  verMovimientosNegocio,
} from "./negocio.controller.js";

const router = Router();

// Rutas básicas de negocio
router.post("/", crearNegocio);
router.get("/:id", obtenerNegocio);
router.put("/:id", actualizarNegocio);

// ✅ Rutas financieras (igual que clientes)
router.get("/:id/saldo", verSaldoNegocio);
router.get("/:id/movimientos", verMovimientosNegocio);

// Dashboard y órdenes
router.get("/:id/dashboard", obtenerDashboard);

export default router;