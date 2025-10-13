# 💳 Endpoint de Pagos - Banco GT API

## 🎯 **Endpoint Principal: Procesar Pago con Tarjeta**

```
POST /api/v1/pagos/charge
```

**URL Completa:** `https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge`

---

## 📋 **Parámetros de Entrada**

### **Campos Requeridos:**

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `merchantId` | String | ID del negocio (NegocioID de BD) | `"2001"` |
| `cardNumber` | String | Número de tarjeta (sin espacios) | `"4000007714144690"` |
| `amount` | Number | Monto a cobrar | `125.50` |
| `expDate` | String | Fecha vencimiento MM/YY | `"12/26"` |
| `cvv` | String | Código de seguridad | `"123"` |

### **Campos Opcionales:**

| Campo | Tipo | Descripción | Por Defecto |
|-------|------|-------------|-------------|
| `cardHolderName` | String | Nombre en la tarjeta | - |
| `currency` | String | Moneda | `"GTQ"` |
| `description` | String | Descripción del pago | `"Pago procesado por Banco GT"` |
| `billingAddress` | Object | Dirección de facturación | - |

---

## ✅ **Respuesta Exitosa (Status 200)**

```json
{
  "status": "success",
  "message": "Pago procesado exitosamente",
  "data": {
    "transactionId": "TXN1697234567890123",
    "authorizationCode": "487362",
    "merchantId": "STORE_001_FASHION",
    "amount": 125.50,
    "currency": "GTQ",
    "cardType": "VISA",
    "cardLast4": "4690",
    "timestamp": "2024-10-13T22:30:45.123Z",
    "processingTime": "1245ms",
    "description": "Pago procesado por Banco GT",
    "receipt": {
      "merchantName": "Fashion Store GT",
      "transactionDate": "13/10/2024, 16:30:45",
      "reference": "REF90123"
    }
  }
}
```

---

## ❌ **Respuesta de Rechazo (Status 402)**

```json
{
  "status": "declined",
  "message": "Su tarjeta fue rechazada. Contacte a su banco.",
  "errorCode": "CARD_DECLINED",
  "data": {
    "merchantId": "STORE_001_FASHION",
    "amount": 125.50,
    "cardLast4": "4690",
    "timestamp": "2024-10-13T22:30:45.123Z",
    "processingTime": "1245ms"
  }
}
```

---

## 🚫 **Respuesta de Error de Validación (Status 400)**

```json
{
  "status": "error",
  "message": "Campos requeridos faltantes: cardNumber, cvv",
  "errorCode": "MISSING_FIELDS",
  "missingFields": ["cardNumber", "cvv"]
}
```

---

## 🧪 **Ejemplos de Uso**

### **1. JavaScript/Fetch**

```javascript
const paymentData = {
  merchantId: "2001",
  cardNumber: "4000007714144690",
  amount: 125.50,
  expDate: "12/26",
  cvv: "123",
  cardHolderName: "Juan Pérez",
  description: "Compra en línea - Orden #12345"
};

fetch('https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(paymentData)
})
.then(response => response.json())
.then(result => {
  if (result.status === 'success') {
    console.log('✅ Pago exitoso:', result.data.transactionId);
    // Mostrar mensaje de éxito al usuario
    showSuccessMessage(result.data);
  } else {
    console.log('❌ Pago rechazado:', result.message);
    // Mostrar error al usuario
    showErrorMessage(result.message);
  }
})
.catch(error => {
  console.error('💥 Error:', error);
  showErrorMessage('Error de conexión. Intente nuevamente.');
});
```

### **2. cURL**

```bash
# Pago exitoso
curl -X POST "https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "STORE_001_FASHION",
    "cardNumber": "4000007714144690",
    "amount": 125.50,
    "expDate": "12/26",
    "cvv": "123",
    "description": "Pago de prueba"
  }'

# Pago que será rechazado
curl -X POST "https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "STORE_001_FASHION",
    "cardNumber": "4000000000000002",
    "amount": 100.00,
    "expDate": "12/26",
    "cvv": "123"
  }'
```

### **3. PHP**

```php
<?php
$paymentData = [
    'merchantId' => 'STORE_001_FASHION',
    'cardNumber' => '4000007714144690',
    'amount' => 125.50,
    'expDate' => '12/26',
    'cvv' => '123',
    'description' => 'Pago desde PHP'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
$result = json_decode($response, true);

if ($result['status'] === 'success') {
    echo "✅ Pago exitoso: " . $result['data']['transactionId'];
} else {
    echo "❌ Error: " . $result['message'];
}

curl_close($ch);
?>
```

### **4. Python**

```python
import requests
import json

payment_data = {
    "merchantId": "STORE_001_FASHION",
    "cardNumber": "4000007714144690",
    "amount": 125.50,
    "expDate": "12/26",
    "cvv": "123",
    "description": "Pago desde Python"
}

response = requests.post(
    'https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge',
    headers={'Content-Type': 'application/json'},
    json=payment_data
)

result = response.json()

if result['status'] == 'success':
    print(f"✅ Pago exitoso: {result['data']['transactionId']}")
else:
    print(f"❌ Error: {result['message']}")
```

---

## 🧪 **Tarjetas de Prueba**

### **Tarjetas que Aprueban:**
| Número | Tipo | CVV | Vencimiento |
|--------|------|-----|-------------|
| `4000007714144690` | VISA | `123` | `12/26` |
| `5555555555554444` | MASTERCARD | `456` | `08/25` |
| `4111111111111111` | VISA | `789` | `03/27` |

### **Tarjetas que Rechazan:**
| Número | Razón de Rechazo |
|--------|------------------|
| `4000000000000002` | Tarjeta rechazada |
| `4000000000000127` | CVV incorrecto |
| `4000000000000069` | Tarjeta expirada |
| `1111111111111111` | Número inválido |

---

## 🔒 **Códigos de Error**

| Código | Descripción |
|--------|-------------|
| `MISSING_FIELDS` | Campos requeridos faltantes |
| `INVALID_AMOUNT` | Monto inválido |
| `INVALID_CARD_NUMBER` | Número de tarjeta inválido |
| `INVALID_EXP_DATE` | Fecha de vencimiento inválida |
| `INVALID_CVV` | CVV inválido |
| `CARD_DECLINED` | Tarjeta rechazada |
| `INSUFFICIENT_FUNDS` | Fondos insuficientes |
| `AMOUNT_EXCEEDED` | Monto excede límite |
| `SUSPECTED_FRAUD` | Transacción sospechosa |
| `INTERNAL_ERROR` | Error interno del servidor |

---

## 📊 **Límites y Restricciones**

- **Monto mínimo:** Q0.01
- **Monto máximo:** Q50,000.00
- **Rate limiting:** 100 requests por minuto por IP
- **Timeout:** 30 segundos
- **Tarjetas soportadas:** VISA, Mastercard, American Express

---

## 🔐 **Seguridad**

- ✅ Validación de tarjeta con algoritmo de Luhn
- ✅ Encriptación HTTPS obligatoria
- ✅ No se almacena información sensible de tarjetas
- ✅ Logs seguros sin datos sensibles
- ✅ Rate limiting por IP
- ✅ Validación estricta de entrada

---

## 📞 **Soporte**

- **Email:** soporte@banco-gt.com
- **Documentación:** https://docs.banco-gt.com
- **Status API:** https://status.banco-gt.com