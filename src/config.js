import { config } from "dotenv";

config();

export const PORT = process.env.PORT || 3000;
export const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ Variables de BD - valores por defecto SOLO para desarrollo
export const DB_USER = process.env.DB_USER || 'sa';
export const DB_PASSWORD = process.env.DB_PASSWORD || ''; // ⚠️ No poner contraseña aquí
export const DB_SERVER = process.env.DB_SERVER || 'localhost';
export const DB_DATABASE = process.env.DB_DATABASE || 'Banco';

// ✅ Opciones de conexión según entorno
export const DB_ENCRYPT = NODE_ENV === 'production' 
  ? true  // Siempre true en producción
  : (process.env.DB_ENCRYPT || 'false').toLowerCase() === 'true';

export const DB_TRUST_CERT = NODE_ENV === 'production'
  ? false // Siempre false en producción (usar certs válidos)
  : (process.env.DB_TRUST_CERT || 'true').toLowerCase() === 'true';

// ⚠️ Validación: En producción, exigir todas las variables
if (NODE_ENV === 'production') {
  const required = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_DATABASE'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ ERROR: Variables de entorno faltantes en producción: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Configuración para la pasarela de pagos
export const dbConfigPasarela = {
    user: DB_USER,
    password: DB_PASSWORD,
    server: DB_SERVER,
    database: DB_DATABASE,
    options: {
        encrypt: DB_ENCRYPT,
        enableArithAbort: true,
        trustServerCertificate: DB_TRUST_CERT
    }
};

// URL de la API del banco
export const BANK_API_URL = process.env.BANK_API_URL || `http://localhost:${PORT}/api/v1`;