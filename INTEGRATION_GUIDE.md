# 🏦 Banco GT Payment Gateway - Guía de Integración

## 🚀 Integración Rápida (Plug & Play)

### 1. **Incluir el Widget**

Agrega este script a tu página web antes del cierre de `</body>`:

```html
<script src="https://api-banco-sqlserver.fly.dev/widget/banco-payment-widget.js"></script>
```

### 2. **Inicializar el Widget**

```javascript
const payment = BancoPayment({
    merchantId: 'TU_MERCHANT_ID',
    onSuccess: (result) => {
        // Pago exitoso
        console.log('Transacción exitosa:', result);
        // result.transactionId - ID de la transacción
        // result.message - Mensaje del banco
        
        // Redirigir a página de éxito o mostrar confirmación
        window.location.href = '/success?tx=' + result.transactionId;
    },
    onError: (error) => {
        // Error en el pago
        console.error('Error de pago:', error);
        alert('Error: ' + error.message);
    },
    onCancel: () => {
        // Usuario canceló el pago
        console.log('Pago cancelado');
    }
});
```

### 3. **Abrir el Widget de Pago**

```javascript
// En tu botón de "Pagar"
function procesarPago() {
    const monto = 99.99; // Tu monto dinámico
    payment.open(monto);
}
```

## 🎨 **Ejemplo Completo**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mi Tienda</title>
</head>
<body>
    <div class="producto">
        <h3>Producto Ejemplo</h3>
        <p>Precio: $99.99</p>
        <button onclick="comprar()">Comprar Ahora</button>
    </div>

    <!-- Widget de Banco GT -->
    <script src="https://api-banco-sqlserver.fly.dev/widget/banco-payment-widget.js"></script>
    
    <script>
        // Configurar el widget
        const payment = BancoPayment({
            merchantId: 'MI_TIENDA_123',
            onSuccess: (result) => {
                alert('¡Pago exitoso! ID: ' + result.transactionId);
                // Aquí puedes hacer una llamada a tu backend para confirmar
            },
            onError: (error) => {
                alert('Error: ' + error.message);
            }
        });

        // Función para abrir el pago
        function comprar() {
            payment.open(99.99);
        }
    </script>
</body>
</html>
```

## 🔧 **Configuración Avanzada**

### Opciones del Widget

```javascript
const payment = BancoPayment({
    merchantId: 'TU_MERCHANT_ID',      // REQUERIDO: Tu ID de comercio
    apiUrl: 'https://api-banco-sqlserver.fly.dev', // URL de la API (opcional)
    theme: 'default',                   // Tema visual (opcional)
    language: 'es',                     // Idioma (opcional: 'es', 'en')
    
    // Callbacks
    onSuccess: (result) => { /* ... */ },
    onError: (error) => { /* ... */ },
    onCancel: () => { /* ... */ }
});
```

### Respuesta de Éxito

```javascript
{
    "status": "success",
    "transactionId": 100001,
    "message": "Transacción exitosa"
}
```

### Respuesta de Error

```javascript
{
    "status": "failed",
    "transactionId": 100002,
    "message": "Fondos insuficientes",
    "errorCode": "INSUFFICIENT_FUNDS"
}
```

## 🧪 **Datos de Prueba**

Para probar la integración, usa estos datos:

```
Número de Tarjeta: 4000007714144690
Fecha de Vencimiento: 10/30
CVV: 551
Merchant ID: STORE_001_FASHION
```

## 🔐 **Seguridad**

- ✅ Todas las transacciones usan encriptación SSL
- ✅ Los datos de tarjeta nunca se almacenan en tu servidor
- ✅ Cumplimiento con estándares PCI DSS
- ✅ Validación completa de CVV y fecha de vencimiento

## 📱 **Compatibilidad**

- ✅ Responsive (móvil y desktop)
- ✅ Compatible con todos los navegadores modernos
- ✅ Progressive Web Apps (PWA)
- ✅ Single Page Applications (SPA)

## 🎯 **Características**

- 🚀 **Integración en 5 minutos**
- 🎨 **Interfaz moderna y responsiva**
- 🔒 **Máxima seguridad**
- 📱 **Compatible con móviles**
- 🌍 **Multi-idioma**
- ⚡ **Carga rápida**
- 💳 **Validación en tiempo real**


## 🔄 **API REST (Avanzado)**

Si prefieres integración backend:

```bash
curl -X POST https://api-banco-sqlserver.fly.dev/api/v1/pagos/charge \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "TU_MERCHANT_ID",
    "cardNumber": "4000007714144690",
    "amount": 99.99,
    "expDate": "10/30",
    "cvv": "551"
  }'
```

---

**Banco GT** - Haciendo los pagos simples y seguros 🏦✨
