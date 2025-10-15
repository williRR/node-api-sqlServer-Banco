// ✅ modules/transacciones/transacciones.routes.js
import { Router } from "express";
import {
  consultarTransaccion,
  listarTransaccionesMerchant
} from "./transacciones.controller.js";

const router = Router();

// Consultar transacción por ID
router.get("/:id", consultarTransaccion);

// Listar transacciones de un merchant
router.get("/merchant/:merchantId", listarTransaccionesMerchant);

export default router;
