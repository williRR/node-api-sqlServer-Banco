#!/bin/bash

echo "🚀 Desplegando Banco GT API a Heroku..."

# Verificar que Heroku CLI está instalado
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI no está instalado. Instalando..."
    # Para Ubuntu/Debian
    curl https://cli-assets.heroku.com/install.sh | sh
    
    # Para macOS con Homebrew
    # brew install heroku/brew/heroku
    
    # Para Windows, descargar desde: https://devcenter.heroku.com/articles/heroku-cli
fi

# Login en Heroku (si es necesario)
echo "🔐 Verificando autenticación con Heroku..."
heroku auth:whoami || heroku auth:login

# Crear la aplicación si no existe
APP_NAME="banco-gt-api"

if heroku apps:info $APP_NAME > /dev/null 2>&1; then
    echo "✅ La aplicación $APP_NAME ya existe"
else
    echo "📱 Creando aplicación $APP_NAME..."
    heroku apps:create $APP_NAME --region us
fi

# Configurar variables de entorno
echo "🔧 Configurando variables de entorno..."
echo "⚠️  Necesitas proporcionar los datos de tu base de datos SQL Server:"

read -p "🔹 Servidor SQL (ej: tu-servidor.database.windows.net): " DB_SERVER
read -p "🔹 Base de datos (por defecto: BancoGT): " DB_DATABASE
DB_DATABASE=${DB_DATABASE:-BancoGT}
read -p "🔹 Usuario de BD: " DB_USER
read -s -p "🔹 Contraseña de BD: " DB_PASSWORD
echo ""

# Establecer variables de entorno
heroku config:set \
    NODE_ENV=production \
    DB_SERVER="$DB_SERVER" \
    DB_DATABASE="$DB_DATABASE" \
    DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" \
    --app $APP_NAME

# Verificar que estemos en un repositorio git
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio Git..."
    git init
    git add .
    git commit -m "Initial commit for Banco GT API"
fi

# Agregar Heroku remote si no existe
if ! git remote get-url heroku > /dev/null 2>&1; then
    echo "🔗 Agregando remote de Heroku..."
    heroku git:remote -a $APP_NAME
fi

# Deploy
echo "🚢 Desplegando aplicación..."
git add .
git commit -m "Deploy to Heroku - $(date)"
git push heroku main || git push heroku master

# Verificar despliegue
echo "✅ Verificando despliegue..."
heroku ps:scale web=1 --app $APP_NAME
heroku logs --tail --app $APP_NAME &
LOGS_PID=$!

# Esperar un poco y luego verificar
sleep 10
kill $LOGS_PID 2>/dev/null

# Abrir la aplicación
echo "🌐 Abriendo aplicación..."
heroku open --app $APP_NAME

echo "🎉 ¡Despliegue completado!"
echo "📱 Tu API está disponible en: https://$APP_NAME.herokuapp.com"
echo "🧪 Panel de negocio: https://$APP_NAME.herokuapp.com/business-demo.html"
echo "💳 Widget demo: https://$APP_NAME.herokuapp.com/demo.html"

# Mostrar información útil
echo ""
echo "📋 Comandos útiles:"
echo "🔍 Ver logs: heroku logs --tail --app $APP_NAME"
echo "📊 Ver estado: heroku ps --app $APP_NAME"
echo "⚙️  Ver config: heroku config --app $APP_NAME"
echo "🔄 Reiniciar: heroku restart --app $APP_NAME"