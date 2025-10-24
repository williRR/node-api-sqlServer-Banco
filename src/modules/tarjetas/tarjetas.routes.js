import { Router } from "express";
import {
  crearTarjeta,
  obtenerTarjetasCliente,
  obtenerTarjetasNegocio
} from "./tarjetas.controller.js";

const router = Router();

// Crear tarjeta (POST /api/v1/tarjeta)
router.post("/", crearTarjeta);

// Obtener tarjetas por cliente (GET /api/v1/tarjeta/cliente/:id)
router.get("/cliente/:id", obtenerTarjetasCliente);

// Obtener tarjetas por negocio (GET /api/v1/tarjeta/negocio/:id)
router.get("/negocio/:id", obtenerTarjetasNegocio);

export default router;