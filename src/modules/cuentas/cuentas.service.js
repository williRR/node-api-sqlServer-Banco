import sql from "mssql";
import config, { dbSettings } from '../../config/db.js';  // tu configuración de conexión

// Crear cuenta llamando a SP
export const crearCuenta = async (data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
    .input("@monecodigo", sql.VarChar(2), data.clienteId)
    .input("@sucucodigo" , sql.VarChar(3), data.sucursalId)
    .input("@emplcreacuenta", sql.Int, data.empleadoId)
    .input("@cliecodigo", sql.Int, data.clienteId)
    .input("@negocodigo", sql.Int, data.negocioId)
    .input("@cuensaldo", sql.Decimal(18, 2), data.saldoInicial)
    .execute("sp_crearCuenta");   // tu procedimiento almacenado
  return result.recordset[0];
};

// // Obtener cuenta por ID
// export const obtenerCuenta = async (id) => {
//   const pool = await sql.connect(dbSettings);
//   const result = await pool.request()
//     .input("@cuentaId", sql.Int, id)
//     .execute("sp_obtenerCuenta");   // tu procedimiento almacenado
//   return result.recordset[0];
// };


// actualizar cuenta
export const actualizarCuenta = async (id, data) => {
  const pool = await sql.connect(dbSettings);
  const result = await pool.request()
        .input("@cuentaId", sql.Int, id)
        .input("@nuevoEstado", sql.VarChar(15), data.nuevoEstado)
        .execute("sp_actualizarEstadoCuenta");
      return result.recordset[0];
    };