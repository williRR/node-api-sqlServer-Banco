#!/bin/bash

echo "🏪 PROBANDO ENDPOINT DE PAGOS CON MERCHANTS VÁLIDOS"
echo "=================================================="

BASE_URL="https://banco-gt-api-aa7d620b23f8.herokuapp.com"

echo "1️⃣ Obteniendo lista de merchants válidos..."
echo ""
 
# Obtener merchants válidos
MERCHANTS_RESPONSE=$(curl -s "$BASE_URL/api/v1/pagos/merchants")
echo "📋 Merchants disponibles:"
echo "$MERCHANTS_RESPONSE" | jq '.'

echo ""
echo "2️⃣ Probando pago con merchant válido (2001)..."
echo ""

# Probar pago con merchant válido
PAYMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000007714144690",
    "amount": 150.75,
    "expDate": "12/26",
    "cvv": "123",
    "description": "Pago de prueba con merchant válido"
  }')

echo "💳 Resultado del pago:"
echo "$PAYMENT_RESPONSE" | jq '.'

echo ""
echo "3️⃣ Probando pago con merchant inválido..."
echo ""

# Probar pago con merchant inválido
INVALID_PAYMENT=$(curl -s -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "9999",
    "cardNumber": "4000007714144690",
    "amount": 100.00,
    "expDate": "12/26",
    "cvv": "123"
  }')

echo "❌ Resultado esperado (error):"
echo "$INVALID_PAYMENT" | jq '.'

echo ""
echo "✅ Pruebas completadas!"
echo ""
echo "💡 Para usar en tu aplicación:"
echo "1. Consulta GET $BASE_URL/api/v1/pagos/merchants"
echo "2. Usa el 'id' de la respuesta como merchantId"
echo "3. Procesa pagos con POST $BASE_URL/api/v1/pagos/charge"