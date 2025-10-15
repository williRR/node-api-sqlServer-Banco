import { Router } from "express";
import { 
  procesarPago, 
  obtenerMerchants,
  consultarTransaccion,
  consultarOrdenPago
} from "./pagos.controller.js";

const router = Router();

// Procesar pago con tarjeta
router.post("/charge", procesarPago);

// Obtener merchants válidos
router.get("/merchants", obtenerMerchants);

// ✅ NUEVOS: Consultar estado de transacciones
router.get("/transaccion/:transactionId", consultarTransaccion);
router.get("/orden/:codigoOrden", consultarOrdenPago);

export default router;
