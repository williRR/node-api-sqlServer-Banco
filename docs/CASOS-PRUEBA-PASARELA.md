# 🧪 Casos de Prueba - Pasarela de Pagos

## ✅ Casos de Éxito

### 1. Pago exitoso con tarjeta válida
```json
POST /api/v1/pagos/charge
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690",
  "amount": 150.50,
  "expDate": "12/26",
  "cvv": "123"
}
```
**Resultado esperado:** Status 200, `status: "success"`

### 2. Pago con AMEX
```json
{
  "merchantId": "2001",
  "cardNumber": "378282246310005",
  "amount": 200.00,
  "expDate": "12/26",
  "cvv": "1234"
}
```
**Resultado esperado:** Status 200, `cardType: "AMERICAN_EXPRESS"`

---

## ❌ Casos de Error

### 1. Tarjeta rechazada
```json
{
  "merchantId": "2001",
  "cardNumber": "4000000000000002",
  "amount": 100.00,
  "expDate": "12/26",
  "cvv": "123"
}
```
**Resultado esperado:** Status 402, `status: "declined"`

### 2. Tarjeta expirada
```json
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690",
  "amount": 100.00,
  "expDate": "12/20",
  "cvv": "123"
}
```
**Resultado esperado:** Status 400, `errorCode: "INVALID_EXP_DATE"`

### 3. CVV inválido
```json
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690",
  "amount": 100.00,
  "expDate": "12/26",
  "cvv": "12"
}
```
**Resultado esperado:** Status 400, `errorCode: "INVALID_CVV"`

### 4. Merchant inválido
```json
{
  "merchantId": "9999",
  "cardNumber": "4000007714144690",
  "amount": 100.00,
  "expDate": "12/26",
  "cvv": "123"
}
```
**Resultado esperado:** Status 400, `errorCode: "INVALID_MERCHANT"`

### 5. Monto inválido
```json
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690",
  "amount": -50,
  "expDate": "12/26",
  "cvv": "123"
}
```
**Resultado esperado:** Status 400, `errorCode: "INVALID_AMOUNT"`

### 6. Campos faltantes
```json
{
  "merchantId": "2001",
  "cardNumber": "4000007714144690"
}
```
**Resultado esperado:** Status 400, `errorCode: "MISSING_FIELDS"`

---

## 🎯 Flujo Completo de Prueba

1. **Obtener merchants válidos**
   ```
   GET /api/v1/pagos/merchants
   ```

2. **Procesar pago exitoso**
   ```
   POST /api/v1/pagos/charge
   (usar merchantId de paso 1)
   ```

3. **Consultar transacción**
   ```
   GET /api/v1/transacciones/{transactionId}
   ```

4. **Ver transacciones del merchant**
   ```
   GET /api/v1/transacciones/merchant/{merchantId}
   ```

---

## 📊 Tarjetas de Prueba

| Número de Tarjeta | Resultado | Tipo |
|-------------------|-----------|------|
| 4000007714144690 | ✅ Aprobada | VISA |
| 5555555555554444 | ✅ Aprobada | MASTERCARD |
| 378282246310005 | ✅ Aprobada | AMEX |
| 4000000000000002 | ❌ Rechazada | VISA |
| 4000000000000127 | ❌ CVV incorrecto | VISA |
| 4000000000000069 | ❌ Expirada | VISA |

---

## 🔍 Verificar en Base de Datos

Después de cada pago, verifica en SQL Server:

```sql
-- Ver transacciones registradas
SELECT TOP 10 * 
FROM TransaccionPasarela 
ORDER BY dtt_fechahora DESC;

-- Ver movimientos generados
SELECT TOP 10 * 
FROM Movimiento 
ORDER BY dtt_movifecha DESC;

-- Ver saldos actualizados
SELECT int_cuencodigo, dec_cuensaldo 
FROM Cuenta 
WHERE int_negocodigo = 2001; -- Merchant ID
```
