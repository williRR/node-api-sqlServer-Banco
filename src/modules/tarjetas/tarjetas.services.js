import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear tarjeta llamando a SP
export const crearTarjeta = async (data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("@cuencodigo", sql.Int, data.numero)

    .execute("sp_crearTarjeta");
    return result.recordset[0];
};