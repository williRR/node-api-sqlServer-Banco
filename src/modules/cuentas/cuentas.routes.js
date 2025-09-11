import { Router } from "express";
import * as cuentasController from "./cuentas.controller.js";

const router = Router();

// Endpoints de cuentas
router.post("/", cuentasController.crearCuenta);
router.get("/:id", cuentasController.obtenerCuenta);
router.put("/:id", cuentasController.actualizarCuenta);
router.delete("/:id", cuentasController.eliminarCuenta);

export default router;
