import sql from "mssql";
import { dbSettings } from '../../config/db.js';

// Crear tarjeta llamando a SP
export const crearTarjeta = async (data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      // Pass the account code to the stored procedure
      .input("cuencodigo", sql.Int, data.cuencodigo)
      .execute("sp_crearTarjeta");

    // The stored procedure returns a recordset with the new card info.
    // Check if the recordset exists and return the first row.
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0];
    } else {
      // Fallback for unexpected cases where no recordset is returned.
      throw new Error("La tarjeta se creó, pero no se recuperaron los detalles.");
    }

  } catch (error) {
    console.error("Error al crear tarjeta:", error);
    // Throw a new error with a friendlier message for the client.
    throw new Error("Fallo la creación de la tarjeta.");
  }
};