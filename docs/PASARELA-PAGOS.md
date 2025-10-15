# 💳 Documentación de Pasarela de Pagos - Banco GT

## Descripción General

La pasarela de pagos permite a negocios (merchants) aceptar pagos con tarjeta de crédito/débito de forma segura. Los pagos se registran en la tabla `TransaccionPasarela`.

## Flujo de Pago

```
Cliente → Widget/Formulario → POST /api/v1/pagos/charge → Validación → Banco → Respuesta
```

---

## 1. Obtener Merchants Válidos

### Endpoint
```
GET /api/v1/pagos/merchants
```

### Respuesta Exitosa
```json
{
  "status": "success",
  "message": "Lista de merchants afiliados activos",
  "data": {
    "merchants": [
      {
        "id": "2001",
        "name": "Café El Gato Feliz",
        "nit": "852147963-1",
        "city": "Guatemala",
        "status": "Activo"
      }
    ],
    "total": 1
  }
}
```

---

## 2. Procesar Pago con Tarjeta

### Endpoint
```
POST /api/v1/pagos/charge
```

### Headers
```
Content-Type: application/json
```

### Body (JSON)
```json
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690",
  "amount": 150.50,
  "expDate": "12/26",
  "cvv": "123",
  "cardHolderName": "Juan Pérez",
  "currency": "GTQ",
  "description": "Compra en Café El Gato Feliz"
}
```

### Campos Requeridos
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `merchantId` | string | ID del negocio (obtener de `/merchants`) |
| `cardNumber` | string | Número de tarjeta (13-19 dígitos) |
| `amount` | number | Monto a cobrar (máx 50,000) |
| `expDate` | string | Fecha vencimiento (MM/YY) |
| `cvv` | string | Código seguridad (3-4 dígitos) |

### Campos Opcionales
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cardHolderName` | string | Nombre del titular |
| `currency` | string | Moneda (default: GTQ) |
| `description` | string | Descripción del pago |

---

## 3. Respuestas de la API

### ✅ Pago Exitoso (200)
```json
{
  "status": "success",
  "message": "Pago procesado exitosamente",
  "data": {
    "transactionId": "TXN1737788400123",
    "authorizationCode": "456789",
    "merchantId": "2001",
    "amount": 150.50,
    "currency": "GTQ",
    "cardType": "VISA",
    "cardLast4": "4690",
    "timestamp": "2025-01-15T04:30:00.000Z",
    "processingTime": "1234ms",
    "receipt": {
      "merchantName": "Café El Gato Feliz",
      "transactionDate": "15/1/2025 04:30:00",
      "reference": "REF00123"
    }
  }
}
```

### ❌ Pago Rechazado (402)
```json
{
  "status": "declined",
  "message": "Fondos insuficientes",
  "errorCode": "INSUFFICIENT_FUNDS",
  "data": {
    "merchantId": "2001",
    "amount": 150.50,
    "cardLast4": "4690",
    "timestamp": "2025-01-15T04:30:00.000Z"
  }
}
```

### ❌ Error de Validación (400)
```json
{
  "status": "error",
  "message": "Número de tarjeta inválido",
  "errorCode": "INVALID_CARD_NUMBER"
}
```

---

## 4. Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| `MISSING_FIELDS` | Faltan campos requeridos | Incluir todos los campos obligatorios |
| `INVALID_AMOUNT` | Monto inválido | Usar monto entre 0.01 y 50,000 |
| `INVALID_CARD_NUMBER` | Tarjeta inválida | Verificar número de tarjeta |
| `INVALID_EXP_DATE` | Fecha vencida | Usar tarjeta válida |
| `INVALID_CVV` | CVV incorrecto | Verificar código de seguridad |
| `INVALID_MERCHANT` | Merchant no válido | Usar ID de merchant activo |
| `CARD_DECLINED` | Tarjeta rechazada | Contactar banco emisor |
| `INSUFFICIENT_FUNDS` | Fondos insuficientes | Usar otra tarjeta |
| `AMOUNT_EXCEEDED` | Monto excedido | Reducir monto de pago |
| `SUSPECTED_FRAUD` | Sospecha de fraude | Contactar banco emisor |

---

## 5. Tarjetas de Prueba

### ✅ Tarjetas que SIEMPRE se aprueban
```
4000007714144690  (VISA)
5555555555554444  (MASTERCARD)
378282246310005   (AMEX)
```

### ❌ Tarjetas que SIEMPRE se rechazan
```
4000000000000002  (Rechazada genérica)
4000000000000127  (CVV incorrecto)
4000000000000069  (Tarjeta expirada)
```

---

## 6. Integración con Widget JavaScript

### HTML Básico
```html
<!DOCTYPE html>
<html>
<head>
    <title>Pago con Banco GT</title>
