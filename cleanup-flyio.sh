#!/bin/bash

echo "🧹 LIMPIEZA COMPLETA DE FLY.IO DEL PROYECTO"
echo "==========================================="

# Eliminar archivos específicos de Fly.io
echo "1️⃣ Eliminando archivos de Fly.io..."

FILES_TO_DELETE=(
    "Dockerfile"
    "fly.toml"
    ".dockerignore"
    "deploy-fly.sh"
)

for file in "${FILES_TO_DELETE[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "🗑️ Eliminado: $file"
    else
        echo "ℹ️ No existe: $file"
    fi
done

echo ""
echo "2️⃣ Listando referencias restantes a Fly.io..."
echo ""

# Buscar referencias restantes (excluyendo scripts de limpieza)
echo "🔍 Referencias a 'fly.dev':"
grep -r "fly\.dev" . --exclude-dir=node_modules --exclude-dir=.git --exclude="cleanup-flyio.sh" --exclude="*.sh" 2>/dev/null | head -10

echo ""
echo "🔍 Referencias a 'fly.io':"
grep -r "fly\.io" . --exclude-dir=node_modules --exclude-dir=.git --exclude="cleanup-flyio.sh" --exclude="*.sh" 2>/dev/null | head -5

echo ""
echo "3️⃣ Verificando proyecto limpio..."

# Contar referencias restantes
FLY_COUNT=$(grep -r "fly\." . --exclude-dir=node_modules --exclude-dir=.git --exclude="cleanup-flyio.sh" --exclude="*.sh" 2>/dev/null | wc -l)

if [ "$FLY_COUNT" -eq 0 ]; then
    echo "✅ ¡Proyecto completamente limpio de referencias a Fly.io!"
else
    echo "⚠️ Aún hay $FLY_COUNT referencias a Fly.io. Revisa manualmente."
fi

echo ""
echo "4️⃣ Estado final del proyecto:"
echo "✅ Despliegue principal: Heroku"
echo "🌐 URL principal: https://banco-gt-api-aa7d620b23f8.herokuapp.com"
echo "📋 Deploy automático: Configurado"
echo "🗑️ Archivos Fly.io: Eliminados"

echo ""
echo "🚀 Proyecto optimizado exclusivamente para Heroku!"
echo ""
echo "📋 Para commitear los cambios:"
echo "git add ."
echo "git commit -m 'Remove all Fly.io related files and references'"
echo "git push origin master"