import { Router } from "express";
import {
  crearNegocio,
  obtenerNegocio,
  actualizarNegocio,
  obtenerDashboard,
  generarOrdenPago,  // ✅ Debe estar importado
  obtenerOrdenes,
  obtenerIngresos,
  verSaldoNegocio,
  verMovimientosNegocio
} from "./negocio.controller.js";

const router = Router();

// Rutas básicas
router.post("/", crearNegocio);
router.get("/:id", obtenerNegocio);
router.put("/:id", actualizarNegocio);

// ✅ IMPORTANTE: Esta ruta debe existir
router.post("/:id/generar-orden", generarOrdenPago);

// Rutas financieras
router.get("/:id/saldo", verSaldoNegocio);
router.get("/:id/movimientos", verMovimientosNegocio);

// Dashboard y órdenes
router.get("/:id/dashboard", obtenerDashboard);
router.get("/:id/ordenes", obtenerOrdenes);
router.get("/:id/ingresos", obtenerIngresos);

export default router;