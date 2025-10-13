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

// 💰 Obtener saldo de cuenta del cliente
export const obtenerSaldoCliente = async (clienteId) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .query(`
        SELECT 
          c.int_cuencodigo as numeroCuenta,
          c.dec_cuensaldo as saldo,
          c.vch_cuenestado as estado,
          m.vch_monedescripcion as moneda,
          cl.vch_clienombre as nombreCliente,
          cl.vch_cliepaterno as apellidoPaterno
        FROM Cuenta c
        INNER JOIN Cliente cl ON c.int_cliecodigo = cl.int_cliecodigo
        INNER JOIN Moneda m ON c.chr_monecodigo = m.chr_monecodigo
        WHERE cl.int_cliecodigo = @clienteId
          AND c.vch_cuenestado = 'ACTIVO'
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const cuenta = result.recordset[0];
    return {
      cliente: `${cuenta.nombreCliente} ${cuenta.apellidoPaterno}`,
      numeroCuenta: cuenta.numeroCuenta,
      saldo: parseFloat(cuenta.saldo),
      moneda: cuenta.moneda,
      estado: cuenta.estado
    };
  } catch (error) {
    throw new Error('Error al obtener saldo del cliente: ' + error.message);
  }
};

// 📋 Obtener movimientos del cliente
export const obtenerMovimientosCliente = async (clienteId, { limite = 20, pagina = 1 }) => {
  try {
    // Convertir a enteros para evitar errores de SQL
    const limiteInt = parseInt(limite);
    const paginaInt = parseInt(pagina);
    const offset = (paginaInt - 1) * limiteInt;
    
    const pool = await sql.connect(dbSettings);
    
    const result = await pool.request()
      .input('clienteId', sql.Int, clienteId)
      .input('limite', sql.Int, limiteInt)
      .input('offset', sql.Int, offset)
      .query(`
        SELECT 
          m.int_movinumero as numeroMovimiento,
          m.dtt_movifecha as fecha,
          tm.vch_tipodescripcion as tipoMovimiento,
          tm.vch_tipoaccion as accion,
          m.dec_moviimporte as importe,
          m.vch_movitransaccionid as transaccionId,
          CASE 
            WHEN m.int_cuenreferencia IS NOT NULL THEN
              COALESCE(
                (SELECT CONCAT(cl2.vch_clienombre, ' ', cl2.vch_cliepaterno) 
                 FROM Cuenta c2 
                 LEFT JOIN Cliente cl2 ON c2.int_cliecodigo = cl2.int_cliecodigo 
                 WHERE c2.int_cuencodigo = m.int_cuenreferencia),
                (SELECT n2.vch_negonombre
                 FROM Cuenta c3
                 LEFT JOIN Negocio n2 ON c3.int_negocodigo = n2.int_negocodigo
                 WHERE c3.int_cuencodigo = m.int_cuenreferencia)
              )
            ELSE 'Sistema'
          END as destino
        FROM Movimiento m
        INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
        INNER JOIN TipoMovimiento tm ON m.int_tipocodigo = tm.int_tipocodigo
        WHERE c.int_cliecodigo = @clienteId
        ORDER BY m.dtt_movifecha DESC
        OFFSET @offset ROWS
        FETCH NEXT @limite ROWS ONLY
      `);

    return {
      movimientos: result.recordset.map(mov => ({
        numeroMovimiento: mov.numeroMovimiento,
        fecha: mov.fecha,
        tipo: mov.tipoMovimiento,
        accion: mov.accion,
        importe: parseFloat(mov.importe),
        transaccionId: mov.transaccionId,
        destino: mov.destino
      })),
      pagina: paginaInt,
      limite: limiteInt,
      total: result.recordset.length
    };
  } catch (error) {
    throw new Error('Error al obtener movimientos del cliente: ' + error.message);
  }
};

// 💸 Realizar transferencia
export const realizarTransferencia = async ({ clienteId, cuentaDestino, monto, concepto }) => {
  try {
    const pool = await sql.connect(dbSettings);
    const request = pool.request();
    request.input('clienteId', sql.Int, clienteId);
    request.input('cuentaDestino', sql.Int, cuentaDestino);
    request.input('monto', sql.Decimal(18, 2), monto);
    request.input('concepto', sql.VarChar(200), concepto);
    request.output('resultado', sql.VarChar(15));
    request.output('mensaje', sql.VarChar(100));
    request.output('transaccionId', sql.VarChar(50));

    const result = await request.execute('sp_realizarTransferencia');
    const { resultado, mensaje, transaccionId } = result.output;

    return {
      success: resultado === 'EXITOSO',
      message: mensaje,
      data: resultado === 'EXITOSO' ? {
        transaccionId,
        monto: parseFloat(monto),
        cuentaDestino
      } : null
    };
  } catch (error) {
    throw new Error('Error al realizar transferencia: ' + error.message);
  }
};

// 🧾 Pagar orden de pago
export const pagarOrdenPago = async ({ clienteId, codigoOrden, claveAcceso }) => {
  try {
    const pool = await sql.connect(dbSettings);
    const request = pool.request();
    request.input('clienteId', sql.Int, clienteId);
    request.input('codigoOrden', sql.VarChar(20), codigoOrden);
    request.input('claveAcceso', sql.VarChar(8), claveAcceso);
    request.output('resultado', sql.VarChar(15));
    request.output('mensaje', sql.VarChar(100));
    request.output('ordenId', sql.Int);
    request.output('monto', sql.Decimal(18, 2));
    request.output('negocio', sql.VarChar(100));
    request.output('transaccionId', sql.VarChar(50));

    const result = await request.execute('sp_pagarOrdenPago');
    const { resultado, mensaje, ordenId, monto, negocio, transaccionId } = result.output;

    return {
      success: resultado === 'EXITOSO',
      message: mensaje,
      data: resultado === 'EXITOSO' ? {
        ordenId,
        monto: parseFloat(monto),
        negocio,
        transaccionId
      } : null
    };
  } catch (error) {
    throw new Error('Error al pagar orden: ' + error.message);
  }
};