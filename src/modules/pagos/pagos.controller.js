// ✅ modules/transacciones/transacciones.controller.js
import service from './transacciones.service.js';

/**
 * Controlador que autoriza un pago.
 * Endpoint: POST /autorizar
 */
const autorizarPago = async (req, res) => {
  try {
    const { tarjcodigo, monto } = req.body;

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

export default { autorizarPago };
