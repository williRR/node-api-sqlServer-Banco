import { getConnection } from "../../config/db.js";
import sql from "mssql";

export const obtenerCliente = async (id) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, parseInt(id));
    
    const result = await request.query(`
      SELECT 
        int_cliecodigo AS ClienteID,
        vch_clienombre AS Nombre,
        vch_cliepaterno AS Paterno,
        vch_cliematerno AS Materno,
        chr_cliedni AS DNI,
        vch_clieciudad AS Ciudad,
        vch_cliedireccion AS Direccion,
        vch_clietelefono AS Telefono,
        vch_clieemail AS Email
      FROM Cliente 
      WHERE int_cliecodigo = @ClienteID
    `);

    return result.recordset.length > 0 ? result.recordset[0] : null;
  } catch (error) {
    console.error('Error en obtenerCliente:', error);
    throw error;
  }
};

export const actualizarCliente = async (id, data) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, parseInt(id));
    request.input('Nombre', sql.VarChar(30), data.nombre);
    request.input('Direccion', sql.VarChar(50), data.direccion);
    request.input('Telefono', sql.VarChar(20), data.telefono);
    request.input('Email', sql.VarChar(50), data.email);

    await request.query(`
      UPDATE Cliente 
      SET vch_clienombre = @Nombre,
          vch_cliedireccion = @Direccion,
          vch_clietelefono = @Telefono,
          vch_clieemail = @Email
      WHERE int_cliecodigo = @ClienteID
    `);

    return { success: true, message: 'Cliente actualizado' };
  } catch (error) {
    console.error('Error en actualizarCliente:', error);
    throw error;
  }
};

export const obtenerSaldoCliente = async (clienteId) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, parseInt(clienteId));
    
    // ✅ Query corregida con columnas que SÍ existen en tu modelo
    const result = await request.query(`
      SELECT 
        c.int_cuencodigo AS CuentaID,
        c.dec_cuensaldo AS Saldo,
        c.vch_cuenestado AS Estado,
        c.chr_monecodigo AS Moneda,
        c.chr_cuenclave AS ClaveCuenta
      FROM Cuenta c
      WHERE c.int_cliecodigo = @ClienteID AND c.vch_cuenestado = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return null;
    }

    return {
      clienteId: parseInt(clienteId),
      cuentas: result.recordset,
      totalSaldo: result.recordset.reduce((sum, cuenta) => sum + parseFloat(cuenta.Saldo || 0), 0)
    };
  } catch (error) {
    console.error('Error en obtenerSaldoCliente:', error);
    throw error;
  }
};

export const obtenerMovimientosCliente = async (clienteId, { limite = 20, pagina = 1 }) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    const offset = (parseInt(pagina) - 1) * parseInt(limite);
    
    request.input('ClienteID', sql.Int, parseInt(clienteId));
    request.input('Limite', sql.Int, parseInt(limite));
    request.input('Offset', sql.Int, offset);

    // ✅ Usar OFFSET...FETCH en lugar de TOP con OFFSET
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
      WHERE c.int_cliecodigo = @ClienteID
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
    console.error('Error en obtenerMovimientosCliente:', error);
    throw error;
  }
};

export const realizarTransferencia = async ({ clienteId, cuentaDestino, monto, concepto }) => {
  try {
    console.log('💸 Realizando transferencia...');
    console.log(`   Cliente: ${clienteId}`);
    console.log(`   Destino: ${cuentaDestino}`);
    console.log(`   Monto: ${monto}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('clienteId', sql.Int, parseInt(clienteId));
    request.input('cuentaDestino', sql.Int, parseInt(cuentaDestino));
    request.input('monto', sql.Decimal(18, 2), parseFloat(monto));
    request.input('concepto', sql.VarChar(200), concepto || 'Transferencia');

    console.log('🔄 Ejecutando sp_realizarTransferencia...');
    
    const result = await request.execute('sp_realizarTransferencia');
    
    console.log('✅ Procedimiento ejecutado');
    console.log('Resultado:', JSON.stringify(result.recordset, null, 2));

    if (!result.recordset || result.recordset.length === 0) {
      return {
        success: false,
        message: 'El procedimiento no devolvió datos'
      };
    }

    const data = result.recordset[0];

    if (data.Exito === 0 || data.Exito === false) {
      return {
        success: false,
        message: data.Mensaje || 'Error en la transferencia'
      };
    }

    // ✅ Emoji según tipo de cuenta
    const emoji = data.TipoCuentaDestino === 'NEGOCIO' ? '🏢' : '👤';

    return {
      success: true,
      data: {
        movimientoId: data.MovimientoID,
        cuentaOrigen: data.CuentaOrigen,
        cuentaDestino: data.CuentaDestino,
        tipoCuentaDestino: data.TipoCuentaDestino,
        nombreDestino: data.NombreDestino,
        monto: data.Monto,
        nuevoSaldo: data.NuevoSaldo,
        transaccionId: data.TransaccionID,
        mensaje: `${emoji} ${data.Mensaje}`
      }
    };

  } catch (error) {
    console.error('💥 Error en realizarTransferencia:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      message: error.message
    };
  }
};

