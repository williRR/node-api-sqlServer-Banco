import sql from "mssql";
import { dbSettings } from '../../config/db.js';

// Funciones básicas existentes (agregar si no existen)
export const crearNegocio = async (data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input("nombre", sql.VarChar(100), data.nombre)
      .input("nit", sql.VarChar(20), data.nit)
      .input("ciudad", sql.VarChar(30), data.ciudad)
      .input("direccion", sql.VarChar(50), data.direccion)
      .input("telefono", sql.VarChar(20), data.telefono)
      .input("email", sql.VarChar(50), data.email)
      .execute("sp_crearNegocio");
    return result.recordset[0] || { mensaje: "Negocio creado exitosamente" };
  } catch (error) {
    throw error;
  }
};

export const obtenerNegocios = async () => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request().execute("sp_obtenerNegocios");
    return result.recordset;
  } catch (error) {
    throw error;
  }
};

export const obtenerNegocio = async (id) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input('id', sql.Int, id)
      .execute('sp_obtenerNegocio');
    return result.recordset[0];
  } catch (error) {
    throw error;
  }
};

export const actualizarNegocio = async (id, data) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request()
      .input("id", sql.Int, id)
      .input("nombre", sql.VarChar(100), data.nombre)
      .input("ciudad", sql.VarChar(30), data.ciudad)
      .input("direccion", sql.VarChar(50), data.direccion)
      .input("telefono", sql.VarChar(20), data.telefono)
      .input("email", sql.VarChar(50), data.email)
      .execute("sp_actualizarNegocio");
    return { message: "Negocio actualizado exitosamente" };
  } catch (error) {
    throw error;
  }
};

// ...existing code...

// 🧾 Generar orden de pago
export const generarOrdenPago = async ({ negocioId, monto, concepto, vigenciaHoras }) => {
  try {
    const pool = await sql.connect(dbSettings);
    const request = pool.request();
    request.input('negocioId', sql.Int, negocioId);
    request.input('monto', sql.Decimal(18, 2), monto);
    request.input('concepto', sql.VarChar(200), concepto);
    request.input('vigenciaHoras', sql.Int, vigenciaHoras);
    request.output('codigoOrden', sql.VarChar(20));
    request.output('claveAcceso', sql.VarChar(8));
    request.output('fechaVencimiento', sql.DateTime);

    const result = await request.execute('sp_generarOrdenPago');
    const { codigoOrden, claveAcceso, fechaVencimiento } = result.output;

    return {
      codigoOrden,
      claveAcceso,
      monto: parseFloat(monto),
      concepto,
      fechaVencimiento,
      qrCode: `BANCO_GT:${codigoOrden}:${claveAcceso}:${monto}`
    };
  } catch (error) {
    throw new Error('Error al generar orden de pago: ' + error.message);
  }
};

// 📋 Obtener órdenes de pago generadas
export const obtenerOrdenesPago = async (negocioId, { estado, limite }) => {
  try {
    const limiteInt = parseInt(limite);
    let queryStr = `
      SELECT TOP (@limite)
        op.int_ordenid as ordenId,
        op.vch_codigorden as codigoOrden,
        op.dec_monto as monto,
        op.vch_concepto as concepto,
        op.vch_estado as estado,
        op.dtt_fechacreacion as fechaCreacion,
        op.dtt_fechavencimiento as fechaVencimiento,
        op.dtt_fechapago as fechaPago,
        CASE 
          WHEN cl.int_cliecodigo IS NOT NULL THEN 
            CONCAT(cl.vch_clienombre, ' ', cl.vch_cliepaterno)
          ELSE 'No pagado'
        END as clientePago
      FROM OrdenPago op
      LEFT JOIN Cliente cl ON op.int_cliecodigo_pago = cl.int_cliecodigo
      WHERE op.int_negocodigo = @negocioId
    `;

    const pool = await sql.connect(dbSettings);
    const request = pool.request();
    request.input('negocioId', sql.Int, negocioId);
    request.input('limite', sql.Int, limiteInt);

    if (estado !== 'TODAS') {
      queryStr += ' AND op.vch_estado = @estado';
      request.input('estado', sql.VarChar(15), estado);
    }

    queryStr += ' ORDER BY op.dtt_fechacreacion DESC';

    const result = await request.query(queryStr);

    return {
      ordenes: result.recordset.map(orden => ({
        ordenId: orden.ordenId,
        codigoOrden: orden.codigoOrden,
        monto: parseFloat(orden.monto),
        concepto: orden.concepto,
        estado: orden.estado,
        fechaCreacion: orden.fechaCreacion,
        fechaVencimiento: orden.fechaVencimiento,
        fechaPago: orden.fechaPago,
        clientePago: orden.clientePago
      }))
    };
  } catch (error) {
    throw new Error('Error al obtener órdenes: ' + error.message);
  }
};

