import { Router } from "express";
import * as negocioController from "./negocio.controller.js";

const router = Router();

// Endpoints de negocio
router.post("/", negocioController.crearNegocio);
router.get("/:id", negocioController.obtenerNegocio);
router.put("/:id", negocioController.actualizarNegocio);

export default router;