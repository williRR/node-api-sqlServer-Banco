#!/bin/bash

echo "🔒 DEPLOYMENT SEGURO A PRODUCCIÓN"
echo "=================================="

# 1. Verificar que .env NO esté en git
if git ls-files | grep -q "\.env$"; then
    echo "❌ ERROR: Archivo .env está en Git"
    echo "Ejecuta: git rm --cached .env"
    exit 1
fi
echo "✅ Archivo .env no está en Git"

# 2. Verificar variables de Heroku
echo ""
echo "📋 Verificando variables de Heroku..."
HEROKU_VARS=$(heroku config --app banco-gt-api-aa7d620b23f8)

REQUIRED_VARS=("DB_USER" "DB_PASSWORD" "DB_SERVER" "DB_DATABASE" "NODE_ENV")
for var in "${REQUIRED_VARS[@]}"; do
    if echo "$HEROKU_VARS" | grep -q "$var"; then
        echo "✅ $var configurado"
    else
        echo "❌ $var NO configurado en Heroku"
        exit 1
    fi
done

# 3. Verificar que NODE_ENV sea production
if echo "$HEROKU_VARS" | grep -q "NODE_ENV.*production"; then
    echo "✅ NODE_ENV=production"
else
    echo "⚠️ NODE_ENV no es production"
    read -p "¿Configurar NODE_ENV=production? (y/N): " set_prod
    if [[ $set_prod =~ ^[Yy]$ ]]; then
        heroku config:set NODE_ENV=production --app banco-gt-api-aa7d620b23f8
    fi
fi

# 4. Mostrar archivos a subir
echo ""
echo "📦 Archivos que se subirán:"
git status --short

# 5. Confirmación
echo ""
read -p "¿Continuar con deployment a PRODUCCIÓN? (y/N): " confirm

if [[ $confirm =~ ^[Yy]$ ]]; then
    echo "🚀 Desplegando a producción..."
    git push heroku master
    
    echo ""
    echo "✅ Deployment completado"
    echo "📊 Ver logs: heroku logs --tail --app banco-gt-api-aa7d620b23f8"
else
    echo "❌ Deployment cancelado"
fi
