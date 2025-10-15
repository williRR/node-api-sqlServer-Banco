// ✅ modules/pagos/pagos.controller.js
import service from './pagos.service.js';
import { getConnection } from "../../config/db.js";
import sql from "mssql";
import { procesarAutorizacion } from "./pagos.service.js"; // ✅ Importación correcta

/**
 * Controlador que autoriza un pago directo del banco.
 * Endpoint: POST /autorizar
 */
const autorizarPago = async (req, res) => {
  try {
    const { tarjcodigo, monto, tarjfecha = "12/30", tarjcvv = "000" } = req.body;

    // Parámetros fijos del banco (ejemplo)
    const emplcodigo = 100;
    const tipocodigo = 2;

    // --- Validación de entrada ---
    if (!tarjcodigo || !monto) {
      return res.status(400).json({
        status: 'RECHAZADO',
        mensaje: 'Faltan parámetros requeridos (tarjcodigo, monto).',
      });
    }

    if (isNaN(monto) || Number(monto) <= 0) {
      return res.status(400).json({
        status: 'RECHAZADO',
        mensaje: 'Monto inválido. Debe ser un número positivo.',
      });
    }

    const resultado = await service.procesarAutorizacion(
      tarjcodigo.trim(),
      Number(monto),
      tarjfecha,
      tarjcvv,
      'BANCO_INTERNO', // Merchant ID para transacciones internas
      emplcodigo,
      tipocodigo
    );

    const statusCode = resultado.status === 'APROBADO' ? 200 : 400;
    return res.status(statusCode).json(resultado);
  } catch (error) {
    console.error('💥 Error interno del Banco:', error);
    return res.status(500).json({
      status: 'FALLIDO',
      mensaje: 'Error interno del servidor del banco. Consulte el log del servidor.',
    });
  }
};

/**
 * Valida los datos de entrada para la pasarela de pagos.
 */
function validateCharge(req, res, next) {
  const { merchantId, amount, cardNumber, expDate, cvv } = req.body;

  if (!merchantId || typeof merchantId !== "string" || merchantId.trim() === "") {
    return res.status(400).json({ error: "merchantId inválido" });
  }
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ error: "Monto inválido" });
  }
  if (!/^\d{13,19}$/.test(cardNumber)) {
    return res.status(400).json({ error: "Número de tarjeta inválido" });
  }
  if (!/^\d{2}\/\d{2}$/.test(expDate)) {
    return res.status(400).json({ error: "Formato de expiración inválido (MM/AA)" });
  }
  if (!/^\d{3,4}$/.test(cvv)) {
    return res.status(400).json({ error: "CVV inválido" });
  }

  req.body.cardNumber = cardNumber.replace(/\s+/g, ""); // Sanitizar
  next();
}

/**
 * Controlador para procesar pagos a través de la pasarela
 * Endpoint: POST /charge
 */
