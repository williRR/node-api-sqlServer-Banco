import { Router } from "express";
import { procesarPago, obtenerMerchants } from "./pagos.controller.js";

const router = Router();

// Ruta principal para procesar pagos
router.post("/charge", procesarPago);

// Obtener lista de merchants
router.get("/merchants", obtenerMerchants);

export default router;
