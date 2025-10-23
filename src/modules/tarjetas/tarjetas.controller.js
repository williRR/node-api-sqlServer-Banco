import { getConnection } from "../../config/db.js";
import sql from "mssql";

export const crearTarjeta = async (req, res) => {
  try {
    const data = req.body;
    const nuevaTarjeta = await tarjetaService.crearTarjeta(data);
    res.status(201).json(nuevaTarjeta);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarjeta', error: error.message });
  }
};

// Obtener tarjetas de un cliente (por clienteId)
export const obtenerTarjetasCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const request = pool.request();
    request.input("ClienteID", sql.Int, parseInt(id));

    const result = await request.query(`
      SELECT t.chr_tarjcodigo AS tarjetaCodigo,
             t.vch_tarjetipo AS tarjetaTipo,
             t.vch_tarjestado AS tarjetaEstado,
             t.dtt_tarjfechavencimiento AS fechaVencimiento,
             c.int_cuencodigo AS cuentaId
      FROM Tarjeta t
      INNER JOIN Cuenta c ON t.int_cuencodigo = c.int_cuencodigo
      WHERE c.int_cliecodigo = @ClienteID
        AND c.vch_cuenestado = 'ACTIVO'
    `);

    const tarjetas = result.recordset.map(r => {
      const code = r.tarjetaCodigo || "";
      const last4 = code.slice(-4);
      const masked = last4 ? `**** **** **** ${last4}` : null;
      return {
        tarjetaMask: masked,
        tarjetaLast4: last4,
        tarjetaTipo: r.tarjetaTipo,
        tarjetaEstado: r.tarjetaEstado,
        fechaVencimiento: r.fechaVencimiento,
        cuentaId: r.cuentaId
      };
    });

    res.json({ success: true, count: tarjetas.length, data: tarjetas });
  } catch (error) {
    console.error("Error obteniendo tarjetas de cliente:", error.message);
    res.status(500).json({ success: false, message: "Error interno al obtener tarjetas" });
  }
};

// Obtener tarjetas de un negocio (por negocioId)
export const obtenerTarjetasNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();
    const request = pool.request();
    request.input("NegocioID", sql.Int, parseInt(id));

    const result = await request.query(`
      SELECT t.chr_tarjcodigo AS tarjetaCodigo,
             t.vch_tarjetipo AS tarjetaTipo,
             t.vch_tarjestado AS tarjetaEstado,
             t.dtt_tarjfechavencimiento AS fechaVencimiento,
             c.int_cuencodigo AS cuentaId
      FROM Tarjeta t
      INNER JOIN Cuenta c ON t.int_cuencodigo = c.int_cuencodigo
      WHERE c.int_negocodigo = @NegocioID
        AND c.vch_cuenestado = 'ACTIVO'
    `);

    const tarjetas = result.recordset.map(r => {
      const code = r.tarjetaCodigo || "";
      const last4 = code.slice(-4);
      const masked = last4 ? `**** **** **** ${last4}` : null;
      return {
        tarjetaMask: masked,
        tarjetaLast4: last4,
        tarjetaTipo: r.tarjetaTipo,
        tarjetaEstado: r.tarjetaEstado,
        fechaVencimiento: r.fechaVencimiento,
        cuentaId: r.cuentaId
      };
    });

    res.json({ success: true, count: tarjetas.length, data: tarjetas });
  } catch (error) {
    console.error("Error obteniendo tarjetas de negocio:", error.message);
    res.status(500).json({ success: false, message: "Error interno al obtener tarjetas" });
  }
};

export default {
  obtenerTarjetasCliente,
  obtenerTarjetasNegocio
};