</head>
<body>
    <div id="banco-widget"></div>
    <script src="https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js"></script>
    <script>
        BancoPaymentWidget.init({
            merchantId: '2001',
            amount: 150.50,
            currency: 'GTQ',
            onSuccess: function(result) {
                console.log('Pago exitoso:', result);
            },
            onError: function(error) {
                console.error('Error:', error);
            }
        });
    </script>
</body>
</html>
```

### JavaScript Vanilla
```javascript
fetch('https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        merchantId: '2001',
        cardNumber: '4000007714144690',
        amount: 150.50,
        expDate: '12/26',
        cvv: '123'
    })
})
.then(res => res.json())
.then(data => {
    if (data.status === 'success') {
        console.log('Pago aprobado:', data.data.transactionId);
    } else {
        console.error('Pago rechazado:', data.message);
    }
});
```

---

## 7. Seguridad

### ✅ Implementado
- Validación de tarjetas (algoritmo de Luhn)
- Validación de fecha de vencimiento
- Validación de CVV
- Validación de merchantId contra BD
- CORS configurado
- Helmet para headers de seguridad

### ⚠️ Para Producción Real
- [ ] Usar HTTPS obligatorio
- [ ] Tokenizar números de tarjeta (PCI DSS)
- [ ] Implementar 3D Secure
- [ ] Rate limiting
- [ ] Logs de auditoría
- [ ] Encriptar datos sensibles en BD

---

## 8. Tabla de Base de Datos

### TransaccionPasarela
```sql
CREATE TABLE TransaccionPasarela (
    int_transaccionid INT PRIMARY KEY IDENTITY(100000, 1),
    vch_merchantid VARCHAR(50) NOT NULL,
    dec_monto DECIMAL(18, 2) NOT NULL,
    vch_moneda VARCHAR(3) NOT NULL DEFAULT 'GTQ',
    dtt_fechahora DATETIME NOT NULL DEFAULT GETDATE(),
    vch_tarjetaultimos4 VARCHAR(4) NOT NULL,
    vch_estado VARCHAR(20) NOT NULL,
    vch_mensaje VARCHAR(200) NULL
);
```

---

## 9. URLs de Prueba

### Desarrollo (Local)
```
http://localhost:3000/api/v1/pagos/charge
http://localhost:3000/demo.html
```

### Producción (Heroku)
```
https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge
https://banco-gt-api-aa7d620b23f8.herokuapp.com/demo.html
https://banco-gt-api-aa7d620b23f8.herokuapp.com/business-demo.html
```

---

## 10. Ejemplos de Uso

### cURL
```bash
curl -X POST https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000007714144690",
    "amount": 150.50,
    "expDate": "12/26",
    "cvv": "123"
  }'
```

### Postman
1. Method: `POST`
2. URL: `{{BASE_URL}}/api/v1/pagos/charge`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON): Ver ejemplo arriba

---

## 📞 Soporte

- **Email**: soporte@bancoot.com
- **Documentación**: https://banco-gt-api-aa7d620b23f8.herokuapp.com/docs
- **Dashboard**: https://banco-gt-api-aa7d620b23f8.herokuapp.com/business-demo.html
