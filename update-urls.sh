#!/bin/bash

echo "🔗 Actualizando todas las referencias a la nueva URL de Heroku..."
echo "Nueva URL: https://banco-gt-api-aa7d620b23f8.herokuapp.com"
echo ""

# Verificar cambios realizados
echo "📋 Archivos actualizados:"
echo "✅ public/widget/banco-payment-widget.js - URL por defecto del widget"
echo "✅ src/server.js - CORS configuration"
echo "✅ postman-collection-heroku.json - Colección completa"
echo "✅ api-test.http - Endpoints para pruebas"
echo "✅ README.md - Documentación"
echo "✅ heroku.json - Configuración de deploy"
echo ""

# Mostrar URLs importantes
echo "🎯 URLs importantes de tu aplicación:"
echo "🏠 API Base: https://banco-gt-api-aa7d620b23f8.herokuapp.com/"
echo "💳 Widget Demo: https://banco-gt-api-aa7d620b23f8.herokuapp.com/demo.html"
echo "🏢 Panel Negocio: https://banco-gt-api-aa7d620b23f8.herokuapp.com/business-demo.html"
echo "📊 Widget JS: https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js"
echo "🔍 Health Check: https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/widget/version"
echo ""

# Test rápido
echo "🧪 Probando que la API responda..."
if curl -s "https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/widget/version" > /dev/null; then
    echo "✅ API responde correctamente"
else
    echo "⚠️ API no responde - puede estar iniciando"
fi
echo ""

# Preparar para commit
echo "📤 Preparando commit..."
git add .

echo "📊 Git status:"
git status --short

echo ""
echo "🚀 Comandos para deploy:"
echo "git commit -m 'Update all URLs to new Heroku deployment'"
echo "git push origin main"
echo ""

# Opción de commit automático
read -p "¿Hacer commit y push automáticamente? (y/N): " auto_commit

if [[ $auto_commit =~ ^[Yy]$ ]]; then
    echo "📤 Haciendo commit y push..."
    git commit -m "Update all URLs to new Heroku deployment - banco-gt-api-aa7d620b23f8.herokuapp.com"
    git push origin main
    echo "✅ ¡Cambios subidos! Deploy automático en progreso..."
else
    echo "⏳ Ejecuta manualmente los comandos git mostrados arriba"
fi

echo ""
echo "🎉 ¡Todas las referencias actualizadas correctamente!"