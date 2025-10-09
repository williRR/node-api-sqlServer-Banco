import express from "express";
import controller from "./pagos.controller.js";

const router = express.Router();

// Ruta existente del banco para autorización interna
router.post("/autorizar", controller.autorizarPago);

// Nueva ruta de la pasarela para pagos externos
router.post("/charge", controller.validateCharge, controller.processPaymentGateway);

export default router;
