# 🏦 Banco Tikal - Documentación de Pasarela de Pagos

## 📋 Índice

1. [Introducción](#introducción)
2. [Cómo Funciona](#cómo-funciona)
3. [Integración Rápida](#integración-rápida)
4. [Dos Métodos de Pago](#dos-métodos-de-pago)
5. [API Reference](#api-reference)
6. [Ejemplos de Código](#ejemplos-de-código)
7. [Datos de Prueba](#datos-de-prueba)
8. [Webhooks](#webhooks)
9. [Seguridad](#seguridad)

---

## 🎯 Introducción

Banco Tikal ofrece una **pasarela de pagos completa** que permite a comercios procesar pagos de forma segura mediante:

- 💳 **Pagos con tarjeta** (instantáneos)
- 🧾 **Órdenes de pago** (el cliente paga después)

### Ventajas

✅ Integración en **5 minutos**  
✅ Widget JavaScript **plug & play**  
✅ API REST simple y documentada  
✅ Sin costos de integración  
✅ Sandbox completo para pruebas  

---

## 🔄 Cómo Funciona

### Flujo General

```
1. COMERCIO integra widget → 2. CLIENTE paga → 3. BANCO procesa → 4. COMERCIO recibe confirmación
```

### Arquitectura

```
┌─────────────────┐
│  E-COMMERCE     │
│  (Tu tienda)    │
└────────┬────────┘
         │
         │ Integra Widget
         ▼
┌─────────────────┐
│  WIDGET BANCO   │
│  TIKAL          │
└────────┬────────┘
         │
         │ POST /api/v1/pagos/charge
         ▼
┌─────────────────┐
│  API BANCO      │
│  TIKAL          │
├─────────────────┤
│  - Valida       │
│  - Procesa      │
│  - Notifica     │
└────────┬────────┘
         │
         │ Actualiza BD
         ▼
┌─────────────────┐
│  BASE DE DATOS  │
│  SQL SERVER     │
└─────────────────┘
```

---

## ⚡ Integración Rápida (5 minutos)

### Paso 1: Incluir el Widget

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Tienda</title>
</head>
<body>
    <h1>Checkout</h1>
    
    <!-- Contenedor del widget -->
    <div id="banco-tikal-widget"></div>

    <!-- Cargar script -->
    <script src="https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js"></script>
    
    <script>
        // Inicializar widget
        BancoTikalWidget.init({
            merchantId: 2002,  // Tu ID de negocio
            amount: 150.50,    // Monto a cobrar
            currency: 'GTQ',
            
            onSuccess: function(data) {
                console.log('Pago exitoso:', data);
                // Redirigir a confirmación
                window.location.href = '/orden-confirmada?txn=' + data.transactionId;
            },
            
            onError: function(error) {
                console.error('Error:', error);
                alert('Pago rechazado: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### Paso 2: ¡Listo!

Ya puedes recibir pagos. El widget se encarga de todo.

---

## 💳 Dos Métodos de Pago

### Opción 1: Pago con Tarjeta (Instantáneo)

```javascript
// El cliente paga con tarjeta AHORA
BancoTikalWidget.init({
    merchantId: 2002,
    amount: 250.50,
    onSuccess: function(data) {
        // data.transactionId
        // data.amount
        // data.cardLast4
        guardarTransaccionEnTuBD(data);
    }
});
```

**Flujo:**
1. Cliente ingresa datos de tarjeta
2. Widget valida y envía a Banco Tikal
3. Banco procesa en 1-3 segundos
4. Respuesta inmediata: APROBADO o RECHAZADO

### Opción 2: Orden de Pago (Diferido)

```javascript
// El cliente paga DESPUÉS en su portal bancario
BancoTikalWidget.init({
    merchantId: 2002,
    amount: 250.50,
    onSuccess: function(data) {
        // data.codigoOrden (ej: ORD1234567)
        // data.claveAcceso (ej: 8852)
        mostrarCodigoAlCliente(data);
    }
});
```

**Flujo:**
1. Cliente solicita orden de pago
2. Banco genera código único (ORD1234567) y clave (8852)
3. Cliente guarda el código
4. Cliente ingresa a su portal bancario y paga con el código
5. Recibes notificación cuando pague

---

## 📡 API Reference

### Base URL

```
Producción: https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1
Local: http://localhost:3000/api/v1
```

### Endpoints Principales

#### 1. Procesar Pago con Tarjeta

```http
POST /pagos/charge
Content-Type: application/json

{
  "merchantId": 2002,
  "cardNumber": "4000007714144690",
  "amount": 150.50,
  "expDate": "12/26",
  "cvv": "123"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Pago procesado exitosamente",
  "data": {
    "transactionId": "TXN1697481234567890",
    "authorizationCode": "123456",
    "merchantId": 2002,
    "amount": 150.50,
    "currency": "GTQ",
    "cardType": "VISA",
    "cardLast4": "4690",
    "timestamp": "2025-10-16T12:30:00Z"
  }
}
```

**Respuesta Rechazada (402):**
```json
{
  "status": "declined",
  "message": "Fondos insuficientes",
  "errorCode": "INSUFFICIENT_FUNDS",
  "data": {
    "merchantId": 2002,
    "amount": 150.50,
    "cardLast4": "4690",
    "timestamp": "2025-10-16T12:30:00Z"
  }
}
```

#### 2. Generar Orden de Pago

```http
POST /negocio/{merchantId}/generar-orden
Content-Type: application/json

{
  "monto": 250.50,
  "concepto": "Pago de factura #001234",
  "vigenciaHoras": 48
}
```

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Orden de pago generada exitosamente",
  "data": {
    "codigoOrden": "ORD1234567",
    "claveAcceso": "8852",
    "monto": 250.50,
    "concepto": "Pago de factura #001234",
    "fechaVencimiento": "2025-10-18T12:30:00Z",
    "vigenciaHoras": 48
  }
}
```

#### 3. Obtener Merchants Válidos

```http
GET /pagos/merchants
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "merchants": [
      {
        "id": "2001",
        "name": "Café La Esquina",
        "nit": "12345678-1",
        "city": "Guatemala",
        "status": "Activo"
      },
      {
        "id": "2002",
        "name": "Tienda Tech",
        "nit": "98765432-1",
        "city": "Antigua",
        "status": "Activo"
      }
    ],
    "total": 2
  }
}
```

#### 4. Consultar Estado de Transacción

```http
GET /pagos/transaccion/{transactionId}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "transactionId": "TXN1697481234567890",
    "merchantId": "2002",
    "amount": 150.50,
    "status": "APROBADO",
    "timestamp": "2025-10-16T12:30:00Z"
  }
}
```

---

## 💻 Ejemplos de Código

### Ejemplo en HTML/JavaScript (Frontend)

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Checkout - Mi Tienda</title>
</head>
<body>
    <h1>Finalizar Compra</h1>
    <p>Total a pagar: <strong>Q250.50</strong></p>
    
    <div id="banco-tikal-widget"></div>

    <script src="https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js"></script>
    <script>
        BancoTikalWidget.init({
            merchantId: 2002,
            amount: 250.50,
            currency: 'GTQ',
            
            onSuccess: function(paymentData) {
                if (paymentData.transactionId) {
                    // Pago con tarjeta exitoso
                    fetch('/api/mi-tienda/guardar-pago', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ordenId: localStorage.getItem('ordenId'),
                            transactionId: paymentData.transactionId,
                            amount: paymentData.amount,
                            status: 'PAGADO'
                        })
                    }).then(() => {
                        window.location.href = '/confirmacion?orden=' + paymentData.transactionId;
                    });
                } else if (paymentData.codigoOrden) {
                    // Orden de pago generada
                    alert('Orden generada: ' + paymentData.codigoOrden + '\nClave: ' + paymentData.claveAcceso);
                }
            },
            
            onError: function(error) {
                alert('Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### Ejemplo en Node.js (Backend - Verificar Pago)

```javascript
// Verificar que el pago se completó
app.get('/api/verificar-pago/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Consultar estado en Banco Tikal
    const response = await fetch(
      `https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/transaccion/${transactionId}`
    );
    
    const data = await response.json();
    
    if (data.success && data.data.status === 'APROBADO') {
      // Actualizar orden en tu base de datos
      await db.query('UPDATE ordenes SET estado = ? WHERE transactionId = ?', 
        ['PAGADO', transactionId]);
      
      res.json({ success: true, message: 'Pago verificado' });
    } else {
      res.json({ success: false, message: 'Pago no encontrado o rechazado' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error verificando pago' });
  }
});
```

### Ejemplo en Python (Backend)

```python
import requests

def verificar_pago(transaction_id):
    url = f"https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/transaccion/{transaction_id}"
    
    response = requests.get(url)
    data = response.json()
    
    if data['success'] and data['data']['status'] == 'APROBADO':
        print(f"✅ Pago aprobado: Q{data['data']['amount']}")
        return True
    else:
        print("❌ Pago no encontrado o rechazado")
        return False

# Uso
verificar_pago("TXN1697481234567890")
```

---

## 🧪 Datos de Prueba

### Tarjetas de Prueba

| Número | Tipo | Resultado |
|--------|------|-----------|
| `4000007714144690` | VISA | ✅ Aprobado |
| `5555555555554444` | Mastercard | ✅ Aprobado |
| `4000000000000002` | VISA | ❌ Rechazado (genérico) |
| `4000000000000127` | VISA | ❌ CVV incorrecto |
| `4000000000000069` | VISA | ❌ Tarjeta expirada |

### Datos Válidos de Prueba

```
Tarjeta: 4000007714144690
CVV: 551
Fecha: 10/30
Monto: Cualquiera entre 0.01 y 50,000
```

### Merchants de Prueba

```
Merchant ID: 2001 (Café La Esquina)
Merchant ID: 2002 (Tienda Tech)
```

---

## 🔔 Webhooks (Notificaciones Automáticas)

### Cómo Configurar

1. En tu perfil de negocio, configura tu URL de webhook:
```
https://tu-tienda.com/webhook/banco-tikal
```

2. Cuando un pago se complete, recibirás un POST:

```http
POST https://tu-tienda.com/webhook/banco-tikal
Content-Type: application/json
X-Banco-Tikal-Signature: abc123...

{
  "event": "payment.success",
  "merchantId": "2002",
  "data": {
    "transactionId": "TXN1697481234567890",
    "amount": 150.50,
    "status": "APROBADO",
    "timestamp": "2025-10-16T12:30:00Z"
  }
}
```

3. En tu servidor, procesa la notificación:

```javascript
app.post('/webhook/banco-tikal', (req, res) => {
  const signature = req.headers['x-banco-tikal-signature'];
  
  // Verificar firma (opcional pero recomendado)
  if (!verificarFirma(req.body, signature)) {
    return res.status(401).send('Firma inválida');
  }
  
  const { event, data } = req.body;
  
  if (event === 'payment.success') {
    // Actualizar orden como pagada
    actualizarOrden(data.transactionId, 'PAGADO');
  }
  
  res.status(200).send('OK');
});
```

---

## 🔒 Seguridad

### Mejores Prácticas

✅ **Nunca almacenes números de tarjeta completos**  
✅ **Usa HTTPS siempre**  
✅ **Valida webhooks con firmas**  
✅ **Implementa rate limiting**  
✅ **Registra todas las transacciones**  

### Validación de Firmas (Webhooks)

```javascript
const crypto = require('crypto');

function verificarFirma(payload, signatureRecibida) {
  const secret = 'tu_webhook_secret';
  const signatureCalculada = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signatureCalculada === signatureRecibida;
}
```

---

## 📞 Soporte

- **Email:** soporte@bancotikal.com
- **Documentación:** https://banco-gt-api-aa7d620b23f8.herokuapp.com/docs
- **Widget Demo:** https://banco-gt-api-aa7d620b23f8.herokuapp.com/demo.html

---

## 📝 Changelog

### v2.0.0 (2025-10-16)
- ✅ Widget con 2 opciones de pago
- ✅ Órdenes de pago implementadas
- ✅ Validación de merchantId contra BD
- ✅ Mejoras en seguridad

### v1.0.0 (2025-10-01)
- ✅ Lanzamiento inicial
- ✅ Pagos con tarjeta
- ✅ API REST completa

---

¿Listo para empezar? ¡Integra Banco Tikal en 5 minutos! 🚀
