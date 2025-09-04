import { Router } from "express";
import * as clientesController from "./clientes.controller.js";

const router = Router();

// Endpoints de clientes
router.post("/", clientesController.crearCliente);
router.get("/:id", clientesController.obtenerCliente);
router.put("/:id", clientesController.actualizarCliente);

export default router;
