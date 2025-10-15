import { getConnection } from "../../config/db.js";
import sql from "mssql";

export const crearNegocio = async (req, res) => {
  try {
    console.log('🏢 Creando nuevo negocio...');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      nombre, 
      nit, 
      ciudad, 
      direccion, 
      telefono, 
      email
    } = req.body;

    // Validaciones básicas
    if (!nombre || !nit || !ciudad) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: nombre, nit, ciudad',
        camposRequeridos: ['nombre', 'nit', 'ciudad']
      });
    }

    console.log('🔌 Obteniendo conexión...');
    const pool = await getConnection();
    console.log('✅ Conexión obtenida');
    
    const request = pool.request();
    
    // ✅ Parámetros con nombres que coinciden con el SP
    console.log('📦 Agregando parámetros...');
    request.input('negonombre', sql.VarChar(50), nombre);
    request.input('negnit', sql.VarChar(15), nit);
    request.input('negociudad', sql.VarChar(30), ciudad);
    request.input('negodireccion', sql.VarChar(50), direccion || '');
    request.input('negotelefono', sql.VarChar(20), telefono || null);
    request.input('negoemail', sql.VarChar(50), email || null);

    console.log('🔄 Ejecutando sp_crearNegocio...');
    
    const result = await request.execute('sp_crearNegocio');
    
    console.log('✅ Procedimiento ejecutado');
    console.log('📊 Resultado completo:', JSON.stringify(result, null, 2));
    console.log('📦 Recordset:', JSON.stringify(result.recordset, null, 2));
    console.log('📈 RowsAffected:', result.rowsAffected);
    console.log('🔢 ReturnValue:', result.returnValue);
    
    // ✅ Verificar que hay recordset
    if (!result.recordset || result.recordset.length === 0) {
      console.error('❌ El procedimiento no devolvió recordset');
      console.error('Posibles causas:');
      console.error('1. El procedimiento no existe');
      console.error('2. El procedimiento no tiene SELECT al final');
      console.error('3. El procedimiento falló antes de llegar al SELECT');
      
      return res.status(500).json({
        success: false,
        message: 'El procedimiento almacenado no devolvió datos',
        debug: {
          hasRecordset: !!result.recordset,
          recordsetLength: result.recordset?.length || 0,
          rowsAffected: result.rowsAffected,
          returnValue: result.returnValue,
          hint: 'Verifica que sp_crearNegocio exista y tenga SELECT al final'
        }
      });
    }

    const data = result.recordset[0];
    console.log('📦 Datos extraídos:', data);
    
    // Verificar si hubo error
    if (data.Exito === 0 || data.Exito === false) {
      console.error('❌ El procedimiento reportó error:', data.Mensaje);
      return res.status(400).json({
        success: false,
        message: data.Mensaje || 'Error en el procedimiento almacenado',
        errorNumero: data.ErrorNumero
      });
    }

    // ✅ Éxito - Devolver datos incluyendo usuario y clave
    console.log('✅ Negocio creado exitosamente - ID:', data.NegocioID);
    
    return res.status(201).json({
      success: true,
      message: 'Negocio creado exitosamente',
      data: {
        negocioId: data.NegocioID,
        nombre: data.Nombre,
        nit: data.NIT,
        ciudad: data.Ciudad,
        direccion: data.Direccion,
        telefono: data.Telefono,
        email: data.Email,
        credenciales: {
          usuario: data.Usuario,
          clave: data.Clave
        }
      },
      mensaje: '⚠️ IMPORTANTE: Guarde estas credenciales de forma segura. La clave no se mostrará nuevamente.'
    });

  } catch (error) {
    console.error('💥 ERROR CRÍTICO en crearNegocio:');
    console.error('Tipo:', error.constructor.name);
    console.error('Mensaje:', error.message);
    console.error('Código:', error.code);
    console.error('Stack:', error.stack);
    
    // Error específico de SQL
    if (error.number) {
      console.error('SQL Error Number:', error.number);
      console.error('SQL Error State:', error.state);
      console.error('SQL Procedure:', error.procName);
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear negocio',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        code: error.code,
        sqlNumber: error.number,
        procName: error.procName
      } : undefined
    });
  }
};

export const obtenerNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Buscando negocio ID: ${id}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, parseInt(id));
    
    const result = await request.query(`
      SELECT 
        int_negocodigo AS NegocioID,
        vch_negonombre AS Nombre,
        chr_negnit AS NIT,
        vch_negociudad AS Ciudad,
        vch_negodireccion AS Direccion,
        vch_negotelefono AS Telefono,
        vch_negoemail AS Email,
        vch_negusuario AS Usuario
      FROM Negocio 
      WHERE int_negocodigo = @NegocioID
    `);

    if (result.recordset.length === 0) {
      console.log('❌ Negocio no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    console.log('✅ Negocio encontrado');
    
    return res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('💥 ERROR en obtenerNegocio:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const actualizarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, direccion, telefono, email } = req.body;

    console.log(`📝 Actualizando negocio ID: ${id}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, parseInt(id));
    request.input('Nombre', sql.VarChar(50), nombre);
    request.input('Direccion', sql.VarChar(50), direccion);
    request.input('Telefono', sql.VarChar(20), telefono);
    request.input('Email', sql.VarChar(50), email);

    const result = await request.query(`
      UPDATE Negocio 
      SET vch_negonombre = @Nombre,
          vch_negodireccion = @Direccion,
          vch_negotelefono = @Telefono,
          vch_negoemail = @Email
      WHERE int_negocodigo = @NegocioID
    `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado'
      });
    }

    console.log('✅ Negocio actualizado');

    return res.json({
      success: true,
      message: 'Negocio actualizado exitosamente'
    });

  } catch (error) {
    console.error('💥 ERROR en actualizarNegocio:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📊 Obteniendo dashboard para negocio ID: ${id}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, parseInt(id));

    // Obtener estadísticas del negocio
    const estadisticas = await request.query(`
      SELECT 
        COUNT(CASE WHEN op.chr_ordenestado = 'PENDIENTE' THEN 1 END) AS OrdenesPendientes,
        COUNT(CASE WHEN op.chr_ordenestado = 'PAGADO' THEN 1 END) AS OrdenesPagadas,
        COALESCE(SUM(CASE WHEN op.chr_ordenestado = 'PAGADO' THEN op.dec_ordenmonto ELSE 0 END), 0) AS TotalIngresos,
        COALESCE(SUM(CASE WHEN op.chr_ordenestado = 'PAGADO' AND CAST(op.dtt_ordenfechapago AS DATE) = CAST(GETDATE() AS DATE) THEN op.dec_ordenmonto ELSE 0 END), 0) AS IngresosHoy
      FROM OrdenPago op
      WHERE op.int_negocodigo = @NegocioID
    `);

    const data = estadisticas.recordset[0];

    console.log('✅ Dashboard obtenido');

    return res.json({
      success: true,
      data: {
        ordenesPendientes: data.OrdenesPendientes || 0,
        ordenesPagadas: data.OrdenesPagadas || 0,
        totalIngresos: parseFloat(data.TotalIngresos) || 0,
        ingresosHoy: parseFloat(data.IngresosHoy) || 0
      }
    });

  } catch (error) {
    console.error('💥 ERROR en obtenerDashboard:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
