import * as clientesService from "./clientes.service.js";

export const crearCliente = async (req, res) => {
  try {
    const data = req.body;
    const nuevoCliente = await clientesService.crearCliente(data);
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error: error.message });
  } 
};

export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await clientesService.obtenerCliente(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar cliente", error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const clienteActualizado = await clientesService.actualizarCliente(id, data);
    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
  }
};

// 💰 Ver saldo de cuenta del cliente
export const verSaldo = async (req, res) => {
  try {
    const { id } = req.params;
    const saldo = await clientesService.obtenerSaldoCliente(id);
    if (!saldo) {
      return res.status(404).json({ 
        success: false, 
        message: "Cliente no encontrado o sin cuenta activa" 
      });
    }
    res.json({
      success: true,
      data: saldo
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener saldo", 
      error: error.message 
    });
  }
};

// 📋 Ver movimientos del cliente
export const verMovimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { limite = 20, pagina = 1 } = req.query;
    const movimientos = await clientesService.obtenerMovimientosCliente(id, { limite, pagina });
    res.json({
      success: true,
      data: movimientos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al obtener movimientos", 
      error: error.message 
    });
  }
};

// 💸 Realizar transferencia
export const realizarTransferencia = async (req, res) => {
  try {
    const { id } = req.params;
    const { cuentaDestino, monto, concepto } = req.body;

    if (!cuentaDestino || !monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos para la transferencia'
      });
    }

    const resultado = await clientesService.realizarTransferencia({
      clienteId: id,
      cuentaDestino,
      monto,
      concepto: concepto || 'Transferencia'
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Transferencia realizada exitosamente',
        data: resultado.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: resultado.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al realizar transferencia", 
      error: error.message 
    });
  }
};

// 🧾 Pagar orden de pago
export const pagarOrdenPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { codigoOrden, claveAcceso } = req.body;

    if (!codigoOrden || !claveAcceso) {
      return res.status(400).json({
        success: false,
        message: 'Código de orden y clave de acceso son requeridos'
      });
    }

    const resultado = await clientesService.pagarOrdenPago({
      clienteId: id,
      codigoOrden,
      claveAcceso
    });

    if (resultado.success) {
      res.json({
        success: true,
        message: 'Orden de pago procesada exitosamente',
        data: resultado.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: resultado.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Error al pagar orden", 
      error: error.message 
    });
  }
};


