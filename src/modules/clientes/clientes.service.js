import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear cliente llamando a SP
export const crearCliente = async (data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("paterno", sql.VarChar(25), data.paterno)
    .input("materno", sql.VarChar(25), data.materno)
    .input("nombre", sql.VarChar(30), data.nombre)
    .input("dni", sql.VarChar(8), data.dni)
    .input("ciudad", sql.VarChar(30), data.ciudad)
    .input("direccion", sql.VarChar(50), data.direccion)
    .input("telefono", sql.VarChar(20), data.telefono)
    .input("email", sql.VarChar(50), data.email)
    .execute("usp_CrearCliente");   // tu procedimiento almacenado
  return result.recordset[0];
};

// // Obtener cliente
// export const obtenerCliente = async (id) => {
//   const pool = await sql.connect(dbSettings);
//   const result = await pool.request()
//     .input("idCliente", sql.VarChar(5), id)
//     .execute("usp_ObtenerCliente");
//   return result.recordset[0];
// };

// Obtener cliente


export const obtenerCliente = async (id) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input('id', sql.VarChar(5), id) // Define the parameter
      .query('SELECT * FROM dbo.Cliente WHERE chr_cliecodigo = @id'); // Use the parameter in the query

    return result.recordset[0];
  } catch (error) {
    console.error('Error al obtener el cliente:', error.message);
    throw error;
  }
};

// Actualizar cliente
export const actualizarCliente = async (id, data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("idCliente", sql.VarChar(5), id)
    .input("paterno", sql.VarChar(25), data.paterno)
    .input("materno", sql.VarChar(25), data.materno)
    .input("nombre", sql.VarChar(30), data.nombre)
    .input("ciudad", sql.VarChar(30), data.ciudad)
    .input("direccion", sql.VarChar(50), data.direccion)
    .input("telefono", sql.VarChar(20), data.telefono)
    .input("email", sql.VarChar(50), data.email)
    .execute("usp_ActualizarCliente");
  return result.recordset[0];
};
