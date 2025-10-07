import sql from 'mssql';
import { dbSettings } from '../../config/db.js';

const { VarChar, Decimal } = sql;

export const procesarAutorizacion = async (tarjeta, monto) => {
  let pool;

  try {
    pool = await sql.connect(dbSettings);
    const request = pool.request();

    // Entradas
    request.input('tarjcodigo', VarChar(16), tarjeta);
    request.input('monto', Decimal(18, 2), monto);

    // Salidas
    request.output('resultado', VarChar(15));
    request.output('mensaje', VarChar(100));

    // Ejecutar SP
    const resultSP = await request.execute('sp_ejecutarDebito');

    // Leer salidas
    return {
      status: resultSP.output.resultado || 'RECHAZADO',
      mensaje: resultSP.output.mensaje || 'Respuesta no proporcionada por el SP.',
    };
  } catch (err) {
    console.error('💥 Error SQL al ejecutar débito:', err.message);
    return {
      status: 'RECHAZADO',
      mensaje: 'Error de ejecución en el banco. Transacción fallida.',
    };
  } finally {
    if (pool) await pool.close();
  }
};

export default { procesarAutorizacion };
