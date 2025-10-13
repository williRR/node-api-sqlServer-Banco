#!/bin/bash

echo "🧹 Limpiando proyecto para deploy en Heroku..."

# 1. Eliminar archivos problemáticos
echo "📦 Eliminando package-lock.json y node_modules..."
rm -rf package-lock.json node_modules

# 2. Limpiar cache de npm
echo "🗑️ Limpiando cache de npm..."
npm cache clean --force

# 3. Instalar dependencias frescas
echo "📥 Instalando dependencias..."
npm install

# 4. Verificar la instalación
echo "✅ Verificando instalación..."
npm list --depth=0

# 5. Probar que el servidor arranque
echo "🚀 Probando servidor (Ctrl+C para detener)..."
echo "Si el servidor arranca correctamente, usa Ctrl+C y haz git push"

# Mostrar comandos para el deploy
echo ""
echo "📋 Comandos para deploy:"
echo "git add ."
echo "git commit -m 'Fix package dependencies for Heroku'"
echo "git push origin main"
echo ""

# Opcional: arrancar servidor para probar
read -p "¿Quieres probar el servidor ahora? (y/N): " test_server

if [[ $test_server =~ ^[Yy]$ ]]; then
    echo "🏃‍♂️ Iniciando servidor de prueba..."
    npm start
else
    echo "✅ Listo para deploy. Ejecuta los comandos git mostrados arriba."
fi