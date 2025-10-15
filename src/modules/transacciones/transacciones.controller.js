// modules/transacciones/transacciones.controller.js (Banco Ficticio)

import service from './transacciones.service.js'; 
import { getConnection } from "../../config/db.js";
import sql from "mssql";

/**
 * Procesar pago con tarjeta - Flujo completo de la pasarela
 * 1. Registra transacción (PENDIENTE)
 * 2. Autoriza pago (valida tarjeta, debita cliente, acredita negocio)
 * 3. Actualiza estado (APROBADO/RECHAZADO)
 */
export const procesarPagoConTarjeta = async (req, res) => {
  try {
    console.log('💳 INICIO: Procesamiento de pago con tarjeta');
    console.log('Body:', JSON.stringify(req.body, null, 2));

    const {
      merchantId,
      cardNumber,
      amount,
      expDate,
      cvv,
      description = 'Pago procesado'
    } = req.body;

    // ===== VALIDACIONES BÁSICAS =====
    if (!merchantId || !cardNumber || !amount || !expDate || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
        camposRequeridos: ['merchantId', 'cardNumber', 'amount', 'expDate', 'cvv']
      });
    }

    const pool = await getConnection();

    // ===== PASO 1: REGISTRAR TRANSACCIÓN (PENDIENTE) =====
    console.log('📝 PASO 1: Registrando transacción en TransaccionPasarela...');
    
    const ultimos4 = cardNumber.slice(-4);
    const registroRequest = pool.request();
    
    registroRequest.input('merchantid', sql.VarChar(50), merchantId);
    registroRequest.input('monto', sql.Decimal(18, 2), parseFloat(amount));
    registroRequest.input('moneda', sql.VarChar(3), 'GTQ');
    registroRequest.input('ultimos4', sql.VarChar(4), ultimos4);

    const registroResult = await registroRequest.execute('sp_registrarTransaccion');
    
    if (!registroResult.recordset || registroResult.recordset.length === 0) {
      console.error('❌ Error: sp_registrarTransaccion no devolvió datos');
      return res.status(500).json({
        success: false,
        message: 'Error registrando transacción inicial'
      });
    }

    const transaccionData = registroResult.recordset[0];

    if (transaccionData.Exito === 0) {
      console.error('❌ Error al registrar transacción:', transaccionData.Mensaje);
      return res.status(400).json({
        success: false,
        message: transaccionData.Mensaje
      });
    }

    const transaccionId = transaccionData.TransaccionID;
    console.log(`✅ Transacción registrada: ID ${transaccionId} (PENDIENTE)`);

    // ===== PASO 2: AUTORIZAR PAGO =====
    console.log('🔐 PASO 2: Autorizando pago con sp_autorizarPago...');

    const autorizarRequest = pool.request();
    
    // Parámetros de entrada
    autorizarRequest.input('tarjcodigo', sql.VarChar(16), cardNumber);
    autorizarRequest.input('monto', sql.Decimal(18, 2), parseFloat(amount));
    autorizarRequest.input('tarjfecha', sql.VarChar(5), expDate);
    autorizarRequest.input('tarjcvv', sql.VarChar(4), cvv);
    autorizarRequest.input('merchantid', sql.VarChar(50), merchantId);
    autorizarRequest.input('emplcodigo', sql.Int, 100); // Empleado por defecto
    autorizarRequest.input('tipocodigo', sql.Int, 2); // Tipo débito

    // Parámetros de salida
    autorizarRequest.output('resultado', sql.VarChar(15));
    autorizarRequest.output('mensaje', sql.VarChar(100));
    autorizarRequest.output('cuentacodigo', sql.Int);

    const autorizarResult = await autorizarRequest.execute('sp_autorizarPago');

    const resultado = autorizarResult.output.resultado;
    const mensaje = autorizarResult.output.mensaje;
    const cuentaCodigo = autorizarResult.output.cuentacodigo;

    console.log(`📊 Resultado autorización: ${resultado} - ${mensaje}`);

    // ===== PASO 3: ACTUALIZAR ESTADO DE TRANSACCIÓN =====
    console.log('🔄 PASO 3: Actualizando estado en TransaccionPasarela...');

    const nuevoEstado = resultado === 'APROBADO' ? 'APROBADO' : 'RECHAZADO';
    const mensajeFinal = mensaje || (resultado === 'APROBADO' ? 'Pago procesado exitosamente' : 'Pago rechazado');

    const actualizarRequest = pool.request();
    
    actualizarRequest.input('transaccionid', sql.Int, transaccionId);
    actualizarRequest.input('nuevoEstado', sql.VarChar(20), nuevoEstado);
    actualizarRequest.input('mensaje', sql.VarChar(200), mensajeFinal);
    actualizarRequest.input('cuentareferencia', sql.Int, cuentaCodigo);

    await actualizarRequest.execute('sp_actualizarEstadoTransaccion');

    console.log(`✅ Estado actualizado: ${nuevoEstado}`);

    // ===== RESPUESTA FINAL =====
    if (resultado === 'APROBADO') {
      console.log('✅ PAGO APROBADO - Flujo completado exitosamente');
      
      return res.status(200).json({
        success: true,
        status: 'approved',
        message: 'Pago procesado exitosamente',
        data: {
          transactionId: transaccionId,
          authorizationCode: `AUTH${Date.now()}`,
          merchantId: merchantId,
          amount: parseFloat(amount),
          currency: 'GTQ',
          cardLast4: ultimos4,
          accountReference: cuentaCodigo,
          timestamp: new Date().toISOString(),
          description: description
        }
      });
    } else {
      console.log('❌ PAGO RECHAZADO:', mensaje);
      
      return res.status(402).json({
        success: false,
        status: 'declined',
        message: mensaje,
        data: {
          transactionId: transaccionId,
          merchantId: merchantId,
          amount: parseFloat(amount),
          cardLast4: ultimos4,
          timestamp: new Date().toISOString(),
          declineReason: mensaje
        }
      });
    }

  } catch (error) {
    console.error('💥 ERROR CRÍTICO en procesarPagoConTarjeta:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor al procesar el pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Consultar estado de una transacción
 */
export const consultarTransaccion = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Consultando transacción ID: ${id}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('TransaccionID', sql.Int, parseInt(id));
    
    const result = await request.query(`
      SELECT 
        int_transaccionid AS TransaccionID,
        vch_merchantid AS MerchantID,
        dec_monto AS Monto,
        vch_moneda AS Moneda,
        vch_tarjetaultimos4 AS Ultimos4,
        vch_estado AS Estado,
        vch_mensaje AS Mensaje,
        dtt_fechahora AS FechaCreacion,
        dtt_fechaactualizacion AS FechaActualizacion,
        int_cuentareferencia AS CuentaReferencia
      FROM TransaccionPasarela
      WHERE int_transaccionid = @TransaccionID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Transacción no encontrada'
      });
    }

    console.log('✅ Transacción encontrada');

    return res.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error consultando transacción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Listar transacciones de un merchant
 */
export const listarTransaccionesMerchant = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { limite = 20, estado } = req.query;

    console.log(`📋 Listando transacciones del merchant: ${merchantId}`);

    const pool = await getConnection();
    const request = pool.request();
    
    request.input('MerchantID', sql.VarChar(50), merchantId);
    request.input('Limite', sql.Int, parseInt(limite));

    let query = `
      SELECT TOP (@Limite)
        int_transaccionid AS TransaccionID,
        dec_monto AS Monto,
        vch_moneda AS Moneda,
        vch_tarjetaultimos4 AS Ultimos4,
        vch_estado AS Estado,
        vch_mensaje AS Mensaje,
        dtt_fechahora AS FechaCreacion
      FROM TransaccionPasarela
      WHERE vch_merchantid = @MerchantID
    `;

    if (estado) {
      query += ` AND vch_estado = '${estado.toUpperCase()}'`;
    }

    query += ` ORDER BY dtt_fechahora DESC`;

    const result = await request.query(query);

    return res.json({
      success: true,
      data: {
        merchantId: merchantId,
        transacciones: result.recordset,
        total: result.recordset.length
      }
    });

  } catch (error) {
    console.error('Error listando transacciones:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};