import sql from "mssql";
import { DB_DATABASE, DB_PASSWORD, DB_SERVER, DB_USER, DB_ENCRYPT, DB_TRUST_CERT } from "../config.js";

export const dbSettings = {
  user: DB_USER,
  password: DB_PASSWORD,
  server: DB_SERVER,
  database: DB_DATABASE,
  options: {
    encrypt: DB_ENCRYPT,
    trustServerCertificate: DB_TRUST_CERT,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

export const getConnection = async () => {
  try {
    console.log('🔌 Conectando a SQL Server...');
    console.log(`   Usuario: ${dbSettings.user}`);
    console.log(`   Servidor: ${dbSettings.server}`);
    console.log(`   Base de datos: ${dbSettings.database}`);
    console.log(`   Encrypt: ${dbSettings.options.encrypt}`);
    
    const pool = await sql.connect(dbSettings);
    console.log('✅ Conexión exitosa a SQL Server');
    return pool;
  } catch (error) {
    console.error('❌ Error conectando a SQL Server:', error.message);
    throw error;
  }
};

export { sql };
export default { sql, getConnection };
