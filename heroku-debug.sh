#!/bin/bash

echo "🚨 DIAGNÓSTICO HEROKU - Banco GT API"
echo "====================================="

APP_NAME="banco-gt-api-aa7d620b23f8"
echo "📱 App: $APP_NAME"
echo ""

# 1. Verificar status de la app
echo "📊 Estado de la aplicación:"
heroku ps --app $APP_NAME
echo ""

# 2. Ver logs recientes
echo "📋 Logs recientes (últimos 20 líneas):"
heroku logs --tail --num 20 --app $APP_NAME
echo ""

# 3. Ver configuración
echo "⚙️ Variables de entorno:"
heroku config --app $APP_NAME
echo ""

# 4. Ver información de la app
echo "ℹ️ Información de la app:"
heroku info --app $APP_NAME
echo ""

# 5. Verificar buildpacks
echo "🔧 Buildpacks:"
heroku buildpacks --app $APP_NAME
echo ""

# Comandos útiles
echo "🛠️ COMANDOS ÚTILES PARA DEBUGGING:"
echo "heroku logs --tail --app $APP_NAME"
echo "heroku restart --app $APP_NAME"
echo "heroku ps:scale web=1 --app $APP_NAME"
echo "heroku run node --version --app $APP_NAME"
echo "heroku run npm list --app $APP_NAME"