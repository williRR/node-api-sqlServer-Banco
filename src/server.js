import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sql from 'mssql';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { getConnection } from './config/db.js';

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

// Variable global para el pool de conexiones
let poolPromise;

async function initializeDatabase() {
  try {
    console.log('🔌 Conectando a la base de datos...');
    poolPromise = await getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
}

async function getDbPool() {
  if (!poolPromise) {
    await initializeDatabase();
  }
  return poolPromise;
}

// ===== RUTAS =====

// QUITA estas 2 líneas si aún están:
// const require = createRequire(import.meta.url);
// const authRoutes = require('./modules/auth/auth.routes.js');

// Usa import ESM:
import authRoutes from './modules/auth/auth.routes.js';

// Montar rutas de autenticación bajo /api/v1/auth
app.use('/api/v1/auth', authRoutes);

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

// Obtener merchants válidos desde la base de datos
app.get('/api/v1/pagos/merchants', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({
        status: 'error',
        message: 'Base de datos no disponible',
        fallback_merchants: [
          { id: '2001', name: 'Comercio Demo 2001', status: 'demo' },
          { id: '2002', name: 'Comercio Demo 2002', status: 'demo' }
        ]
      });
    }

    const request = pool.request();
    const result = await request.query(`
      SELECT NegocioID, Nombre, NIT, Ciudad, Estado, FechaCreacion
      FROM Negocio 
      WHERE Estado = 'Activo'
      ORDER BY Nombre
    `);

    res.json({
      status: 'success',
      message: 'Lista de merchants afiliados activos',
      data: {
        merchants: result.recordset.map(merchant => ({
          id: merchant.NegocioID.toString(),
          name: merchant.Nombre,
          nit: merchant.NIT,
          city: merchant.Ciudad,
          status: merchant.Estado,
          created: merchant.FechaCreacion
        })),
        total: result.recordset.length,
        note: 'Use el campo "id" como merchantId en los pagos'
      }
    });
  } catch (error) {
    console.error('Error obteniendo merchants:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor',
      fallback_merchants: [
        { id: '2001', name: 'Comercio Demo 2001', status: 'demo' },
        { id: '2002', name: 'Comercio Demo 2002', status: 'demo' }
      ]
    });
  }
});

