# 🏦 Banco GT API

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/tu-usuario/banco-gt-api)

Sistema bancario completo con API REST y widget de pagos para integración en sitios web.

## 🚀 Despliegue Automático en Heroku

### 📋 Prerrequisitos
- Cuenta en [GitHub](https://github.com)
- Cuenta en [Heroku](https://heroku.com)
- Base de datos SQL Server (Azure SQL Database recomendado)

### 🔧 Configuración Paso a Paso

#### 1. **Subir código a GitHub:**
```bash
git add .
git commit -m "Proyecto Banco GT API listo para Heroku"
git push origin main
```

#### 2. **Crear app en Heroku Dashboard:**
1. Ve a [Heroku Dashboard](https://dashboard.heroku.com)
2. Clic en "New" → "Create new app"
3. Nombre: `banco-gt-api` (o el que prefieras)
4. Región: United States
5. Clic en "Create app"

#### 3. **Conectar con GitHub:**
1. En tu app de Heroku, ve a la pestaña "Deploy"
2. En "Deployment method", selecciona "GitHub"
3. Conecta tu cuenta de GitHub
4. Busca tu repositorio `banco-gt-api`
5. Clic en "Connect"

#### 4. **Configurar Variables de Entorno:**
En la pestaña "Settings" → "Config Vars", agrega:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DB_SERVER` | `bancogt.database.windows.net` |
| `DB_DATABASE` | `Banco` |
| `DB_USER` | `sqladmin` |
| `DB_PASSWORD` | `Willi04.` |

#### 5. **Habilitar Deploy Automático:**
1. En la pestaña "Deploy"
2. En "Automatic deploys", selecciona la rama `main`
3. ✅ Marca "Wait for CI to pass before deploy"
4. Clic en "Enable Automatic Deploys"

#### 6. **Deploy Manual (primera vez):**
1. En "Manual deploy", selecciona rama `main`
2. Clic en "Deploy Branch"
3. Espera a que termine el build

### 🎯 **URLs de tu aplicación:**
- **API:** `https://banco-gt-api-aa7d620b23f8.herokuapp.com`
- **Widget Demo:** `https://banco-gt-api-aa7d620b23f8.herokuapp.com/demo.html`
- **Panel Negocio:** `https://banco-gt-api-aa7d620b23f8.herokuapp.com/business-demo.html`
- **Widget JS:** `https://banco-gt-api-aa7d620b23f8.herokuapp.com/widget/banco-payment-widget.js`

## ✨ **Beneficios del Deploy Automático:**
- ✅ **Push to Deploy:** Cada `git push` actualiza automáticamente
- ✅ **Rollback fácil:** Puedes volver a versiones anteriores
- ✅ **Activity feed:** Historial completo de deploys
- ✅ **Review apps:** Crear apps temporales para PRs

## 🔄 **Flujo de trabajo típico:**
```bash
# 1. Hacer cambios en el código
# 2. Commitear y pushear
git add .
git commit -m "Mejora en el widget de pagos"
git push origin main

# 3. ¡Heroku automáticamente despliega! 🚀
```

## 🧪 **Testing en producción:**

### **Health Check:**
```bash
curl https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/widget/version
```

### **Procesar Pago:**
```bash
curl -X POST https://banco-gt-api-aa7d620b23f8.herokuapp.com/api/v1/pagos/charge \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "DEMO_STORE",
    "cardNumber": "4000007714144690",
    "amount": 100.00,
    "expDate": "12/26",
    "cvv": "123"
  }'
```

## 🛠️ **Comandos útiles de Heroku CLI:**

```bash
# Ver logs en vivo
heroku logs --tail --app tu-app-name

# Ver estado de la app
heroku ps --app tu-app-name

# Ver variables de entorno
heroku config --app tu-app-name

# Ejecutar comandos en el servidor
heroku run node --version --app tu-app-name

# Reiniciar la aplicación
heroku restart --app tu-app-name
```

## 📊 **Monitoreo:**
- **📈 Métricas:** Ve a tu app en Heroku → "Metrics"
- **📋 Logs:** Heroku Dashboard → "More" → "View logs"
- **⚡ Performance:** Heroku → "Resources" → Ver dyno usage

## 🔧 **Configuraciones adicionales:**

### **Escalamiento:**
```bash
# Escalar a 2 dynos
heroku ps:scale web=2 --app tu-app-name

# Cambiar a dyno hobby (mejor performance)
heroku ps:type hobby --app tu-app-name
```

### **Dominios personalizados:**
```bash
# Agregar dominio personalizado
heroku domains:add banco-gt-api.com --app tu-app-name
```

## 🚨 **Solución de problemas:**

### **Error R10 (Boot timeout):**
- Verifica que el `PORT` use `process.env.PORT`
- Check que `package.json` tenga el script `start` correcto

### **H12 (Request timeout):**
- Optimiza las queries de base de datos
- Agrega timeouts adecuados

### **Database connection issues:**
- Verifica las variables de entorno en Heroku
- Comprueba que la DB permita conexiones externas

## 📞 **Soporte:**
- 📧 Email: soporte@banco-gt.com
- 📚 Docs Heroku: [devcenter.heroku.com](https://devcenter.heroku.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/banco-gt-api/issues)

---

**¡Con este setup, cada cambio que hagas se despliega automáticamente! 🎉**
