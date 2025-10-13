import * as negocioService from './negocio.service.js';

// Funciones existentes 
export const crearNegocio = async (req, res) => {
  try {
    const data = req.body;
    const nuevoNegocio = await negocioService.crearNegocio(data);
    res.status(201).json(nuevoNegocio);
  } catch (error) {
    res.status(500).json({ message: "Error al crear negocio", error: error.message });
  }
};

export const obtenerNegocios = async (req, res) => {
  try {
    const negocios = await negocioService.obtenerNegocios();
    res.json(negocios);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener negocios", error: error.message });
  }
};

export const obtenerNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const negocio = await negocioService.obtenerNegocio(id);
    if (!negocio) {
      return res.status(404).json({ message: "Negocio no encontrado" });
    }
    res.json(negocio);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar negocio", error: error.message });
  }
};

export const actualizarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const negocioActualizado = await negocioService.actualizarNegocio(id, data);
    res.json(negocioActualizado);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar negocio", error: error.message });
  }
};

// 🆕 Nuevas funciones agregadas
export const generarOrdenPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, concepto, vigenciaHoras = 24 } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a cero'
      });
    }

    const resultado = await negocioService.generarOrdenPago({
      negocioId: id,
      monto,
      concepto: concepto || 'Pago de servicios',
      vigenciaHoras
    });

    res.json({
      success: true,
      message: 'Orden de pago generada exitosamente',
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al generar orden de pago", 
      error: error.message 
    });
  }
};

export const verOrdenesPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado = 'TODAS', limite = 20 } = req.query;

    const resultado = await negocioService.obtenerOrdenesPago(id, { estado, limite });

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener órdenes", 
      error: error.message 
    });
  }
};

export const verIngresos = async (req, res) => {
  try {
    const { id } = req.params;
    const { fechaInicio, fechaFin, limite = 50 } = req.query;

    const resultado = await negocioService.obtenerIngresos(id, { fechaInicio, fechaFin, limite });

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener ingresos", 
      error: error.message 
    });
  }
};

export const dashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await negocioService.obtenerDashboard(id);
    
    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Negocio no encontrado o sin cuenta activa'
      });
    }

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener dashboard", 
      error: error.message 
    });
  }
};