// ===== ENDPOINT PRINCIPAL: PROCESAR PAGO CON TARJETA =====
app.post('/api/v1/pagos/charge', async (req, res) => {
  try {
    const startTime = Date.now();
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    console.log(`💳 Nueva solicitud de pago desde IP: ${clientIP}`);
    
    // Extraer datos del request
    const { 
      merchantId, 
      cardNumber, 
      amount, 
      expDate, 
      cvv,
      cardHolderName,
      billingAddress,
      currency = 'GTQ',
      description = 'Pago procesado por Banco GT'
    } = req.body;

    // ===== VALIDACIONES ESTRICTAS =====
    
    // 1. Campos requeridos
    const requiredFields = { merchantId, cardNumber, amount, expDate, cvv };
    const missingFields = Object.entries(requiredFields)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        errorCode: 'MISSING_FIELDS',
        missingFields
      });
    }

    // 2. Validar monto
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 50000) {
      return res.status(400).json({
        status: 'error',
        message: 'Monto inválido. Debe ser mayor a 0 y menor a Q50,000',
        errorCode: 'INVALID_AMOUNT'
      });
    }

    // 3. Validar número de tarjeta (Luhn algorithm)
    const cleanCardNumber = cardNumber.replace(/\s/g, '');
    if (!isValidCardNumber(cleanCardNumber)) {
      return res.status(400).json({
        status: 'error',
        message: 'Número de tarjeta inválido',
        errorCode: 'INVALID_CARD_NUMBER'
      });
    }

    // 4. Validar fecha de vencimiento
    if (!isValidExpDate(expDate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Fecha de vencimiento inválida o expirada',
        errorCode: 'INVALID_EXP_DATE'
      });
    }

    // 5. Validar CVV
    if (!/^[0-9]{3,4}$/.test(cvv)) {
      return res.status(400).json({
        status: 'error',
        message: 'CVV inválido',
        errorCode: 'INVALID_CVV'
      });
    }

    // 6. Validar merchantId contra la base de datos
    try {
      const pool = await getDbPool();
      if (pool) {
        const merchantRequest = pool.request();
        merchantRequest.input('NegocioID', sql.Int, parseInt(merchantId));
        
        const merchantResult = await merchantRequest.query(`
          SELECT NegocioID, Nombre, Estado 
          FROM Negocio 
          WHERE NegocioID = @NegocioID AND Estado = 'Activo'
        `);

        if (merchantResult.recordset.length === 0) {
          return res.status(400).json({
            status: 'error',
            message: `Merchant ID no válido o inactivo: ${merchantId}`,
            errorCode: 'INVALID_MERCHANT',
            suggestion: 'Verifique que el NegocioID sea correcto y esté activo'
          });
        }
        
        console.log(`✅ Merchant validado: ${merchantResult.recordset[0].Nombre}`);
      } else {
        // Si no hay conexión a BD, permitir algunos IDs de prueba
        const testMerchants = ['2001', '2002', 'DEMO_STORE'];
        if (!testMerchants.includes(merchantId)) {
          return res.status(400).json({
            status: 'error',
            message: `BD no disponible. Use merchant de prueba: ${testMerchants.join(', ')}`,
            errorCode: 'DB_UNAVAILABLE_INVALID_MERCHANT'
          });
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Error validando merchant en BD:', dbError.message);
      // En caso de error de BD, permitir algunos IDs conocidos
      const fallbackMerchants = ['2001', '2002', 'DEMO_STORE'];
      if (!fallbackMerchants.includes(merchantId)) {
        return res.status(400).json({
          status: 'error',
          message: `Error de BD. Use merchant de prueba: ${fallbackMerchants.join(', ')}`,
          errorCode: 'DB_ERROR_INVALID_MERCHANT'
        });
      }
    }

    // 7. Determinar tipo de tarjeta
    const cardType = getCardType(cleanCardNumber);
    
    // ===== SIMULACIÓN DE PROCESAMIENTO =====
    
    console.log(`🔄 Procesando pago: ${cardType} **** ${cleanCardNumber.slice(-4)} por Q${numAmount}`);
    
    // Simular tiempo de procesamiento (1-3 segundos)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
    
    // Lógica de aprobación/rechazo más realista
    const { approved, declineReason } = simulatePaymentProcessing(cleanCardNumber, numAmount, cardType);
    
    if (approved) {
      // ===== PAGO APROBADO =====
      const transactionId = generateTransactionId();
      const authCode = generateAuthCode();
      const processTime = Date.now() - startTime;
      
      // Log de transacción exitosa
      console.log(`✅ Pago aprobado - TXN: ${transactionId}, Tiempo: ${processTime}ms`);
      
      // Respuesta exitosa
      const successResponse = {
        status: 'success',
        message: 'Pago procesado exitosamente',
        data: {
          transactionId,
          authorizationCode: authCode,
          merchantId,
          amount: numAmount,
          currency,
          cardType,
          cardLast4: cleanCardNumber.slice(-4),
          timestamp: new Date().toISOString(),
          processingTime: `${processTime}ms`,
          description,
          receipt: {
            merchantName: await getMerchantName(merchantId),
            transactionDate: new Date().toLocaleString('es-GT'),
            reference: `REF${transactionId.slice(-8)}`
          }
        }
      };

      // Simular guardado en base de datos (opcional)
      try {
        await saveTransactionToDatabase(successResponse.data);
      } catch (dbError) {
        console.warn('⚠️ Error guardando en BD:', dbError.message);
      }

      return res.status(200).json(successResponse);
      
    } else {
      // ===== PAGO RECHAZADO =====
      const processTime = Date.now() - startTime;
      
      console.log(`❌ Pago rechazado - Razón: ${declineReason}, Tiempo: ${processTime}ms`);
      
      return res.status(402).json({
        status: 'declined',
        message: getDeclineMessage(declineReason),
        errorCode: declineReason,
        data: {
          merchantId,
          amount: numAmount,
          cardLast4: cleanCardNumber.slice(-4),
          timestamp: new Date().toISOString(),
          processingTime: `${processTime}ms`
        }
      });
    }

  } catch (error) {
    console.error('💥 Error crítico procesando pago:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Error interno del servidor. Intente nuevamente.',
      errorCode: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
});

// ===== FUNCIONES AUXILIARES PARA PAGOS =====

// Validar número de tarjeta con algoritmo de Luhn
function isValidCardNumber(cardNumber) {
  if (!/^[0-9]{13,19}$/.test(cardNumber)) return false;
  
  let sum = 0;
  let alternate = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));
    
    if (alternate) {
      digit *= 2;
      if (digit > 9) digit = (digit % 10) + 1;
    }
    
    sum += digit;
    alternate = !alternate;
  }
  
  return (sum % 10) === 0;
}

// Validar fecha de vencimiento
function isValidExpDate(expDate) {
  if (!/^\d{2}\/\d{2}$/.test(expDate)) return false;
  
  const [month, year] = expDate.split('/').map(num => parseInt(num));
  if (month < 1 || month > 12) return false;
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
}

