import sql from "mssql";
import { DB_DATABASE, DB_PASSWORD, DB_SERVER, DB_USER } from "../../src/config.js";

// Configuración de base de datos con variables de entorno para producción
export const dbSettings = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'willirr123',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'BancoGT',
  options: {
    encrypt: process.env.NODE_ENV === 'production', // Encrypt en producción
    trustServerCertificate: process.env.NODE_ENV !== 'production',
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const getConnection = async () => {
  try {
    const pool = sql.connect(dbSettings);
    return pool;
  } catch (error) {
    console.error(error);
  }
};

export default { sql };
