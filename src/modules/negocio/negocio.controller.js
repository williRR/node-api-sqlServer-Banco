import { getConnection } from "../../config/db.js";
import sql from "mssql";

// Crear negocio
export const crearNegocio = async (req, res) => {
  try {
    console.log('🏢 Creando nuevo negocio...');
    const { nombre, nit, ciudad, direccion, telefono, email } = req.body;

    const pool = await getConnection();
    const request = pool.request();

    // ✅ Nombres de parámetros deben coincidir con el SP
    request.input('negonombre', sql.VarChar(50), nombre);
    request.input('negnit', sql.VarChar(11), nit);
    request.input('negociudad', sql.VarChar(30), ciudad);
    request.input('negodireccion', sql.VarChar(50), direccion);
    request.input('negotelefono', sql.VarChar(20), telefono || null);
    request.input('negoemail', sql.VarChar(50), email || null);

    const result = await request.execute('sp_crearNegocio');

    res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('💥 Error creando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear negocio'
    });
  }
};

// Obtener negocio por ID
export const obtenerNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));

    const result = await request.query(`
      SELECT * FROM Negocio WHERE int_negocodigo = @NegocioID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error obteniendo negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener negocio'
    });
  }
};

// Actualizar negocio
export const actualizarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));
    
    // Construir UPDATE dinámico
    const setClause = Object.keys(updates)
      .map(key => `${key} = @${key}`)
      .join(', ');

    Object.entries(updates).forEach(([key, value]) => {
      request.input(key, value);
    });

    await request.query(`
      UPDATE Negocio SET ${setClause} WHERE int_negocodigo = @NegocioID
    `);

    res.json({
      success: true,
      message: 'Negocio actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar negocio'
    });
  }
};

// Dashboard del negocio
export const obtenerDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));

    // Obtener estadísticas
    const result = await request.query(`
      SELECT 
        (SELECT COUNT(*) FROM OrdenPago WHERE int_negocodigo = @NegocioID AND vch_estado = 'PENDIENTE') AS OrdenesPendientes,
        (SELECT COUNT(*) FROM OrdenPago WHERE int_negocodigo = @NegocioID AND vch_estado = 'PAGADO' AND CAST(dtt_fechapago AS DATE) = CAST(GETDATE() AS DATE)) AS PagosHoy,
        (SELECT COALESCE(SUM(dec_monto), 0) FROM OrdenPago WHERE int_negocodigo = @NegocioID AND vch_estado = 'PAGADO' AND CAST(dtt_fechapago AS DATE) = CAST(GETDATE() AS DATE)) AS IngresosHoy,
        (SELECT COALESCE(SUM(dec_monto), 0) FROM OrdenPago WHERE int_negocodigo = @NegocioID AND vch_estado = 'PAGADO') AS TotalIngresos
    `);

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener dashboard'
    });
  }
};

// Generar orden de pago
export const generarOrdenPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, concepto, vigenciaHoras } = req.body;

    console.log(`🧾 Generando orden de pago para negocio ${id}`);

    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Monto inválido'
      });
    }

    const pool = await getConnection();
    const request = pool.request();

    request.input('negocioId', sql.Int, parseInt(id));
    request.input('monto', sql.Decimal(18, 2), parseFloat(monto));
    request.input('concepto', sql.VarChar(200), concepto);
    request.input('vigenciaHoras', sql.Int, parseInt(vigenciaHoras) || 48);

    request.output('codigoOrden', sql.VarChar(20));
    request.output('claveAcceso', sql.VarChar(8));
    request.output('fechaVencimiento', sql.DateTime);

    const result = await request.execute('sp_generarOrdenPago');

    res.status(201).json({
      success: true,
      message: 'Orden de pago generada exitosamente',
      data: {
        codigoOrden: result.output.codigoOrden,
        claveAcceso: result.output.claveAcceso,
        monto: parseFloat(monto),
        concepto,
        fechaVencimiento: result.output.fechaVencimiento,
        vigenciaHoras: parseInt(vigenciaHoras) || 48
      }
    });

  } catch (error) {
    console.error('💥 Error generando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar orden de pago'
    });
  }
};

// Obtener órdenes del negocio
export const obtenerOrdenes = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, limite = 20 } = req.query;

    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));
    request.input('Limite', sql.Int, parseInt(limite));

    let query = `
      SELECT TOP (@Limite)
        int_ordenid AS OrdenID,
        vch_codigorden AS CodigoOrden,
        dec_monto AS Monto,
        vch_concepto AS Concepto,
        vch_estado AS Estado,
        dtt_fechacreacion AS FechaCreacion,
        dtt_fechavencimiento AS FechaVencimiento,
        dtt_fechapago AS FechaPago
      FROM OrdenPago
      WHERE int_negocodigo = @NegocioID
    `;

    if (estado) {
      request.input('Estado', sql.VarChar(15), estado.toUpperCase());
      query += ` AND vch_estado = @Estado`;
    }

    query += ` ORDER BY dtt_fechacreacion DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: {
        ordenes: result.recordset,
        total: result.recordset.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes'
    });
  }
};

