#!/bin/bash

echo "🔍 BUSCANDO REFERENCIAS A FLY.DEV EN EL PROYECTO"
echo "==============================================="

OLD_URL="api-banco-sqlserver.fly.dev"
NEW_URL="banco-gt-api-aa7d620b23f8.herokuapp.com"

echo "🔎 Buscando '$OLD_URL' en todos los archivos..."
echo ""

# Buscar en todos los archivos
grep -r "$OLD_URL" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | while read -r line; do
    echo "📁 $line"
done

echo ""
echo "🔎 También buscando otras referencias a fly.dev..."
grep -r "fly.dev" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | while read -r line; do
    echo "📁 $line"
done

echo ""
echo "🔄 REEMPLAZOS A REALIZAR:"
echo "❌ Cambiar: https://$OLD_URL"
echo "✅ Por:     https://$NEW_URL"
echo ""

echo "📋 ARCHIVOS QUE PROBABLEMENTE NECESITAN ACTUALIZACIÓN:"
echo "• public/demo.html"
echo "• public/business-demo.html" 
echo "• public/widget/banco-payment-widget.js"
echo "• README.md"
echo "• Cualquier archivo de configuración"

echo ""
echo "🚀 Después de los cambios, ejecutar:"
echo "git add ."
echo "git commit -m 'Update all URLs from Fly.dev to Heroku'"
echo "git push origin master"