import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear negocio llamando a SP
export const crearNegocio = async (data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("@negonombre", sql.VarChar(50), data.nombre)
    .input("@negnit", sql.VarChar(11), data.tipo)
    .input("@negociudad", sql.VarChar(30), data.direccion)               
    .input("@negodireccion", sql.VarChar(50), data.telefono)
    .input("@negotelefono", sql.VarChar(20), data.email)
    .input("@negoemail", sql.VarChar(50), data.nit)
    .execute("sp_crearNegocio");   // tu procedimiento almacenado
  return result.recordset[0];
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
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("id", sql.VarChar(5), id)
    .input("negonombre", sql.VarChar(50), data.nombre)
    .input("negnit", sql.VarChar(11), data.tipo)
    .input("negociudad", sql.VarChar(30), data.direccion)               
    .input("negodireccion", sql.VarChar(50), data.telefono)
    .input("negotelefono", sql.VarChar(20), data.email)
    .input("negoemail", sql.VarChar(50), data.nit)
    .execute("sp_actualizarNegocio"); // tu procedimiento almacenado
  return result.recordset[0];
}