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
 * Procesar autorización de pago usando sp_autorizarPago
 * @merchantid ahora es INT (int_negocodigo)
 */
export const procesarAutorizacion = async (
  tarjcodigo,
  monto,
  tarjfecha,
  tarjcvv,
  merchantid,  // ✅ Ahora es INT (int_negocodigo)
  emplcodigo = 100,
  tipocodigo = 2
) => {
  try {
    console.log('🔐 Servicio: Procesando autorización...');
    console.log(`   Tarjeta: ${tarjcodigo}`);
    console.log(`   Merchant ID (int_negocodigo): ${merchantid}`);
    console.log(`   Monto: ${monto}`);

    const pool = await getConnection();
    const request = pool.request();

    // ✅ Parámetros INPUT - merchantid ahora es INT
    request.input('tarjcodigo', sql.VarChar(16), tarjcodigo);
    request.input('monto', sql.Decimal(18, 2), parseFloat(monto));
    request.input('tarjfecha', sql.VarChar(5), tarjfecha);
    request.input('tarjcvv', sql.VarChar(4), tarjcvv);
    request.input('merchantid', sql.Int, parseInt(merchantid));  // ✅ Cambiado a Int
    request.input('emplcodigo', sql.Int, emplcodigo);
    request.input('tipocodigo', sql.Int, tipocodigo);

    // ✅ Parámetros OUTPUT
    request.output('resultado', sql.VarChar(15));
    request.output('mensaje', sql.VarChar(100));
    request.output('cuentacodigo', sql.Int);

    console.log('🔄 Ejecutando sp_autorizarPago...');
    const result = await request.execute('sp_autorizarPago');

    const resultado = result.output.resultado;
    const mensaje = result.output.mensaje;
    const cuentacodigo = result.output.cuentacodigo;

    console.log(`📊 Resultado del SP: ${resultado}`);
    console.log(`📝 Mensaje del SP: ${mensaje}`);

    return {
      status: resultado,
      mensaje: mensaje,
      cuentacodigo: cuentacodigo
    };

  } catch (error) {
    console.error('💥 Error en procesarAutorizacion:', error.message);
    throw error;
  }
};

export async function procesarPagoConTarjeta(paymentData) {
  try {
    // Desestructura los datos necesarios
    const {
      cardNumber,
      amount,
      expDate,
      cvv,
      merchantId,
      emplcodigo = 100,
      tipocodigo = 2
    } = paymentData;

    // Llama correctamente a procesarAutorizacion
    const resultado = await procesarAutorizacion(
      cardNumber,
      amount,
      expDate,
      cvv,
      merchantId,
      emplcodigo,
      tipocodigo
    );

    if (resultado.status === 'APROBADO') {
      // ⚠️ COMENTAR WEBHOOKS TEMPORALMENTE
      // await enviarWebhookAlNegocio(paymentData.merchantId, resultado);
      console.log('ℹ️ Webhooks deshabilitados (no implementados)');
    }

    return resultado;
  } catch (error) {
    console.error('💥 Error en procesarPagoConTarjeta:', error.message);
    throw error;
  }
}

export default {
  procesarAutorizacion,
  registerInitialTransaction,
  updateTransactionStatus
};