import { Router } from "express";
import { obtenerTarjetasCliente, obtenerTarjetasNegocio } from "./tarjetas.controller.js";

const router = Router();

// GET /api/v1/tarjeta/cliente/:id
router.get("/cliente/:id", obtenerTarjetasCliente);

// GET /api/v1/tarjeta/negocio/:id
router.get("/negocio/:id", obtenerTarjetasNegocio);

export default router;