// modules/transacciones/transacciones.controller.js (Banco Ficticio)

import service from './transacciones.service.js'; 

const autorizarPago = async (req, res) => {
    try {
        // 🚨 Desestructuracin correcta
        const { tarjcodigo, monto ,tarjfecha, tarjcvv} = req.body; 
        
 

        // Validacin
        if (!tarjcodigo || !monto || !tarjfecha || !tarjcvv) {
            return res.status(400).json({ 
                status: 'RECHAZADO', 
                mensaje: 'Faltan parmetros requeridos (tarjcodigo, monto, tarjfecha, tarjcvv).'
            });
        }

        const resultado = await service.procesarAutorizacion(
            tarjcodigo, // Usamos la variable declarada arriba
            monto,
            tarjfecha,
            tarjcvv
        );
        
        // Manejo de respuesta
        if (resultado.status === 'APROBADO') {
            return res.status(200).json(resultado);
        } else {
            return res.status(400).json(resultado); 
        }

    } catch (error) { 
        // Si hay un error, el log en el Banco muestra el trace SQL/JS
        console.error('Error interno del Banco al procesar SP:', error);
        
        // Devolvemos el 500 para indicar que el servidor fall.
        res.status(500).json({ 
            status: 'FALLIDO', 
            mensaje: 'Error interno del servidor del banco. Revise el log del servidor.'
        });
    }
};

export default { autorizarPago };