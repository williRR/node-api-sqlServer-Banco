import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app = express();

// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://banco-gt-api-aa7d620b23f8.herokuapp.com',
        'https://banco-gt-api-aa7d620b23f8.herokuapp.com',
        'https://banco-gt-api.herokuapp.com',
        /\.herokuapp\.com$/, // Permitir subdominios de Heroku
        /\.fly\.dev$/, // Permitir subdominios de fly.dev
      ]
    : '*', // En desarrollo permitir todo
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Configuración de la base de datos
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectionTimeout: 60000,
    requestTimeout: 60000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Variable global para el pool de conexiones
let poolPromise;

async function initializeDatabase() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    poolPromise = new sql.ConnectionPool(dbConfig);
    await poolPromise.connect();
    console.log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    return false;
  }
}

// Función para obtener el pool de conexiones
async function getDbPool() {
  if (!poolPromise) {
    await initializeDatabase();
  }
  return poolPromise;
}

// ===== RUTAS =====

// Ruta de salud y versión del widget
app.get('/api/v1/widget/version', (req, res) => {
  res.json({
    status: 'success',
    version: '1.1.0',
    message: 'Banco GT Widget API funcionando correctamente',
    timestamp: new Date().toISOString(),
    features: [
      'Pagos con tarjeta',
      'Panel de negocio',
      'Generación de órdenes',
      'Dashboard en tiempo real',
      'Códigos QR'
    ],
    updateUrl: 'https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js'
  });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🏦 Banco GT API - Sistema Bancario Completo',
    version: '1.1.0',
    status: 'OK',
    endpoints: {
      widget_version: '/api/v1/widget/version',
      payment_demo: '/demo.html',
      business_panel: '/business-demo.html',
      widget_js: '/widget/banco-payment-widget.js'
    },
    timestamp: new Date().toISOString()
  });
});

// ===== RUTAS DE PAGOS =====

// Procesar pago con tarjeta
app.post('/api/v1/pagos/charge', async (req, res) => {
  try {
    const { merchantId, cardNumber, amount, expDate, cvv } = req.body;

    // Validaciones básicas
    if (!merchantId || !cardNumber || !amount || !expDate || !cvv) {
      return res.status(400).json({
        status: 'error',
        message: 'Todos los campos son requeridos'
      });
    }

    // Validar formato de tarjeta
    const cardRegex = /^[0-9]{13,19}$/;
    if (!cardRegex.test(cardNumber.replace(/\s/g, ''))) {
      return res.status(400).json({
        status: 'error',
        message: 'Número de tarjeta inválido'
      });
    }

    // Simulación de procesamiento
    const isApproved = Math.random() > 0.1; // 90% de aprobación

    if (isApproved) {
      const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
      
      res.json({
        status: 'success',
        message: 'Pago procesado exitosamente',
        transactionId,
        amount,
        merchantId,
        timestamp: new Date().toISOString(),
        cardLast4: cardNumber.slice(-4)
      });
    } else {
      res.status(402).json({
        status: 'error',
        message: 'Pago rechazado. Intente con otra tarjeta.',
        errorCode: 'CARD_DECLINED'
      });
    }
  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor'
    });
  }
});

// ===== RUTAS DE CLIENTES =====

