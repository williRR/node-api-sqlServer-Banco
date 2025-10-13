#!/bin/bash

echo "🚀 Desplegando Banco GT API a Fly.io..."

# Verificar que flyctl está instalado
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl no está instalado. Instalando..."
    # Para Linux/WSL
    curl -L https://fly.io/install.sh | sh
    export PATH="$PATH:/home/$USER/.fly/bin"
fi

# Login (si es necesario)
echo "🔐 Verificando autenticación..."
flyctl auth whoami || flyctl auth login

# Configurar la aplicación
echo "⚙️ Configurando aplicación..."

# Si la app no existe, crearla
if ! flyctl apps list | grep -q "banco-gt-api"; then
    echo "📱 Creando nueva aplicación..."
    flyctl apps create banco-gt-api --org personal
fi

# Configurar variables de entorno (reemplaza con tus datos reales)
echo "🔧 Configurando variables de entorno..."
flyctl secrets set \
    DB_SERVER="tu-servidor-sql.database.windows.net" \
    DB_DATABASE="BancoGT" \
    DB_USER="tu-usuario" \
    DB_PASSWORD="tu-password" \
    NODE_ENV="production" \
    --app banco-gt-api

# Desplegar
echo "🚢 Desplegando aplicación..."
flyctl deploy --app banco-gt-api

# Verificar despliegue
echo "✅ Verificando despliegue..."
flyctl status --app banco-gt-api

# Abrir en el navegador
echo "🌐 Abriendo aplicación..."
flyctl open --app banco-gt-api

echo "🎉 ¡Despliegue completado!"
echo "📱 Tu API está disponible en: https://banco-gt-api.fly.dev"
echo "🧪 Panel de negocio: https://banco-gt-api.fly.dev/business-demo.html"