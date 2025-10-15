import { getConnection } from "../../config/db.js";
import sql from "mssql";

// Crear negocio llamando a SP
export const crearNegocio = async (data) => {
  try {
    const pool = await getConnection();
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
//     const pool = await getConnection();
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
    const pool = await getConnection();
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
};

// Obtener saldo de un negocio
export const obtenerSaldoNegocio = async (negocioId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, parseInt(negocioId));
    
    // ✅ Query usando los nombres correctos de columnas según tu modelo
    const result = await request.query(`
      SELECT 
        c.int_cuencodigo AS CuentaID,
        c.dec_cuensaldo AS Saldo,
        c.vch_cuenestado AS Estado,
        c.chr_monecodigo AS Moneda,
        c.chr_cuenclave AS ClaveCuenta
      FROM Cuenta c
      WHERE c.int_negocodigo = @NegocioID AND c.vch_cuenestado = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return {
      negocioId: parseInt(negocioId),
      cuentas: result.recordset,
      totalSaldo: result.recordset.reduce((sum, cuenta) => sum + parseFloat(cuenta.Saldo || 0), 0)
    };
  } catch (error) {
    console.error('Error en obtenerSaldoNegocio:', error);
    throw error;
  }
};

// Obtener movimientos de un negocio
export const obtenerMovimientosNegocio = async (negocioId, { limite = 20, pagina = 1 }) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    
    request.input('NegocioID', sql.Int, parseInt(negocioId));
    request.input('Limite', sql.Int, parseInt(limite));
    request.input('Offset', sql.Int, offset);

    // ✅ Query con OFFSET...FETCH y nombres correctos de columnas
    const result = await request.query(`
      SELECT 
        m.int_cuencodigo AS CuentaID,
        m.int_movinumero AS MovimientoNumero,
        m.dtt_movifecha AS FechaMovimiento,
        m.int_tipocodigo AS TipoMovimiento,
        m.dec_moviimporte AS Monto,
        m.int_cuenreferencia AS CuentaReferencia,
        m.vch_movitransaccionid AS TransaccionID
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
      WHERE c.int_negocodigo = @NegocioID
      ORDER BY m.dtt_movifecha DESC
      OFFSET @Offset ROWS
      FETCH NEXT @Limite ROWS ONLY
    `);

    return {
      movimientos: result.recordset,
      pagina: parseInt(pagina),
      limite: parseInt(limite),
      total: result.recordset.length
    };
  } catch (error) {
    console.error('Error en obtenerMovimientosNegocio:', error);
    throw error;
  }
};