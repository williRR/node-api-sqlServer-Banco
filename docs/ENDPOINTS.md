# 📋 Banco Tikal - Documentación Completa de Endpoints

## 🌐 URLs Base

- **Local**: `http://localhost:3000/api/v1`
- **Producción**: `https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1`

---

## 1️⃣ SISTEMA

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check del servidor |
| `GET` | `/` | Información general del API |
| `GET` | `/widget/version` | Versión del widget de pagos |

---

## 2️⃣ CLIENTES

### CRUD de Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/cliente` | Crear nuevo cliente |
| `GET` | `/cliente/:id` | Obtener cliente por ID |
| `PUT` | `/cliente/:id` | Actualizar datos del cliente |

### Consultas Financieras

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/cliente/:id/saldo` | Ver saldo de la cuenta | - |
| `GET` | `/cliente/:id/movimientos` | Ver movimientos | `limite`, `pagina` |

### Operaciones

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `POST` | `/cliente/:id/transferir` | Realizar transferencia | `cuentaDestino`, `monto`, `concepto` |
| `POST` | `/cliente/:id/pagar-orden` | Pagar orden de pago | `codigoOrden`, `claveAcceso` |

---

## 3️⃣ NEGOCIOS

### CRUD de Negocios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/negocio` | Crear nuevo negocio |
| `GET` | `/negocio/:id` | Obtener negocio por ID |
| `PUT` | `/negocio/:id` | Actualizar datos del negocio |

### Consultas Financieras

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/negocio/:id/dashboard` | Dashboard con estadísticas | - |
| `GET` | `/negocio/:id/saldo` | Ver saldo de la cuenta | - |
| `GET` | `/negocio/:id/movimientos` | Ver movimientos | `limite`, `pagina` |
| `GET` | `/negocio/:id/ingresos` | Ver ingresos | `fechaInicio`, `limite` |

### Órdenes de Pago

| Método | Endpoint | Descripción | Query Params / Body |
|--------|----------|-------------|---------------------|
| `POST` | `/negocio/:id/generar-orden` | Generar orden de pago | Body: `monto`, `concepto`, `vigenciaHoras` |
| `GET` | `/negocio/:id/ordenes` | Ver órdenes generadas | `estado`, `limite` |

---

## 4️⃣ PASARELA DE PAGOS

### Merchants

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/pagos/merchants` | Obtener lista de merchants válidos |

### Procesamiento de Pagos

| Método | Endpoint | Descripción | Body |
|--------|----------|-------------|------|
| `POST` | `/pagos/charge` | Procesar pago con tarjeta | `merchantId`, `cardNumber`, `amount`, `expDate`, `cvv` |

### Consultas

| Método | Endpoint | Descripción | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/transacciones/:id` | Consultar transacción por ID | - |
| `GET` | `/transacciones/merchant/:merchantId` | Listar transacciones de un merchant | `limite` |

---

## 📊 Resumen por Categoría

### Totales

| Categoría | Cantidad |
|-----------|----------|
| **Sistema** | 3 endpoints |
| **Clientes** | 6 endpoints |
| **Negocios** | 9 endpoints |
| **Pagos** | 4 endpoints |
| **TOTAL** | **22 endpoints** |

---

## 🔐 Autenticación

Actualmente el API **no requiere autenticación** (modo desarrollo).

Para producción, se recomienda implementar:
- JWT tokens
- API Keys por merchant
- OAuth 2.0

---

## 📝 Ejemplos de Uso

### Procesar un Pago

```http
POST /api/v1/pagos/charge
Content-Type: application/json

{
  "merchantId": 2002,
  "cardNumber": "4000007714144690",
  "amount": 250.50,
  "expDate": "12/26",
  "cvv": "123"
}
```

### Generar Orden de Pago

```http
POST /api/v1/negocio/2002/generar-orden
Content-Type: application/json

{
  "monto": 250.50,
  "concepto": "Pago de factura",
  "vigenciaHoras": 48
}
```

### Pagar Orden

```http
POST /api/v1/cliente/110/pagar-orden
Content-Type: application/json

{
  "codigoOrden": "ORD0584636",
  "claveAcceso": "9964"
}
```

---

## 🎯 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| `200` | Operación exitosa |
| `201` | Recurso creado |
| `400` | Petición inválida |
| `402` | Pago rechazado |
| `404` | Recurso no encontrado |
| `500` | Error del servidor |

---

## 📌 Notas Importantes

1. ✅ Los `merchantId` deben ser IDs numéricos válidos de la tabla `Negocio`
2. ✅ Las tarjetas deben pasar el algoritmo de Luhn
3. ✅ Las fechas de vencimiento deben estar en formato `MM/YY`
4. ✅ Los CVV deben ser 3-4 dígitos
5. ✅ Los montos deben ser mayores a 0

---

## 🚀 Próximas Funcionalidades

- [ ] Webhooks para notificaciones
- [ ] Reembolsos de pagos
- [ ] Reportes en PDF
- [ ] Panel administrativo
- [ ] API de consulta de saldos en tiempo real

---

**Última actualización**: 2025-01-15
