#!/bin/bash

echo "🚨 SOLUCIÓN DEFINITIVA PARA HEROKU - Lock file sync error"
echo "============================================================"

# 1. Eliminar completamente del repositorio
echo "🗑️ Removiendo package-lock.json del repositorio Git..."
git rm --cached package-lock.json 2>/dev/null || echo "  (archivo ya removido del índice)"

# 2. Eliminar archivos locales
echo "📦 Eliminando archivos locales..."
rm -rf package-lock.json node_modules .npm

# 3. Limpiar cache completamente
echo "🧹 Limpiando cache de npm..."
npm cache clean --force

# 4. Reinstalar con versiones exactas
echo "⚙️ Reinstalando dependencias..."
npm install

# 5. Verificar estructura final
echo "📋 Verificando instalación..."
echo "✅ Node version: $(node --version)"
echo "✅ NPM version: $(npm --version)"
echo "✅ Packages instalados:"
npm list --depth=0 2>/dev/null | head -10

# 6. Probar servidor
echo ""
echo "🚀 Probando que el servidor arranque..."
timeout 5s npm start &
PID=$!
sleep 3
if kill -0 $PID 2>/dev/null; then
    kill $PID
    echo "✅ Servidor funciona correctamente"
else
    echo "❌ Problema con el servidor - revisa errores arriba"
    exit 1
fi

# 7. Preparar para commit
echo ""
echo "📤 Preparando commit para Heroku..."
git add .
echo "✅ Archivos agregados al staging"

# 8. Mostrar status
echo ""
echo "📊 Git status:"
git status --short

# 9. Instrucciones finales
echo ""
echo "🎯 COMANDOS FINALES:"
echo "git commit -m 'Remove conflicting package-lock.json for Heroku'"
echo "git push origin main"
echo ""
echo "💡 Heroku ahora usará 'npm install' en lugar de 'npm ci'"
echo "✅ Esto debería resolver el problema de sincronización"

# Opcional: hacer commit automáticamente
read -p "¿Hacer commit y push automáticamente? (y/N): " auto_deploy

if [[ $auto_deploy =~ ^[Yy]$ ]]; then
    echo "🚀 Haciendo commit y push..."
    git commit -m "Remove conflicting package-lock.json for Heroku"
    git push origin main
    echo "✅ ¡Deploy iniciado en Heroku!"
else
    echo "⏳ Ejecuta manualmente los comandos git mostrados arriba"
fi