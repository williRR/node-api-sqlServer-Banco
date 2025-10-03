// modules/transacciones/transacciones.service.js
const sql = require('mssql'); 
const dbConfig = require('../../config/db'); // Asumiendo que la configuracin de conexin est aqu

exports.procesarAutorizacion = async (tarjeta, monto, emplcodigo = 100, tipocodigo = 2) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        const request = pool.request();
        
        // Definir variables de salida del SP
        request.output('resultado', sql.VarChar(15));
        request.output('mensaje', sql.VarChar(50));
        
        // Ejecucin del SP sp_ejecutarDebito
        await request.execute('sp_ejecutarDebito', {
            tarjcodigo: tarjeta,
            monto: monto,
            emplcodigo: emplcodigo, 
            tipocodigo: tipocodigo  
        });

        // Obtener variables de salida
        const resultado = request.parameters.resultado.value;
        const mensaje = request.parameters.mensaje.value;

        // Devolver la respuesta al controlador
        return {
            status: resultado, // 'APROBADO', 'RECHAZADO', 'FALLIDO'
            mensaje: mensaje
        };

    } catch (err) {
        // Manejar errores de SQL o conexin
        console.error('Error al ejecutar dbito:', err);
        throw err; // Relanza el error para que lo capture el controlador
    }
};