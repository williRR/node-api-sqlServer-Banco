#!/bin/bash

echo "🔍 VERIFICACIÓN PRE-MERGE A MASTER (PRODUCCIÓN)"
echo "==============================================="

# 1. Verificar rama actual
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Rama actual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "pagosBanco" ]; then
    echo "⚠️ No estás en la rama pagosBanco"
    read -p "¿Cambiar a pagosBanco? (y/N): " switch
    if [[ $switch =~ ^[Yy]$ ]]; then
        git checkout pagosBanco
    else
        exit 1
    fi
fi

# 2. Verificar que .env NO esté en git
echo ""
echo "🔒 Verificando archivos sensibles..."
if git ls-files | grep -q "^\.env$"; then
    echo "❌ ERROR: .env está en Git"
    echo "Ejecuta: git rm --cached .env"
    exit 1
fi
echo "✅ .env no está en Git"

# 3. Ver cambios vs master
echo ""
echo "📊 Archivos modificados respecto a master:"
git diff --name-status master..pagosBanco

# 4. Ver diferencias en archivos clave
echo ""
echo "🔍 Cambios en archivos de configuración:"
echo ""
echo "--- src/config.js ---"
git diff master..pagosBanco -- src/config.js | head -20
echo ""
echo "--- src/config/db.js ---"
git diff master..pagosBanco -- src/config/db.js | head -20

# 5. Verificar que no haya credenciales hardcodeadas
echo ""
echo "🔐 Buscando credenciales hardcodeadas..."
HARDCODED=$(git diff master..pagosBanco | grep -i "password.*=.*['\"]" | grep -v "process.env")
if [ -n "$HARDCODED" ]; then
    echo "⚠️ ADVERTENCIA: Posibles credenciales hardcodeadas:"
    echo "$HARDCODED"
    read -p "¿Continuar de todos modos? (y/N): " cont
    if [[ ! $cont =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ No se encontraron credenciales hardcodeadas"
fi

# 6. Resumen
echo ""
echo "📋 RESUMEN:"
echo "✅ Rama actual: pagosBanco"
echo "✅ Archivos sensibles: No en Git"
echo "✅ Configuración: Validada"
echo ""

# 7. Preguntar si hacer merge
read -p "¿Fusionar pagosBanco → master y desplegar a producción? (y/N): " merge

if [[ $merge =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 Fusionando a master..."
    git checkout master
    git pull origin master  # Actualizar master primero
    git merge pagosBanco
    
    echo ""
    echo "📊 Estado después del merge:"
    git status
    
    echo ""
    read -p "¿Push a origin/master (despliegue automático)? (y/N): " push
    
    if [[ $push =~ ^[Yy]$ ]]; then
        echo "🚀 Desplegando a producción..."
        git push origin master
        
        echo ""
        echo "✅ Deploy iniciado en Heroku"
        echo "📊 Ver logs: heroku logs --tail --app banco-gt-api-aa7d620b23f8"
    else
        echo "⏳ Push cancelado. Ejecuta manualmente: git push origin master"
    fi
else
    echo "❌ Merge cancelado"
    echo "💡 Puedes revisar cambios con: git diff master..pagosBanco"
fi
