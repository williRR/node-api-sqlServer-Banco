import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear cliente llamando a SP

export const crearCliente = async (data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input("cliepaterno", sql.VarChar(25), data.paterno)
      .input("cliematerno", sql.VarChar(25), data.materno)
      .input("clienombre", sql.VarChar(30), data.nombre)
      .input("cliedni", sql.VarChar(14), data.dni)
      .input("clienacimiento", sql.Date, data.nacimiento)
      .input("clieciudad", sql.VarChar(30), data.ciudad)
      .input("cliedireccion", sql.VarChar(50), data.direccion)
      .input("clietelefono", sql.VarChar(20), data.telefono)
      .input("clieemail", sql.VarChar(50), data.email)
      .execute("sp_crearCliente");

    // Check if a recordset was returned and if it has at least one row
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0];
    } else {
      // Return a default success object or null if no data is returned
      return { mensaje: "Cliente creado exitosamente" };
    }
  } catch (error) {
    console.error("Error al crear cliente:", error);
    throw error;
  }
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
      .input('id', sql.Int, id) // Define the parameter
      .execute('sp_selectCliente'); // Use the parameter in the query

    return result.recordset[0];
  } catch (error) {
    console.error('Error al obtener el cliente:', error.message);
    throw error;
  }
};


// Actualizar cliente
export const actualizarCliente = async (id, data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      // Pass the 'id' parameter from the URL, not from the data object
      .input("cliecodigo", sql.Int, id) 
      .input("cliepaterno", sql.VarChar(25), data.paterno)
      .input("cliematerno", sql.VarChar(25), data.materno)
      .input("clienombre", sql.VarChar(30), data.nombre)
      .input("clienacimiento", sql.Date, data.nacimiento)
      .input("clieciudad", sql.VarChar(30), data.ciudad)
      .input("cliedireccion", sql.VarChar(50), data.direccion)
      .input("clietelefono", sql.VarChar(20), data.telefono)
      .input("clieemail", sql.VarChar(50), data.email)
      .execute("sp_actualizarCliente");

    // The stored procedure doesn't return a recordset on an update,
    // so it's safer to return a success message instead of a record.
    return { message: "Cliente actualizado exitosamente" };
    
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    // Throw a more specific error or return a simple message
    throw new Error("Fallo la actualización del cliente.");
  }
};