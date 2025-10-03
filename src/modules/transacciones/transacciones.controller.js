// modules/transacciones/transacciones.controller.js
const service = require('./transacciones.service');

exports.autorizarPago = async (req, res) => {
    try {
        // Datos esperados desde tu Pasarela de Pago
        const { tarjeta, monto, emplcodigo, tipocodigo } = req.body; 

        // Validaciones bsicas (monto, existencia de campos)
        if (!tarjeta || !monto) {
            return res.status(400).json({ status: 'RECHAZADO', mensaje: 'Faltan parmetros requeridos (tarjeta, monto).' });
        }

        // Llama al servicio para ejecutar la lgica transaccional del banco
        const resultado = await service.procesarAutorizacion(tarjeta, monto, emplcodigo, tipocodigo);
        
        // Responde a la Pasarela de Pago
        if (resultado.status === 'APROBADO') {
            // El dbito fue exitoso
            return res.status(200).json(resultado);
        } else {
            // Fondos insuficientes, tarjeta no vlida, etc.
            return res.status(400).json(resultado); 
        }

    } catch (error) {
        // Error de conexin a DB o error inesperado del SP
        console.error('Error en el controlador de autorizacin:', error);
        res.status(500).json({ status: 'FALLIDO', mensaje: 'Error interno del servidor del banco.' });
    }
};