// Obtener ingresos del negocio
export const obtenerIngresos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, limite = 20 } = req.query;

    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));
    request.input('Limite', sql.Int, parseInt(limite));

    let query = `
      SELECT TOP (@Limite)
        int_ordenid AS OrdenID,
        vch_codigorden AS CodigoOrden,
        dec_monto AS Monto,
        vch_concepto AS Concepto,
        dtt_fechapago AS FechaPago
      FROM OrdenPago
      WHERE int_negocodigo = @NegocioID
        AND vch_estado = 'PAGADO'
    `;

    if (fechaInicio) {
      request.input('FechaInicio', sql.Date, fechaInicio);
      query += ` AND CAST(dtt_fechapago AS DATE) >= @FechaInicio`;
    }

    query += ` ORDER BY dtt_fechapago DESC`;

    const result = await request.query(query);

    // Total de ingresos
    const totalRequest = pool.request();
    totalRequest.input('NegocioID', sql.Int, parseInt(id));

    const totalResult = await totalRequest.query(`
      SELECT COALESCE(SUM(dec_monto), 0) AS TotalIngresos
      FROM OrdenPago
      WHERE int_negocodigo = @NegocioID
        AND vch_estado = 'PAGADO'
    `);

    res.json({
      success: true,
      data: {
        ingresos: result.recordset,
        total: result.recordset.length,
        totalIngresos: totalResult.recordset[0].TotalIngresos
      }
    });

  } catch (error) {
    console.error('Error obteniendo ingresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener ingresos'
    });
  }
};

// Ver saldo del negocio
export const verSaldoNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const request = pool.request();

    request.input('NegocioID', sql.Int, parseInt(id));

    const result = await request.query(`
      SELECT int_cuencodigo AS CuentaID, dec_cuensaldo AS Saldo
      FROM Cuenta
      WHERE int_negocodigo = @NegocioID AND vch_cuenestado = 'ACTIVO'
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio sin cuenta activa'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error obteniendo saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener saldo'
    });
  }
};

// Ver movimientos del negocio
export const verMovimientosNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 10, pagina = 1, fechaInicio, fechaFin, sort = 'desc' } = req.query;

    const page = Math.max(parseInt(pagina) || 1, 1);
    const limit = Math.max(parseInt(limite) || 10, 1);
    const offset = (page - 1) * limit;
    const sortDir = (String(sort).toLowerCase() === 'asc') ? 'ASC' : 'DESC';

    const pool = await getConnection();

    // Consulta de datos con OFFSET/FETCH
    const dataRequest = pool.request();
    dataRequest.input('NegocioID', sql.Int, parseInt(id));
    dataRequest.input('Limite', sql.Int, limit);
    dataRequest.input('Offset', sql.Int, offset);
    if (fechaInicio) dataRequest.input('FechaInicio', sql.Date, fechaInicio);
    if (fechaFin) dataRequest.input('FechaFin', sql.Date, fechaFin);

    let dataWhere = 'WHERE c.int_negocodigo = @NegocioID';
    if (fechaInicio) dataWhere += ' AND CAST(m.dtt_movifecha AS DATE) >= @FechaInicio';
    if (fechaFin) dataWhere += ' AND CAST(m.dtt_movifecha AS DATE) <= @FechaFin';

    const dataQuery = `
      SELECT
        m.int_movinumero AS Movimiento,
        m.dtt_movifecha AS Fecha,
        m.dec_moviimporte AS Importe,
        m.int_tipocodigo AS Tipo,
        m.vch_movitransaccionid AS TransaccionID,
        c.int_cuencodigo AS CuentaID
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
      ${dataWhere}
      ORDER BY m.dtt_movifecha ${sortDir}
      OFFSET @Offset ROWS FETCH NEXT @Limite ROWS ONLY
    `;

    const dataResult = await dataRequest.query(dataQuery);

    // Consulta de totales (conteo + suma)
    const totalRequest = pool.request();
    totalRequest.input('NegocioID', sql.Int, parseInt(id));
    if (fechaInicio) totalRequest.input('FechaInicio', sql.Date, fechaInicio);
    if (fechaFin) totalRequest.input('FechaFin', sql.Date, fechaFin);

    const totalWhere = dataWhere; // misma condición
    const totalQuery = `
      SELECT
        COUNT(*) AS TotalCount,
        COALESCE(SUM(m.dec_moviimporte), 0) AS TotalImporte
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.int_cuencodigo = c.int_cuencodigo
      ${totalWhere}
    `;

    const totalResult = await totalRequest.query(totalQuery);
    const totals = totalResult.recordset[0] || { TotalCount: 0, TotalImporte: 0 };

    // Formatear movimientos (mapear/limpiar campos si se desea)
    const movimientos = dataResult.recordset.map(m => ({
      movimientoNumero: m.Movimiento,
      fecha: m.Fecha,
      importe: parseFloat(m.Importe),
      tipoCodigo: m.Tipo,
      transaccionId: m.TransaccionID,
      transaccionIdLast8: m.TransaccionID ? String(m.TransaccionID).slice(-8) : null,
      cuentaId: m.CuentaID
    }));

    res.json({
      success: true,
      data: {
        movimientos,
        pagina: page,
        limite: limit,
        totalCount: parseInt(totals.TotalCount, 10),
        totalImporte: parseFloat(totals.TotalImporte)
      }
    });

  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};