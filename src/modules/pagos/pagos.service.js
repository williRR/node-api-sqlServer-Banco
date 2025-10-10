// ✅ modules/pagos/pagos.service.js - Servicio completo de pasarela de pagos
import { getConnection } from "../../config/db.js";
import sql from "mssql";

/**
 * Registra una transacción inicial con estado PENDIENTE en la pasarela.
 * @param {object} params
 * @param {string} params.merchantId
 * @param {number} params.amount
 * @param {string} params.cardNumber
 * @param {string} [params.moneda="USD"]
 * @returns {Promise<number>} ID de la transacción creada
 */
const registerInitialTransaction = async ({ merchantId, amount, cardNumber, moneda = "USD" }) => {
  if (!merchantId || typeof amount !== "number" || !cardNumber) {
    throw new Error("Parámetros inválidos para registrar la transacción.");
  }

  try {
    const pool = await getConnection();
    const request = pool.request();

    request.input("merchantid", sql.VarChar(50), merchantId);
    request.input("monto", sql.Decimal(18, 2), amount);
    request.input("moneda", sql.VarChar(3), moneda);
    request.input("ultimos4", sql.VarChar(4), cardNumber.slice(-4));
    request.output("transaccionid", sql.Int);

    const result = await request.execute("sp_registrarTransaccion");
    return result.output.transaccionid;
  } catch (err) {
    console.error("Error al registrar transacción inicial:", err.message);
    throw new Error("Fallo al guardar la transacción en la base de datos.");
  }
};

/**
 * Actualiza el estado de una transacción (APROBADO, RECHAZADO, FALLIDO, etc.).
 * @param {object} params
 * @param {number} params.transactionId
 * @param {string} params.status
 * @param {string} params.message
 * @param {number|null} [params.cuentaReferencia=null]
 */
const updateTransactionStatus = async ({ transactionId, status, message, cuentaReferencia = null }) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    request.input("transaccionid", sql.Int, transactionId);
    request.input("nuevoEstado", sql.VarChar(20), status.toUpperCase());
    request.input("mensaje", sql.VarChar(200), message);
    request.input("cuentareferencia", sql.Int, cuentaReferencia);

    await request.execute("sp_actualizarEstadoTransaccion");
  } catch (err) {
    console.error(`Error al actualizar estado de TX ${transactionId}:`, err.message);
  }
};

/**
 * Procesa la autorización de un pago directo usando sp_autorizarPago
 */
const procesarAutorizacion = async (tarjcodigo, monto, tarjfecha, tarjcvv, merchantid, emplcodigo = 100, tipocodigo = 2) => {
  try {
    const pool = await getConnection();
    const request = pool.request();

    // Entradas
    request.input('tarjcodigo', sql.VarChar(16), tarjcodigo);
    request.input('monto', sql.Decimal(18, 2), monto);
    request.input('tarjfecha', sql.VarChar(5), tarjfecha);
    request.input('tarjcvv', sql.VarChar(4), tarjcvv);
    request.input('merchantid', sql.VarChar(50), merchantid); // 🆕 Agregar merchantId
    request.input('emplcodigo', sql.Int, emplcodigo);
    request.input('tipocodigo', sql.Int, tipocodigo);
    
    // Salidas
    request.output('resultado', sql.VarChar(15));
    request.output('mensaje', sql.VarChar(100));
    request.output('cuentacodigo', sql.Int);

    // Ejecutar SP
    const resultSP = await request.execute('sp_autorizarPago');

    // Leer salidas
    return {
      status: resultSP.output.resultado || 'RECHAZADO',
      mensaje: resultSP.output.mensaje || 'Respuesta no proporcionada por el SP.',
      cuentacodigo: resultSP.output.cuentacodigo || null
    };
  } catch (err) {
    console.error('💥 Error SQL al autorizar pago:', err.message);
    return {
      status: 'RECHAZADO',
      mensaje: 'Error de ejecución en el banco. Transacción fallida.',
      cuentacodigo: null
    };
  }
};

/**
 * Procesa un pago completo a través de la pasarela (para comercios externos).
 * @param {object} params
 * @param {string} params.merchantId
 * @param {number} params.amount
 * @param {string} params.cardNumber
 * @param {string} params.expDate
 * @param {string} params.cvv
 * @returns {Promise<{success: boolean, transactionId: number, message: string, errorCode?: string}>}
 */
const processPaymentGateway = async ({ merchantId, amount, cardNumber, expDate, cvv }) => {
  let pasarelaTxId = null;

  try {
    // 1️⃣ Registrar transacción inicial
    pasarelaTxId = await registerInitialTransaction({ merchantId, amount, cardNumber });

    // 2️⃣ Llamada al banco usando sp_autorizarPago con validaciones completas
    const bankResponse = await procesarAutorizacion(cardNumber, amount, expDate, cvv, merchantId, 100, 2);

    // 3️⃣ Mapear estado del banco a interno
    const statusMap = {
      APROBADO: "SUCCESS",
      RECHAZADO: "FAILED",
      ERROR: "ERROR",
    };
    const finalStatus = statusMap[bankResponse.status] || "UNKNOWN";

    // 4️⃣ Actualizar en BD
    await updateTransactionStatus({
      transactionId: pasarelaTxId,
      status: finalStatus,
      message: bankResponse.mensaje,
      cuentaReferencia: bankResponse.cuentacodigo || null,
    });

    return {
      success: finalStatus === "SUCCESS",
      transactionId: pasarelaTxId,
      message: bankResponse.mensaje,
      errorCode: bankResponse.codigo || null,
    };
  } catch (error) {
    console.error("Fallo durante el procesamiento del pago:", error.message);

    if (pasarelaTxId) {
      try {
        await updateTransactionStatus({
          transactionId: pasarelaTxId,
          status: "FALLIDO",
          message: error.message,
        });
      } catch (dbErr) {
        console.error("No se pudo actualizar estado en BD:", dbErr.message);
      }
    }

    return {
      success: false,
      transactionId: pasarelaTxId,
      message: error.message,
      errorCode: "PROCESSING_ERROR",
    };
  }
};

export default {
  procesarAutorizacion,
  processPaymentGateway,
  registerInitialTransaction,
  updateTransactionStatus
};