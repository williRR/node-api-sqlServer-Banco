// ✅ modules/pagos/pagos.controller.js
import service from './pagos.service.js';

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

export default { 
  autorizarPago, 
  processPaymentGateway,
  validateCharge
};
