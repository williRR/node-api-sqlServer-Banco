// modules/transacciones/transacciones.controller.js
import service from './transacciones.service.js'; // Importa el objeto { procesarAutorizacion }

// Exportación con nombre para la función del controlador
const autorizarPago = async (req, res) => {
    try {
        const { tarjeta, monto, emplcodigo, tipocodigo } = req.body; 

        if (!tarjeta || !monto) {
            return res.status(400).json({ status: 'RECHAZADO', mensaje: 'Faltan parámetros requeridos (tarjeta, monto).' });
        }

        // Llama al servicio a través de la importación por defecto
        const resultado = await service.procesarAutorizacion(tarjeta, monto, emplcodigo, tipocodigo);
        
        if (resultado.status === 'APROBADO') {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado); 
        }

    } catch (error) {
        console.error('Error en el controlador de autorización:', error);
        res.status(500).json({ status: 'FALLIDO', mensaje: 'Error interno del servidor del banco.' });
    }
};

// Exportación por defecto para que las rutas puedan usar 'controller.autorizarPago'
export default { autorizarPago };