export const pagarOrdenPago = async ({ clienteId, codigoOrden, claveAcceso }) => {
  try {
    console.log('🧾 Procesando pago de orden...');
    console.log(`   Cliente: ${clienteId}`);
    console.log(`   Código: ${codigoOrden}`);

    const pool = await getConnection();
    const request = pool.request();

    // ✅ Parámetros de ENTRADA
    request.input('clienteId', sql.Int, parseInt(clienteId));
    request.input('codigoOrden', sql.VarChar(20), codigoOrden);
    request.input('claveAcceso', sql.VarChar(8), claveAcceso);

    // ✅ Parámetros de SALIDA (OUTPUT) - ESTOS FALTABAN
    request.output('resultado', sql.VarChar(15));
    request.output('mensaje', sql.VarChar(100));
    request.output('ordenId', sql.Int);
    request.output('monto', sql.Decimal(18, 2));
    request.output('negocio', sql.VarChar(100));
    request.output('transaccionId', sql.VarChar(50));

    console.log('🔄 Ejecutando sp_pagarOrdenPago...');

    const result = await request.execute('sp_pagarOrdenPago');

    // Obtener valores de salida
    const resultado = result.output.resultado;
    const mensaje = result.output.mensaje;
    const ordenId = result.output.ordenId;
    const monto = result.output.monto;
    const negocio = result.output.negocio;
    const transaccionId = result.output.transaccionId;

    console.log(`📊 Resultado: ${resultado}`);
    console.log(`📝 Mensaje: ${mensaje}`);

    if (resultado === 'EXITOSO') {
      return {
        success: true,
        message: mensaje,
        data: {
          ordenId,
          monto,
          negocio,
          transaccionId
        }
      };
    } else {
      return {
        success: false,
        message: mensaje
      };
    }

  } catch (error) {
    console.error('💥 Error en pagarOrdenPago:', error.message);
    throw error;
  }
};

export const registrarTransaccionPasarela = async ({ merchantId, monto, moneda, ultimos4 }) => {
  try {
    console.log('💳 Registrando transacción en pasarela...');
    console.log(`   Merchant: ${merchantId}`);
    console.log(`   Monto: ${monto} ${moneda}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('merchantid', sql.VarChar(50), merchantId);
    request.input('monto', sql.Decimal(18, 2), parseFloat(monto));
    request.input('moneda', sql.VarChar(3), moneda || 'GTQ');
    request.input('ultimos4', sql.VarChar(4), ultimos4);

    console.log('🔄 Ejecutando sp_registrarTransaccion...');
    
    const result = await request.execute('sp_registrarTransaccion');
    
    console.log('✅ Procedimiento ejecutado');
    console.log('Resultado:', JSON.stringify(result.recordset, null, 2));

    if (!result.recordset || result.recordset.length === 0) {
      return {
        success: false,
        message: 'El procedimiento no devolvió datos'
      };
    }

    const data = result.recordset[0];

    if (data.Exito === 0 || data.Exito === false) {
      return {
        success: false,
        message: data.Mensaje || 'Error al registrar transacción'
      };
    }

    return {
      success: true,
      data: {
        transaccionId: data.TransaccionID,
        merchantId: data.MerchantID,
        monto: data.Monto,
        moneda: data.Moneda,
        ultimos4Digitos: data.Ultimos4Digitos,
        estado: data.Estado,
        mensaje: data.Mensaje
      }
    };

  } catch (error) {
    console.error('💥 Error en registrarTransaccionPasarela:', error.message);
    return {
      success: false,
      message: error.message
    };
  }
};