// Determinar tipo de tarjeta
function getCardType(cardNumber) {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = cardNumber.substring(0, 2);
  const firstFourDigits = cardNumber.substring(0, 4);
  
  if (firstDigit === '4') return 'VISA';
  if (['51', '52', '53', '54', '55'].includes(firstTwoDigits)) return 'MASTERCARD';
  if (['34', '37'].includes(firstTwoDigits)) return 'AMERICAN_EXPRESS';
  if (firstFourDigits === '6011') return 'DISCOVER';
  
  return 'UNKNOWN';
}

// Simular procesamiento de pago
function simulatePaymentProcessing(cardNumber, amount, cardType) {
  // Tarjetas de prueba que siempre fallan
  const testDeclinedCards = [
    '4000000000000002', // Tarjeta genérica rechazada
    '4000000000000127', // CVV incorrecto
    '4000000000000069', // Tarjeta expirada
    '1111111111111111'  // Número inválido
  ];
  
  if (testDeclinedCards.includes(cardNumber)) {
    return { approved: false, declineReason: 'CARD_DECLINED' };
  }
  
  // Simular diferentes escenarios de rechazo
  const random = Math.random();
  
  if (amount > 10000 && random < 0.1) {
    return { approved: false, declineReason: 'AMOUNT_EXCEEDED' };
  }
  
  if (random < 0.05) {
    return { approved: false, declineReason: 'INSUFFICIENT_FUNDS' };
  }
  
  if (random < 0.02) {
    return { approved: false, declineReason: 'SUSPECTED_FRAUD' };
  }
  
  // 93% de aprobación
  return { approved: true, declineReason: null };
}

// Generar ID de transacción único
function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TXN${timestamp}${random}`;
}

// Generar código de autorización
function generateAuthCode() {
  return Math.floor(Math.random() * 900000 + 100000).toString();
}

// Obtener nombre del comercio (ahora async para consultar BD)
async function getMerchantName(merchantId) {
  try {
    const pool = await getDbPool();
    if (pool) {
      const request = pool.request();
      request.input('NegocioID', sql.Int, parseInt(merchantId));
      
      const result = await request.query(`
        SELECT Nombre FROM Negocio WHERE NegocioID = @NegocioID
      `);
      
      if (result.recordset.length > 0) {
        return result.recordset[0].Nombre;
      }
    }
  } catch (error) {
    console.warn('⚠️ Error obteniendo nombre del merchant:', error.message);
  }
  
  // Fallback para merchants conocidos
  const fallbackMerchants = {
    '2001': 'Comercio Demo 2001',
    '2002': 'Comercio Demo 2002', 
    'DEMO_STORE': 'Tienda Demo'
  };
  
  return fallbackMerchants[merchantId] || `Comercio ${merchantId}`;
}

// Obtener mensaje de rechazo amigable
function getDeclineMessage(declineReason) {
  const messages = {
    'CARD_DECLINED': 'Su tarjeta fue rechazada. Contacte a su banco.',
    'INSUFFICIENT_FUNDS': 'Fondos insuficientes en su tarjeta.',
    'AMOUNT_EXCEEDED': 'El monto excede el límite permitido.',
    'SUSPECTED_FRAUD': 'Transacción bloqueada por seguridad. Contacte a su banco.',
    'EXPIRED_CARD': 'Su tarjeta ha expirado.',
    'INVALID_CVV': 'Código de seguridad incorrecto.'
  };
  
  return messages[declineReason] || 'Transacción no autorizada.';
}

// Guardar transacción en base de datos (simulado)
async function saveTransactionToDatabase(transactionData) {
  try {
    const pool = await getDbPool();
    if (!pool) {
      console.warn('⚠️ BD no disponible, transacción no guardada');
      return;
    }
    
    const request = pool.request();
    request.input('TransactionId', sql.VarChar, transactionData.transactionId);
    request.input('MerchantId', sql.VarChar, transactionData.merchantId);
    request.input('Amount', sql.Decimal(10, 2), transactionData.amount);
    request.input('CardLast4', sql.VarChar, transactionData.cardLast4);
    request.input('CardType', sql.VarChar, transactionData.cardType);
    request.input('AuthCode', sql.VarChar, transactionData.authorizationCode);
    request.input('Status', sql.VarChar, 'APPROVED');
    
    await request.query(`
      INSERT INTO Transacciones (TransactionId, MerchantId, Amount, CardLast4, CardType, AuthCode, Status, FechaCreacion)
      VALUES (@TransactionId, @MerchantId, @Amount, @CardLast4, @CardType, @AuthCode, @Status, GETDATE())
    `);
    
    console.log(`💾 Transacción guardada en BD: ${transactionData.transactionId}`);
  } catch (error) {
    console.warn('⚠️ Error guardando transacción:', error.message);
  }
}

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
        count: result.recordset.length,
        totalIngresos: totalResult.recordset[0].TotalIngresos,
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