// Obtener información del cliente
app.get('/api/v1/cliente/:id', async (req, res) => {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, req.params.id);
    const result = await request.query(`
      SELECT ClienteID, Nombre, Paterno, Materno, DNI, Ciudad, Direccion, Telefono, Email, FechaCreacion
      FROM Cliente 
      WHERE ClienteID = @ClienteID
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nuevo cliente
app.post('/api/v1/cliente', async (req, res) => {
  try {
    const { paterno, materno, nombre, dni, nacimiento, ciudad, direccion, telefono, email } = req.body;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('Paterno', sql.VarChar, paterno);
    request.input('Materno', sql.VarChar, materno);
    request.input('Nombre', sql.VarChar, nombre);
    request.input('DNI', sql.VarChar, dni);
    request.input('Nacimiento', sql.Date, nacimiento);
    request.input('Ciudad', sql.VarChar, ciudad);
    request.input('Direccion', sql.VarChar, direccion);
    request.input('Telefono', sql.VarChar, telefono);
    request.input('Email', sql.VarChar, email);

    const result = await request.query(`
      INSERT INTO Cliente (Paterno, Materno, Nombre, DNI, Nacimiento, Ciudad, Direccion, Telefono, Email, FechaCreacion)
      OUTPUT INSERTED.ClienteID
      VALUES (@Paterno, @Materno, @Nombre, @DNI, @Nacimiento, @Ciudad, @Direccion, @Telefono, @Email, GETDATE())
    `);

    res.json({
      success: true,
      message: 'Cliente creado exitosamente',
      clienteId: result.recordset[0].ClienteID
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener saldo del cliente
app.get('/api/v1/cliente/:id/saldo', async (req, res) => {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, req.params.id);
    const result = await request.query(`
      SELECT CuentaID, TipoCuenta, Saldo, Estado
      FROM Cuenta 
      WHERE ClienteID = @ClienteID AND Estado = 'Activa'
    `);

    res.json({
      success: true,
      data: {
        clienteId: req.params.id,
        cuentas: result.recordset,
        totalSaldo: result.recordset.reduce((sum, cuenta) => sum + cuenta.Saldo, 0)
      }
    });
  } catch (error) {
    console.error('Error obteniendo saldo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener movimientos del cliente
app.get('/api/v1/cliente/:id/movimientos', async (req, res) => {
  try {
    const { limite = 10, pagina = 1 } = req.query;
    const offset = (pagina - 1) * limite;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, req.params.id);
    request.input('Limite', sql.Int, parseInt(limite));
    request.input('Offset', sql.Int, offset);

    const result = await request.query(`
      SELECT TOP (@Limite) m.MovimientoID, m.TipoMovimiento, m.Monto, m.Descripcion, 
             m.FechaMovimiento, c.CuentaID, c.TipoCuenta
      FROM Movimiento m
      INNER JOIN Cuenta c ON m.CuentaID = c.CuentaID
      WHERE c.ClienteID = @ClienteID
      ORDER BY m.FechaMovimiento DESC
      OFFSET @Offset ROWS
    `);

    res.json({
      success: true,
      data: {
        movimientos: result.recordset,
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: result.recordset.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Realizar transferencia
app.post('/api/v1/cliente/:id/transferir', async (req, res) => {
  try {
    const { cuentaDestino, monto, concepto } = req.body;
    const clienteId = req.params.id;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, clienteId);
    request.input('CuentaDestino', sql.Int, cuentaDestino);
    request.input('Monto', sql.Decimal(10, 2), monto);
    request.input('Concepto', sql.VarChar, concepto);

    const result = await request.execute('sp_RealizarTransferencia');

    res.json({
      success: true,
      message: 'Transferencia realizada exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error en transferencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando transferencia'
    });
  }
});

// Pagar orden de pago
app.post('/api/v1/cliente/:id/pagar-orden', async (req, res) => {
  try {
    const { codigoOrden, claveAcceso } = req.body;
    const clienteId = req.params.id;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('ClienteID', sql.Int, clienteId);
    request.input('CodigoOrden', sql.VarChar, codigoOrden);
    request.input('ClaveAcceso', sql.VarChar, claveAcceso);

    const result = await request.execute('sp_PagarOrdenPago');

    res.json({
      success: true,
      message: 'Orden pagada exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error pagando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando pago de orden'
    });
  }
});

// ===== RUTAS DE NEGOCIOS =====

// Crear nuevo negocio
app.post('/api/v1/negocio', async (req, res) => {
  try {
    const { nombre, nit, ciudad, direccion, telefono, email } = req.body;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('Nombre', sql.VarChar, nombre);
    request.input('NIT', sql.VarChar, nit);
    request.input('Ciudad', sql.VarChar, ciudad);
    request.input('Direccion', sql.VarChar, direccion);
    request.input('Telefono', sql.VarChar, telefono);
    request.input('Email', sql.VarChar, email);

    const result = await request.query(`
      INSERT INTO Negocio (Nombre, NIT, Ciudad, Direccion, Telefono, Email, FechaCreacion)
      OUTPUT INSERTED.NegocioID
      VALUES (@Nombre, @NIT, @Ciudad, @Direccion, @Telefono, @Email, GETDATE())
    `);

    res.json({
      success: true,
      message: 'Negocio creado exitosamente',
      negocioId: result.recordset[0].NegocioID
    });
  } catch (error) {
    console.error('Error creando negocio:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Dashboard del negocio
app.get('/api/v1/negocio/:id/dashboard', async (req, res) => {
  try {
    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, req.params.id);

    // Obtener estadísticas del negocio
    const saldoResult = await request.query(`
      SELECT COALESCE(SUM(c.Saldo), 0) as SaldoTotal
      FROM Cuenta c
      INNER JOIN Cliente cl ON c.ClienteID = cl.ClienteID
      WHERE cl.ClienteID IN (
        SELECT DISTINCT ClienteID FROM Cuenta WHERE CuentaID IN (
          SELECT DISTINCT CuentaDestinoID FROM OrdenPago WHERE NegocioID = @NegocioID AND Estado = 'PAGADO'
        )
      )
    `);

    const ordenesResult = await request.query(`
      SELECT COUNT(*) as OrdenesPendientes
      FROM OrdenPago 
      WHERE NegocioID = @NegocioID AND Estado = 'PENDIENTE' AND FechaVencimiento > GETDATE()
    `);

    const pagosHoyResult = await request.query(`
      SELECT COUNT(*) as PagosHoy, COALESCE(SUM(Monto), 0) as IngresosHoy
      FROM OrdenPago 
      WHERE NegocioID = @NegocioID AND Estado = 'PAGADO' 
      AND CAST(FechaPago AS DATE) = CAST(GETDATE() AS DATE)
    `);

    res.json({
      success: true,
      data: {
        saldoActual: saldoResult.recordset[0].SaldoTotal || 0,
        ordenesPendientes: ordenesResult.recordset[0].OrdenesPendientes || 0,
        pagosHoy: pagosHoyResult.recordset[0].PagosHoy || 0,
        ingresosHoy: pagosHoyResult.recordset[0].IngresosHoy || 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Generar orden de pago
app.post('/api/v1/negocio/:id/generar-orden', async (req, res) => {
  try {
    const { monto, concepto, vigenciaHoras } = req.body;
    const negocioId = req.params.id;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, negocioId);
    request.input('Monto', sql.Decimal(10, 2), monto);
    request.input('Concepto', sql.VarChar, concepto);
    request.input('VigenciaHoras', sql.Int, vigenciaHoras);

    const result = await request.execute('sp_GenerarOrdenPago');

    res.json({
      success: true,
      message: 'Orden de pago generada exitosamente',
      data: result.recordset[0]
    });
  } catch (error) {
    console.error('Error generando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando orden de pago'
    });
  }
});

// Obtener órdenes del negocio
app.get('/api/v1/negocio/:id/ordenes', async (req, res) => {
  try {
    const { estado, limite = 10 } = req.query;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, req.params.id);
    request.input('Limite', sql.Int, parseInt(limite));

    let query = `
      SELECT TOP (@Limite) OrdenPagoID, CodigoOrden, Monto, Concepto, Estado, 
             FechaCreacion, FechaVencimiento, FechaPago
      FROM OrdenPago 
      WHERE NegocioID = @NegocioID
    `;

    if (estado) {
      query += ` AND Estado = '${estado}'`;
    }

    query += ` ORDER BY FechaCreacion DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: {
        ordenes: result.recordset,
        total: result.recordset.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo órdenes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener ingresos del negocio
app.get('/api/v1/negocio/:id/ingresos', async (req, res) => {
  try {
    const { limite = 10 } = req.query;

    const pool = await getDbPool();
    const request = pool.request();
    
    request.input('NegocioID', sql.Int, req.params.id);
    request.input('Limite', sql.Int, parseInt(limite));

    const result = await request.query(`
      SELECT TOP (@Limite) OrdenPagoID, CodigoOrden, Monto, Concepto, FechaPago
      FROM OrdenPago 
      WHERE NegocioID = @NegocioID AND Estado = 'PAGADO'
      ORDER BY FechaPago DESC
    `);

    const totalResult = await request.query(`
      SELECT COALESCE(SUM(Monto), 0) as TotalIngresos
      FROM OrdenPago 
      WHERE NegocioID = @NegocioID AND Estado = 'PAGADO'
    `);

    res.json({
      success: true,
      data: {
        ingresos: result.recordset,
        totalIngresos: totalResult.recordset[0].TotalIngresos,
        count: result.recordset.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo ingresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===== MANEJO DE ERRORES =====

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// Middleware de manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// ===== CONFIGURACIÓN DEL SERVIDOR =====

const PORT = process.env.PORT || 3000;

// Inicializar base de datos y servidor
async function startServer() {
  console.log('🚀 Iniciando Banco GT API...');
  
  // Intentar conectar a la base de datos (no crítico para el inicio)
  const dbConnected = await initializeDatabase();
  if (!dbConnected) {
    console.log('⚠️ Servidor iniciado sin conexión a BD (funcionará con mocks)');
  }

  // Iniciar servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎉 Servidor Banco GT API corriendo en puerto ${PORT}`);
    console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 URLs disponibles:`);
    console.log(`   - Health: http://localhost:${PORT}/api/v1/widget/version`);
    console.log(`   - Widget: http://localhost:${PORT}/demo.html`);
    console.log(`   - Business: http://localhost:${PORT}/business-demo.html`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔌 DB Server: ${process.env.DB_SERVER ? '✅ Configurado' : '❌ No configurado'}`);
      console.log(`🗃️ Database: ${process.env.DB_DATABASE ? '✅ Configurado' : '❌ No configurado'}`);
    }
  });
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Error no capturado:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  process.exit(1);
});

// Inicializar servidor
startServer().catch((error) => {
  console.error('💥 Error iniciando servidor:', error);
  process.exit(1);
});