const processPaymentGateway = async (req, res) => {
  try {
    const { merchantId, amount, cardNumber, expDate, cvv } = req.body;
    const result = await service.processPaymentGateway({ merchantId, amount, cardNumber, expDate, cvv });

    if (result.success) {
      return res.json({
        status: "success",
        transactionId: result.transactionId,
        message: result.message,
      });
    }

    return res.status(400).json({
      status: "failed",
      transactionId: result.transactionId,
      message: result.message,
      errorCode: result.errorCode,
    });
  } catch (error) {
    console.error("Error interno en pasarela:", error.message);
    res.status(500).json({
      status: "error",
      message: "Error interno en la pasarela",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * PROCESAR PAGO CON TARJETA - Usando servicio que maneja OUTPUT
 */
export const procesarPago = async (req, res) => {
  try {
    console.log('💳 INICIO: Procesamiento de pago con tarjeta');
    
    const {
      merchantId,
      cardNumber,
      cvv,
      expDate,
      amount
    } = req.body;

    // ===== VALIDACIONES BÁSICAS =====
    if (!merchantId || !cardNumber || !cvv || !expDate || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'Campos requeridos faltantes',
        errorCode: 'MISSING_FIELDS',
        required: ['merchantId', 'cardNumber', 'cvv', 'expDate', 'amount']
      });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Monto inválido',
        errorCode: 'INVALID_AMOUNT'
      });
    }

    const pool = await getConnection();
    const ultimos4 = cardNumber.slice(-4);

    // ===== PASO 1: REGISTRAR TRANSACCIÓN (PENDIENTE) =====
    console.log('📝 PASO 1: Registrando transacción...');
    
    const registroRequest = pool.request();
    registroRequest.input('merchantid', sql.VarChar(50), merchantId);
    registroRequest.input('monto', sql.Decimal(18, 2), numAmount);
    registroRequest.input('moneda', sql.VarChar(3), 'GTQ');
    registroRequest.input('ultimos4', sql.VarChar(4), ultimos4);

    const registroResult = await registroRequest.execute('sp_registrarTransaccion');
    
    if (!registroResult.recordset || registroResult.recordset.length === 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Error registrando transacción'
      });
    }

    const transaccionData = registroResult.recordset[0];
    if (transaccionData.Exito === 0) {
      return res.status(400).json({
        status: 'error',
        message: transaccionData.Mensaje
      });
    }

    const transaccionId = transaccionData.TransaccionID;
    console.log(`✅ Transacción registrada: ID ${transaccionId}`);

    // ===== PASO 2: AUTORIZAR PAGO (usando servicio que maneja OUTPUT) =====
    console.log('🔐 PASO 2: Autorizando pago con servicio...');

    // ✅ Usar la función importada directamente
    const autorizacionResult = await procesarAutorizacion(
      cardNumber,      // tarjcodigo
      numAmount,       // monto
      expDate,         // tarjfecha
      cvv,             // tarjcvv
      merchantId,      // merchantid
      100,             // emplcodigo
      2                // tipocodigo
    );

    const resultado = autorizacionResult.status;
    const mensaje = autorizacionResult.mensaje;
    const cuentaCodigo = autorizacionResult.cuentacodigo;

    console.log(`📊 Resultado: ${resultado}`);
    console.log(`📝 Mensaje: ${mensaje}`);

    // ===== PASO 3: ACTUALIZAR ESTADO =====
    console.log('🔄 PASO 3: Actualizando estado...');

    const nuevoEstado = resultado === 'APROBADO' ? 'APROBADO' : 'RECHAZADO';
    const actualizarRequest = pool.request();
    
    actualizarRequest.input('transaccionid', sql.Int, transaccionId);
    actualizarRequest.input('nuevoEstado', sql.VarChar(20), nuevoEstado);
    actualizarRequest.input('mensaje', sql.VarChar(200), mensaje);
    actualizarRequest.input('cuentareferencia', sql.Int, cuentaCodigo);

    await actualizarRequest.execute('sp_actualizarEstadoTransaccion');

    console.log(`✅ Estado actualizado: ${nuevoEstado}`);

    // ===== RESPUESTA =====
    if (resultado === 'APROBADO') {
      console.log('✅ PAGO APROBADO');
      
      return res.status(200).json({
        status: 'success',
        message: 'Pago procesado exitosamente',
        data: {
          transactionId: transaccionId,
          authorizationCode: `AUTH${Date.now()}`,
          merchantId,
          amount: numAmount,
          currency: 'GTQ',
          cardLast4: ultimos4,
          accountReference: cuentaCodigo,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.log('❌ PAGO RECHAZADO:', mensaje);
      
      return res.status(402).json({
        status: 'declined',
        message: mensaje,
        errorCode: 'PAYMENT_DECLINED',
        data: {
          transactionId: transaccionId,
          merchantId,
          amount: numAmount,
          cardLast4: ultimos4,
          declineReason: mensaje,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('💥 ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener merchants válidos (usa vch_negusuario)
export const obtenerMerchants = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        int_negocodigo AS NegocioID,
        vch_negonombre AS Nombre,
        chr_negnit AS NIT,
        vch_negociudad AS Ciudad,
        vch_negusuario AS MerchantID
      FROM Negocio
      ORDER BY vch_negonombre
    `);

    res.json({
      status: 'success',
      message: 'Lista de merchants disponibles',
      data: {
        merchants: result.recordset.map(m => ({
          merchantId: m.MerchantID,  // ✅ vch_negusuario
          name: m.Nombre,
          nit: m.NIT,
          city: m.Ciudad
        })),
        total: result.recordset.length,
        note: 'Use "merchantId" (vch_negusuario) en los pagos'
      }
    });
  } catch (error) {
    console.error('Error obteniendo merchants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error obteniendo merchants'
    });
  }
};

export default { 
  autorizarPago, 
  processPaymentGateway,
  validateCharge
};
