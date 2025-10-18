# 🏦 Guía de Integración - Banco Tikal Pasarela de Pagos

## 📋 Tabla de Contenido

1. [Integración Ultra Rápida (1 minuto)](#integración-ultra-rápida-1-minuto)
2. [Estructura del Código](#estructura-del-código)
3. [Integración en 3 Pasos](#integración-en-3-pasos)
4. [Personalización](#personalización)
5. [Ejemplos Avanzados](#ejemplos-avanzados)
6. [API Reference](#api-reference)
7. [Datos de Prueba](#datos-de-prueba)

---

## ⚡ Integración Ultra Rápida (1 minuto)

### Opción 1: Archivo Standalone (MÁS FÁCIL) ✅

**Descarga este archivo y úsalo directamente:**

```
https://banco-gt-api-aa7d620b23f8.herokuapp.com/checkout-widget.html
```

**Pasos:**
1. Descarga `checkout-widget.html`
2. Abre el archivo en tu editor
3. Busca la línea que dice `merchantId: 2002`
4. Cambia `2002` por tu ID de negocio
5. Cambia `amount: 250.50` por el monto a cobrar
6. **¡Listo!** Súbelo a tu servidor

**Ejemplo:**
```javascript
const CONFIG = {
    merchantId: 3005,     // ← TU ID AQUÍ
    amount: 1599.99,      // ← TU MONTO AQUÍ
    currency: 'GTQ'
};
```

### Opción 2: Widget Embebido (Para sitios existentes)

Si ya tienes un sitio, solo agrega esto en tu página de checkout:

```html
<!-- Contenedor del widget -->
<div id="banco-tikal-widget"></div>

<!-- Script del widget -->
<script src="https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js"></script>

<!-- Inicializar -->
<script>
BancoTikalWidget.init({
    merchantId: 2002,     // TU ID AQUÍ
    amount: 250.50,       // TU MONTO AQUÍ
    
    onSuccess: function(data) {
        alert('¡Pago exitoso! TXN: ' + data.transactionId);
        window.location.href = '/gracias';
    }
});
</script>
```

---

## 📁 Estructura del Código

### Archivos de la Pasarela

```
🏦 Banco Tikal - Pasarela de Pagos
│
├── 📂 Backend (Node.js + SQL Server)
│   ├── src/modules/pagos/
│   │   ├── pagos.controller.js    ← Recibe requests
│   │   ├── pagos.service.js       ← Llama a sp_autorizarPago
│   │   └── pagos.routes.js        ← Define /api/v1/pagos/*
│   │
│   └── database/
│       └── PROCEDIMIENTOS ALMACENADOS/
│           └── sp_autorizar_pago.sql  ← Lógica de validación
│
├── 📂 Frontend (Widget JavaScript)
│   ├── public/widget/
│   │   └── banco-payment-widget.js    ← Widget completo
│   │
│   └── public/
│       ├── checkout-widget.html        ← ⭐ ARCHIVO STANDALONE
│       ├── demo.html                   ← Demo interactivo
│       └── pagar-orden.html            ← Portal para órdenes
│
└── 📂 Documentación
    ├── GUIA_INTEGRACION.md             ← Este archivo
    └── README.md
```

### ⭐ Archivos Importantes para E-commerce

| Archivo | Propósito | Cuándo Usar |
|---------|-----------|-------------|
| `checkout-widget.html` | Página completa lista | Nuevo sitio o landing page |
| `banco-payment-widget.js` | Widget embebido | Ya tienes checkout propio |
| `demo.html` | Ver cómo funciona | Testing y demos |

---

## 🚀 Integración en 3 Pasos

### Paso 1: Obtener tu Merchant ID

Contacta a Banco Tikal o consulta:
```
GET https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/merchants
```

Respuesta:
```json
{
  "merchants": [
    { "id": "2002", "name": "Tu Negocio", "status": "Activo" }
  ]
}
```

Tu `merchantId` es el campo `"id"`.

### Paso 2: Descargar el Archivo

```bash
# Opción A: Descargar con curl
curl -O https://banco-gt-api-aa7d620b23f8.herokuapp.com/checkout-widget.html

# Opción B: Descargar con wget
wget https://banco-gt-api-aa7d620b23f8.herokuapp.com/checkout-widget.html

# Opción C: Abrir en navegador y "Guardar como"
```

### Paso 3: Configurar

Abre `checkout-widget.html` y busca:

```javascript
const CONFIG = {
    merchantId: 2002,        // ← CAMBIAR AQUÍ
    amount: 250.50,          // ← CAMBIAR AQUÍ
    currency: 'GTQ'
};
```

Cambia a:

```javascript
const CONFIG = {
    merchantId: 3005,        // Tu ID
    amount: 1599.99,         // Tu monto
    currency: 'GTQ'
};
```

**¡Listo!** Sube el archivo a tu servidor.

---

## 🎨 Personalización

### Cambiar Colores

En `checkout-widget.html`, busca la sección `<style>` y modifica:

```css
.checkout-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    /* Cambia a tus colores */
    background: linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%);
}
```

### Agregar Logo de tu Tienda

```html
<div class="checkout-header">
    <!-- Agregar logo -->
    <img src="/img/mi-logo.png" alt="Mi Tienda" style="max-width: 150px; margin-bottom: 10px;">
    <h1>🏦 Banco Tikal</h1>
    <p>Pasarela de Pagos Segura</p>
</div>
```

### Personalizar Resumen de Orden

```javascript
const CONFIG = {
    merchantId: 2002,
    amount: 250.50,
    
    // Agregar información detallada
    orderInfo: {
        subtotal: 215.00,
        taxes: 35.50,
        items: [
            { name: 'Producto A', price: 100.00 },
            { name: 'Producto B', price: 115.00 }
        ]
    }
};
```

---

## 💻 Ejemplos Avanzados

### Ejemplo 1: E-commerce con Carrito de Compras

```javascript
// Obtener total del carrito
const cartTotal = calculateCartTotal(); // Tu función

const CONFIG = {
    merchantId: 2002,
    amount: cartTotal,
    currency: 'GTQ'
};

BancoTikalWidget.init({
    ...CONFIG,
    onSuccess: function(paymentData) {
        // 1. Guardar transacción en tu BD
        fetch('/api/guardar-pago', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: getCurrentOrderId(),
                transactionId: paymentData.transactionId,
                amount: paymentData.amount,
                status: 'PAGADO'
            })
        }).then(() => {
            // 2. Limpiar carrito
            clearCart();
            
            // 3. Redirigir a confirmación
            window.location.href = `/orden-confirmada?id=${paymentData.transactionId}`;
        });
    }
});
```

### Ejemplo 2: Suscripciones Mensuales

```javascript
const CONFIG = {
    merchantId: 2002,
    amount: 99.00,  // Precio mensual
    currency: 'GTQ'
};

BancoTikalWidget.init({
    ...CONFIG,
    onSuccess: function(paymentData) {
        // Guardar como suscripción activa
        fetch('/api/suscripciones/activar', {
            method: 'POST',
            body: JSON.stringify({
                userId: getCurrentUserId(),
                transactionId: paymentData.transactionId,
                plan: 'premium',
                periodo: 'mensual'
            })
        }).then(() => {
            alert('¡Suscripción activada!');
            window.location.href = '/dashboard';
        });
    }
});
```

### Ejemplo 3: Donaciones con Monto Variable

```html
<input type="number" id="donation-amount" placeholder="Monto a donar" min="10">
<button onclick="procesarDonacion()">Donar</button>

<div id="banco-tikal-widget" style="display: none;"></div>

<script>
function procesarDonacion() {
    const amount = parseFloat(document.getElementById('donation-amount').value);
    
    if (amount < 10) {
        alert('El monto mínimo es Q10');
        return;
    }
    
    document.getElementById('banco-tikal-widget').style.display = 'block';
    
    BancoTikalWidget.init({
        merchantId: 2002,
        amount: amount,
        currency: 'GTQ',
        onSuccess: function(data) {
            alert(`¡Gracias por tu donación de Q${amount}!`);
            window.location.href = '/gracias';
        }
    });
}
</script>
```

---

## 📡 API Reference

### Endpoint Principal

```
POST https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge
```

### Request Body

```json
{
  "merchantId": 2002,
  "cardNumber": "4000007714144690",
  "amount": 250.50,
  "expDate": "10/30",
  "cvv": "551"
}
```

### Response Exitosa (200)

```json
{
  "status": "success",
  "data": {
    "transactionId": "TXN1697481234567890",
    "amount": 250.50,
    "cardLast4": "4690",
    "timestamp": "2025-10-16T12:30:00Z"
  }
}
```

---

## 🧪 Datos de Prueba

### Tarjetas de Prueba

| Número | CVV | Fecha | Resultado |
|--------|-----|-------|-----------|
| `4000007714144690` | `551` | `10/30` | ✅ Aprobado |
| `5555555555554444` | `123` | `12/26` | ✅ Aprobado |
| `4000000000000002` | `123` | `12/26` | ❌ Rechazado |

### Merchants de Prueba

```
merchantId: 2002 - TecnoAvanzada
merchantId: 2001 - Café La Esquina
```

---

## 📞 Soporte

- **Email:** soporte@bancotikal.com
- **Demo:** https://banco-gt-api-aa7d620b23f8.herokuapp.com/demo.html
- **Widget:** https://banco-gt-api-aa7d620b23f8.herokuapp.com/checkout-widget.html

---

## ✅ Checklist de Integración

- [ ] Obtuve mi `merchantId`
- [ ] Descargué `checkout-widget.html`
- [ ] Cambié `merchantId` en el archivo
- [ ] Configuré el `amount` correcto
- [ ] Probé con tarjetas de prueba
- [ ] Personalicé colores/logo (opcional)
- [ ] Implementé `onSuccess` callback
- [ ] Subí a mi servidor
- [ ] ¡Listo para producción!

---

**¿Listo para empezar?** Descarga `checkout-widget.html` y comienza a aceptar pagos en minutos. 🚀
