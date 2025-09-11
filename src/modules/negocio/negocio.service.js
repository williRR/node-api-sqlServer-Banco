import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear negocio llamando a SP
export const crearNegocio = async (data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input("negonombre", sql.VarChar(50), data.nombre)
      .input("negnit", sql.VarChar(11), data.nit)
      .input("negociudad", sql.VarChar(30), data.ciudad)               
      .input("negodireccion", sql.VarChar(50), data.direccion)
      .input("negotelefono", sql.VarChar(20), data.telefono)
      .input("negoemail", sql.VarChar(50), data.email)
      .execute("sp_crearNegocio");   // tu procedimiento almacenado
    // Check if a recordset was returned and if it has at least one row
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0];
    } else {
      // Return a default success object or null if no data is returned
      return { mensaje: "Negocio creado exitosamente" };
    }
  } catch (error) {
    console.error("Error al crear negocio:", error);
    throw error;
  }
};

// // Obtener negocio
// export const obtenerNegocio = async (id) => {
//   try {
//     const pool = await sql.connect(dbSettings);
//     const result = await pool.request()
//       .input('id', sql.VarChar(5), id) // Define the parameter
//       .query('SELECT * FROM dbo.Negocio WHERE chr_negocodigo = @id'); // Use the parameter in the query
//     return result.recordset[0];
//   } catch (error) {
//     console.error('Error al obtener negocio:', error);
//     throw error;
//   }
// };

// Actualizar negocio
export const actualizarNegocio = async (id, data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input("negocodigo", sql.VarChar(5), id)
      .input("negonombre", sql.VarChar(50), data.nombre)
      .input("negnit", sql.VarChar(11), data.nit)
      .input("negociudad", sql.VarChar(30), data.ciudad)
      .input("negodireccion", sql.VarChar(50), data.direccion)
      .input("negotelefono", sql.VarChar(20), data.telefono)
      .input("negoemail", sql.VarChar(50), data.email)
      .execute("sp_actualizarNegocio"); // tu procedimiento almacenado
    return { message: "Negocio actualizado exitosamente" };
  } catch (error) {
    console.error("Error al actualizar negocio:", error);
    // Throw a more specific error or return a simple message
    throw new Error("Fallo la actualización del negocio.");
  }
}