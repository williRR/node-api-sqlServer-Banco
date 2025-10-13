#!/bin/bash

echo "🔍 DETECTANDO APLICACIÓN DE HEROKU"
echo "=================================="

# Ver todas las apps
echo "📱 Tus aplicaciones en Heroku:"
heroku apps

echo ""
echo "🎯 Buscando app que contenga 'banco' o 'gt':"
heroku apps | grep -i banco || heroku apps | grep -i gt

echo ""
echo "🌐 URL que está funcionando: https://banco-gt-api-aa7d620b23f8.herokuapp.com/"
echo ""

# Extraer nombre de app de la URL
APP_FROM_URL="banco-gt-api-aa7d620b23f8"
echo "📝 Nombre inferido de la URL: $APP_FROM_URL"

# Intentar verificar si existe
echo ""
echo "🧪 Probando diferentes variaciones del nombre..."

# Posibles nombres
POSSIBLE_NAMES=(
    "banco-gt-api-aa7d620b23f8"
    "banco-gt-api"
    "banco-gt"
    "node-api-sqlserver-banco"
)

for name in "${POSSIBLE_NAMES[@]}"; do
    echo -n "Probando '$name'... "
    if heroku info --app "$name" >/dev/null 2>&1; then
        echo "✅ ¡ENCONTRADO!"
        CORRECT_NAME="$name"
        break
    else
        echo "❌ No existe"
    fi
done

if [ ! -z "$CORRECT_NAME" ]; then
    echo ""
    echo "🎉 APLICACIÓN ENCONTRADA: $CORRECT_NAME"
    echo ""
    echo "📊 Información de la app:"
    heroku info --app "$CORRECT_NAME"
    echo ""
    echo "📋 Logs recientes:"
    heroku logs --num 10 --app "$CORRECT_NAME"
    echo ""
    echo "⚙️ Variables de entorno:"
    heroku config --app "$CORRECT_NAME"
    echo ""
    echo "🚀 Comandos correctos para usar:"
    echo "heroku logs --tail --app $CORRECT_NAME"
    echo "heroku restart --app $CORRECT_NAME"
    echo "heroku ps --app $CORRECT_NAME"
else
    echo ""
    echo "❌ No se pudo encontrar la aplicación automáticamente"
    echo ""
    echo "🔍 Verifica manualmente:"
    echo "1. Ve a https://dashboard.heroku.com/apps"
    echo "2. Busca tu aplicación"
    echo "3. Copia el nombre exacto"
    echo ""
    echo "O ejecuta: heroku apps"
fi