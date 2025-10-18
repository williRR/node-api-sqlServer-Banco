import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';

// Para obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Importar rutas de módulos
import authRoutes from "./modules/auth/auth.routes.js";
import clientesRoutes from "./modules/clientes/clientes.routes.js";
import negociosRoutes from "./modules/negocio/negocio.routes.js";
import cuentasRoutes from "./modules/cuentas/cuentas.routes.js";
import tarjetasRoutes from "./modules/tarjetas/tarjetas.routes.js";
import transaccionesRoutes from "./modules/transacciones/transacciones.routes.js";
//import movimientosRoutes from "./modules/movimientos/movimientos.routes.js";
import pagosRoutes from "./modules/pagos/pagos.routes.js";
//import adminRoutes from "./modules/admin/admin.routes.js";
//import auditoriaRoutes from "./modules/auditoria/auditoria.routes.js";

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Servir archivos estáticos (widget y demo)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint para servicios en la nube
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    service: "API Banco - Sistema Completo"
  });
});

// Endpoint raíz
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "API Banco - Sistema Completo con Pasarela de Pagos",
    version: "1.0.0",
    endpoints: [
      "/api/v1/cliente", 
      "/api/v1/negocio", 
      "/api/v1/cuenta", 
      "/api/v1/tarjeta", 
      "/api/v1/transacciones",
      "/api/v1/pagos",
      "/demo.html - Demo del widget de pagos",
      "/widget/banco-payment-widget.js - Widget JavaScript",
      "/health"
    ]
  });
});

// Rutas agrupadas por módulo
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cliente", clientesRoutes);
app.use("/api/v1/negocio", negociosRoutes);
app.use("/api/v1/cuenta", cuentasRoutes);
app.use("/api/v1/transacciones", transaccionesRoutes);
// app.use("/api/v1/movimientos", movimientosRoutes);
app.use("/api/v1/tarjeta", tarjetasRoutes);
app.use("/api/v1/pagos", pagosRoutes);
// app.use("/api/v1/admin", adminRoutes);
// app.use("/api/v1/auditoria", auditoriaRoutes);

export default app;
