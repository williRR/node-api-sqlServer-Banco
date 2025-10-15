#!/bin/bash

echo "🧪 PRUEBA COMPLETA DE PASARELA DE PAGOS"
echo "======================================="
echo ""

BASE_URL="http://localhost:3000"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para verificar respuesta
check_response() {
    local status=$1
    local expected=$2
    local test_name=$3
    
    if [ "$status" -eq "$expected" ]; then
        echo -e "${GREEN}✅ $test_name - PASÓ${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name - FALLÓ (esperado: $expected, obtenido: $status)${NC}"
        return 1
    fi
}

# Test 1: Health Check
echo "1️⃣ Test: Health Check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")
check_response $STATUS 200 "Health Check"
echo ""

# Test 2: Obtener Merchants
echo "2️⃣ Test: Obtener lista de merchants"
RESPONSE=$(curl -s "$BASE_URL/api/v1/pagos/merchants")
echo "$RESPONSE" | jq -C '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Pago Exitoso
echo "3️⃣ Test: Pago exitoso con tarjeta válida"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000007714144690",
    "amount": 150.00,
    "expDate": "12/26",
    "cvv": "123"
  }')
check_response $STATUS 200 "Pago exitoso"
echo ""

# Test 4: Tarjeta Rechazada
echo "4️⃣ Test: Tarjeta rechazada"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000000000000002",
    "amount": 100.00,
    "expDate": "12/26",
    "cvv": "123"
  }')
check_response $STATUS 402 "Tarjeta rechazada"
echo ""

# Test 5: Fecha Expirada
echo "5️⃣ Test: Tarjeta expirada"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000007714144690",
    "amount": 100.00,
    "expDate": "12/20",
    "cvv": "123"
  }')
check_response $STATUS 400 "Tarjeta expirada"
echo ""

# Test 6: Merchant Inválido
echo "6️⃣ Test: Merchant inválido"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "9999",
    "cardNumber": "4000007714144690",
    "amount": 100.00,
    "expDate": "12/26",
    "cvv": "123"
  }')
check_response $STATUS 400 "Merchant inválido"
echo ""

# Test 7: Campos Faltantes
echo "7️⃣ Test: Campos requeridos faltantes"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/v1/pagos/charge" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "2001",
    "cardNumber": "4000007714144690"
  }')
check_response $STATUS 400 "Campos faltantes"
echo ""

echo "======================================="
echo -e "${YELLOW}🎉 Pruebas completadas${NC}"
echo ""
echo "💡 Para ver detalles de las transacciones:"
echo "   SQL: SELECT * FROM TransaccionPasarela ORDER BY dtt_fechahora DESC;"
