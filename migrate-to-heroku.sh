#!/bin/bash

echo "🔄 MIGRACIÓN COMPLETA DE FLY.DEV A HEROKU"
echo "========================================"

OLD_URLS=(
    "https://api-banco-sqlserver.fly.dev"
    "https://banco-gt-api.fly.dev"
    "api-banco-sqlserver.fly.dev"
    "banco-gt-api.fly.dev"
)

NEW_URL="https://banco-gt-api-aa7d620b23f8.herokuapp.com"

echo "🎯 Nueva URL principal: $NEW_URL"
echo ""

# Función para reemplazar en un archivo
replace_in_file() {
    local file=$1
    local old=$2
    local new=$3
    
    if [ -f "$file" ]; then
        if grep -q "$old" "$file"; then
            sed -i "s|$old|$new|g" "$file"
            echo "✅ Actualizado: $file"
        fi
    fi
}

echo "📝 Actualizando archivos..."
echo ""

# Lista de archivos a actualizar
FILES=(
    "public/demo.html"
    "public/business-demo.html"
    "public/widget/banco-payment-widget.js"
    "README.md"
    "api-test.http"
    "postman-collection-heroku.json"
    "src/server.js"
)

# Reemplazar en cada archivo
for file in "${FILES[@]}"; do
    for old_url in "${OLD_URLS[@]}"; do
        replace_in_file "$file" "$old_url" "$NEW_URL"
    done
done

echo ""
echo "🔍 Verificando cambios realizados..."

# Verificar que no queden referencias a fly.dev
remaining=$(grep -r "fly.dev" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.sh" 2>/dev/null | wc -l)

if [ "$remaining" -eq 0 ]; then
    echo "✅ ¡Perfecto! No quedan referencias a fly.dev"
else
    echo "⚠️  Aún quedan $remaining referencias a fly.dev:"
    grep -r "fly.dev" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.sh" 2>/dev/null
fi

echo ""
echo "🧪 Probando que la nueva URL funcione..."
if curl -s "$NEW_URL/api/v1/widget/version" > /dev/null; then
    echo "✅ La nueva URL responde correctamente"
else
    echo "⚠️  La nueva URL no responde - verifica que Heroku esté funcionando"
fi

echo ""
echo "📊 Resumen de cambios:"
echo "• Demo page: public/demo.html"
echo "• Business panel: public/business-demo.html"
echo "• Widget JS: public/widget/banco-payment-widget.js"
echo "• API tests: api-test.http"
echo "• Documentation: README.md"

echo ""
echo "🚀 Siguiente paso - hacer commit:"
echo "git add ."
echo "git commit -m 'Migrate all URLs from Fly.dev to Heroku deployment'"
echo "git push origin master"

echo ""
echo "🎯 URLs finales para usar:"
echo "• Widget Demo: $NEW_URL/demo.html"
echo "• Business Panel: $NEW_URL/business-demo.html"
echo "• Widget JS: $NEW_URL/widget/banco-payment-widget.js"
echo "• API Health: $NEW_URL/api/v1/widget/version"