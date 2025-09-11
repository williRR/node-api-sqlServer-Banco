import express from "express";
import cors from "cors";
import morgan from "morgan";

// Importar rutas de módulos
//import authRoutes from "./modules/auth/auth.routes.js";
import clientesRoutes from "./modules/clientes/clientes.routes.js";
import negociosRoutes from "./modules/negocio/negocio.routes.js";
import cuentasRoutes from "./modules/cuentas/cuentas.routes.js";
import tarjetasRoutes from "./modules/tarjetas/tarjetas.routes.js";
//import movimientosRoutes from "./modules/movimientos/movimientos.routes.js";
//import pagosRoutes from "./modules/pagos/pagos.routes.js";
//import adminRoutes from "./modules/admin/admin.routes.js";
//import auditoriaRoutes from "./modules/auditoria/auditoria.routes.js";

const app = express();

// Middlewares globales
app.use(cors());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rutas agrupadas por módulo
//app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/cliente", clientesRoutes);
app.use("/api/v1/negocio", negociosRoutes);
app.use("/api/v1/cuenta", cuentasRoutes);
// app.use("/api/v1/movimientos", movimientosRoutes);
app.use("/api/v1/tarjeta", tarjetasRoutes);
// app.use("/api/v1/pagos", pagosRoutes);
// app.use("/api/v1/admin", adminRoutes);
// app.use("/api/v1/auditoria", auditoriaRoutes);

export default app;
