import sql from 'mssql'; 
const { VarChar } = sql; // Desestructuramos las propiedades del objeto 'sql'
import { dbSettings } from '../../config/db.js';   


// Exportación con nombre de la función principal
export const procesarAutorizacion = async (tarjeta, monto, emplcodigo = 100, tipocodigo = 2) => {
    try {
        const pool = await sql.connect(dbSettings);
        
        const request = pool.request();
        
        // Definir variables de salida del SP
        request.output('resultado', VarChar(15));
        request.output('mensaje', VarChar(50));
        
        // Ejecución del SP sp_ejecutarDebito
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
        console.error('Error al ejecutar débito:', err);
        throw err; // Relanza el error para que lo capture el controlador
    }
};

// Exportación por defecto para facilitar la importación como objeto 'service'
export default { procesarAutorizacion };