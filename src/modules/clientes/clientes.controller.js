import * as clientesService from "./clientes.service.js";
import { getConnection } from "../../config/db.js";
import sql from "mssql";

export const crearCliente = async (req, res) => {
  try {
    console.log('📝 Creando nuevo cliente...');
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const { 
      paterno, 
      materno, 
      nombre, 
      dni, 
      nacimiento, 
      ciudad, 
      direccion, 
      telefono, 
      email
    } = req.body;

    // Validaciones básicas
    if (!paterno || !materno || !nombre || !dni) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: paterno, materno, nombre, dni'
      });
    }

    const pool = await getConnection();
    const request = pool.request();
    
    // ✅ Parámetros con nombres que coinciden con el SP
    request.input('cliepaterno', sql.VarChar(25), paterno);
    request.input('cliematerno', sql.VarChar(25), materno);
    request.input('clienombre', sql.VarChar(30), nombre);
    request.input('cliedni', sql.VarChar(14), dni);
    request.input('clienacimiento', sql.Date, nacimiento || '1990-01-01');
    request.input('clieciudad', sql.VarChar(30), ciudad || 'Guatemala');
    request.input('cliedireccion', sql.VarChar(50), direccion || '');
    request.input('clietelefono', sql.VarChar(20), telefono || null);
    request.input('clieemail', sql.VarChar(50), email || null);

    console.log('🔄 Ejecutando sp_crearCliente...');
    
    const result = await request.execute('sp_crearCliente');
    
    console.log('✅ Procedimiento ejecutado');
    console.log('Resultado:', JSON.stringify(result.recordset, null, 2));
    
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'El procedimiento no devolvió datos'
      });
    }

    const data = result.recordset[0];
    
    // Verificar si hubo error
    if (data.Exito === 0) {
      return res.status(400).json({
        success: false,
        message: data.Mensaje,
        errorNumero: data.ErrorNumero
      });
    }

    // Éxito
    return res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      data: {
        clienteId: data.ClienteID,
        nombre: `${data.Nombre} ${data.Paterno} ${data.Materno}`,
        email: data.Email,
        dni: data.DNI,
        usuario: data.Usuario,
        clave: data.Clave
      }
    });

  } catch (error) {
    console.error('💥 ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    console.log('📝 Solicitud de transferencia recibida:');
    console.log(`   Cliente: ${id}`);
    console.log(`   Cuenta destino: ${cuentaDestino}`);
    console.log(`   Monto: ${monto}`);

    if (!cuentaDestino || !monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos para la transferencia',
        errores: {
          cuentaDestino: !cuentaDestino ? 'Cuenta destino requerida' : undefined,
          monto: (!monto || monto <= 0) ? 'Monto debe ser mayor a 0' : undefined
        }
      });
    }

    const resultado = await clientesService.realizarTransferencia({
      clienteId: id,
      cuentaDestino,
      monto,
      concepto: concepto || 'Transferencia'
    });

    if (resultado.success) {
      console.log('✅ Transferencia exitosa');
      return res.json({
        success: true,
        message: 'Transferencia realizada exitosamente',
        data: resultado.data
      });
    } else {
      console.log('❌ Transferencia fallida:', resultado.message);
      return res.status(400).json({
        success: false,
        message: resultado.message
      });
    }
  } catch (error) {
    console.error('💥 Error en controlador de transferencia:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error al realizar transferencia", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// 💳 Registrar transacción de pasarela (nuevo endpoint)
export const registrarTransaccionPasarela = async (req, res) => {
  try {
    const { merchantId, monto, moneda, ultimos4 } = req.body;

    console.log('📝 Registrando transacción de pasarela...');

    if (!merchantId || !monto || !ultimos4) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos para registrar transacción',
        camposRequeridos: ['merchantId', 'monto', 'ultimos4']
      });
    }

    const resultado = await clientesService.registrarTransaccionPasarela({
      merchantId,
      monto,
      moneda: moneda || 'GTQ',
      ultimos4
    });

    if (resultado.success) {
      return res.status(201).json({
        success: true,
        message: 'Transacción registrada exitosamente',
        data: resultado.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: resultado.message
      });
    }
  } catch (error) {
    console.error('💥 Error en registrarTransaccionPasarela:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: "Error al registrar transacción", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


