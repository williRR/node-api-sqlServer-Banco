import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear cuenta llamando a SP
export const crearCuenta = async (data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      // Fixes: Mapped data properties to the correct SQL parameters
      .input("monecodigo", sql.VarChar(2), data.monedaId)
      .input("sucucodigo", sql.VarChar(3), data.sucursalId)
      .input("emplcreacuenta", sql.Int, data.empleadoId)
      .input("cliecodigo", sql.Int, data.clienteId)
      .input("negocodigo", sql.Int, data.negocioId)
      .input("cuensaldo", sql.Decimal(18, 2), data.saldoInicial)
      .execute("sp_crearCuenta");

    // The stored procedure returns a recordset, so we can return it.
    if (result.recordset && result.recordset.length > 0) {
      return result.recordset[0];
    } else {
      // Return a default success object if no recordset is returned.
      return { message: "Cuenta creada exitosamente" };
    }
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    throw new Error("Fallo la creación de la cuenta.");
  }
};

// // Obtener cuenta por ID
// export const obtenerCuenta = async (id) => {
//   const pool = await sql.connect(dbSettings);
//   const result = await pool.request()
//     .input("@cuentaId", sql.Int, id)
//     .execute("sp_obtenerCuenta");   // tu procedimiento almacenado
//   return result.recordset[0];
// };


// Actualizar cuenta
export const actualizarCuenta = async (id, data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      // Fixes: Add '@' to match SQL parameter name convention
      .input("cuencodigo", sql.Int, id)
      .input("nuevoEstado", sql.VarChar(15), data.nuevoEstado)
      .execute("sp_actualizarEstadoCuenta");

    // The stored procedure doesn't return a recordset on an update,
    // so it's safer to return a success message.
    return { message: "Cuenta actualizada exitosamente" };
    
  } catch (error) {
    console.error("Error al actualizar cuenta:", error);
    throw new Error("Fallo la actualización de la cuenta.");
  }
};