// 💰 Obtener ingresos del negocio
export const obtenerIngresos = async (negocioId, { fechaInicio, fechaFin, limite }) => {
  try {
    const limiteInt = parseInt(limite);
    let queryStr = `
      SELECT TOP (@limite)
        m.dtt_movifecha as fecha,
        m.dec_moviimporte as monto,
        m.vch_movitransaccionid as transaccionId,
        tm.vch_tipodescripcion as tipoIngreso,
        CASE 
          WHEN m.int_cuenreferencia IS NOT NULL THEN
            (SELECT CONCAT(cl2.vch_clienombre, ' ', cl2.vch_cliepaterno) 
             FROM Cuenta c2 
             INNER JOIN Cliente cl2 ON c2.int_cliecodigo = cl2.int_cliecodigo 
             WHERE c2.int_cuencodigo = m.int_cuenreferencia)
          ELSE 'Sistema'
        END as origen
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
      INNER JOIN TipoMovimiento tm ON m.int_tipocodigo = tm.int_tipocodigo
      WHERE c.int_negocodigo = @negocioId AND tm.vch_tipoaccion = 'INGRESO'
    `;

    const pool = await sql.connect(dbSettings);
    const request = pool.request();
    request.input('negocioId', sql.Int, negocioId);
    request.input('limite', sql.Int, limiteInt);

    if (fechaInicio) {
      queryStr += ' AND m.dtt_movifecha >= @fechaInicio';
      request.input('fechaInicio', sql.DateTime, fechaInicio);
    }
    if (fechaFin) {
      queryStr += ' AND m.dtt_movifecha <= @fechaFin';
      request.input('fechaFin', sql.DateTime, fechaFin);
    }

    queryStr += ' ORDER BY m.dtt_movifecha DESC';

    const result = await request.query(queryStr);

    // Calcular totales
    let totalQueryStr = `
      SELECT 
        COUNT(*) as totalTransacciones,
        SUM(m.dec_moviimporte) as totalIngresos
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
      INNER JOIN TipoMovimiento tm ON m.int_tipocodigo = tm.int_tipocodigo
      WHERE c.int_negocodigo = @negocioId2 AND tm.vch_tipoaccion = 'INGRESO'
    `;

    const totalRequest = pool.request();
    totalRequest.input('negocioId2', sql.Int, negocioId);

    if (fechaInicio) {
      totalQueryStr += ' AND m.dtt_movifecha >= @fechaInicio2';
      totalRequest.input('fechaInicio2', sql.DateTime, fechaInicio);
    }
    if (fechaFin) {
      totalQueryStr += ' AND m.dtt_movifecha <= @fechaFin2';
      totalRequest.input('fechaFin2', sql.DateTime, fechaFin);
    }

    const totalResult = await totalRequest.query(totalQueryStr);
    const totales = totalResult.recordset[0];

    return {
      ingresos: result.recordset.map(ingreso => ({
        fecha: ingreso.fecha,
        monto: parseFloat(ingreso.monto),
        transaccionId: ingreso.transaccionId,
        tipo: ingreso.tipoIngreso,
        origen: ingreso.origen
      })),
      resumen: {
        totalTransacciones: totales.totalTransacciones,
        totalIngresos: parseFloat(totales.totalIngresos || 0)
      }
    };
  } catch (error) {
    throw new Error('Error al obtener ingresos: ' + error.message);
  }
};

// 📊 Obtener dashboard del negocio
export const obtenerDashboard = async (negocioId) => {
  try {
    const pool = await sql.connect(dbSettings);
    const result = await pool.request().query`
      SELECT 
        c.dec_cuensaldo as saldoActual,
        (SELECT COUNT(*) FROM OrdenPago WHERE int_negocodigo = ${negocioId} AND vch_estado = 'PENDIENTE') as ordenesPendientes,
        (SELECT COUNT(*) FROM OrdenPago WHERE int_negocodigo = ${negocioId} AND vch_estado = 'PAGADO' AND CAST(dtt_fechapago AS DATE) = CAST(GETDATE() AS DATE)) as pagosHoy,
        (SELECT SUM(dec_moviimporte) FROM Movimiento m INNER JOIN Cuenta c2 ON m.int_cuencodigo = c2.int_cuencodigo INNER JOIN TipoMovimiento tm ON m.int_tipocodigo = tm.int_tipocodigo WHERE c2.int_negocodigo = ${negocioId} AND tm.vch_tipoaccion = 'INGRESO' AND CAST(m.dtt_movifecha AS DATE) = CAST(GETDATE() AS DATE)) as ingresosHoy
      FROM Cuenta c
      WHERE c.int_negocodigo = ${negocioId}
        AND c.vch_cuenestado = 'ACTIVO'
    `;

    if (result.recordset.length === 0) {
      return null;
    }

    const estadisticas = result.recordset[0];

    return {
      saldoActual: parseFloat(estadisticas.saldoActual || 0),
      ordenesPendientes: estadisticas.ordenesPendientes || 0,
      pagosHoy: estadisticas.pagosHoy || 0,
      ingresosHoy: parseFloat(estadisticas.ingresosHoy || 0)
    };
  } catch (error) {
    throw new Error('Error al obtener dashboard: ' + error.message);
  }
};