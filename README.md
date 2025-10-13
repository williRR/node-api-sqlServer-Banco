# 🏦 Banco GT API

Sistema bancario completo con API REST y widget de pagos para integración en sitios web.

## 🚀 Despliegue

### Opción 1: Heroku (Recomendado para principiantes)

#### 📋 Prerrequisitos
- Cuenta en [Heroku](https://heroku.com)
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) instalado
- Base de datos SQL Server (Azure SQL Database, AWS RDS, etc.)

#### 🔧 Despliegue automático
```bash
# Dar permisos de ejecución
chmod +x deploy-heroku.sh

# Ejecutar script de despliegue
./deploy-heroku.sh
```

#### 🔧 Despliegue manual
```bash
# 1. Instalar Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Crear app
heroku create banco-gt-api

# 4. Configurar variables de entorno
heroku config:set \
  NODE_ENV=production \
  DB_SERVER="tu-servidor.database.windows.net" \
  DB_DATABASE="BancoGT" \
  DB_USER="tu-usuario" \
  DB_PASSWORD="tu-password"

# 5. Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Opción 2: Fly.io

#### 🔧 Despliegue
```bash
# 1. Instalar flyctl
curl -L https://fly.io/install.sh | sh

# 2. Login
flyctl auth login

# 3. Crear app
flyctl apps create banco-gt-api

# 4. Configurar secrets
flyctl secrets set \
  DB_SERVER="tu-servidor.database.windows.net" \
  DB_DATABASE="BancoGT" \
  DB_USER="tu-usuario" \
  DB_PASSWORD="tu-password" \
  NODE_ENV="production"

# 5. Deploy
flyctl deploy
```

## 🎯 URLs Post-Despliegue

### Heroku
- **API:** `https://banco-gt-api.herokuapp.com`
- **Widget Demo:** `https://banco-gt-api.herokuapp.com/demo.html`
- **Panel Negocio:** `https://banco-gt-api.herokuapp.com/business-demo.html`
- **Widget JS:** `https://banco-gt-api.herokuapp.com/widget/banco-payment-widget.js`

### Fly.io
- **API:** `https://banco-gt-api.fly.dev`
- **Widget Demo:** `https://banco-gt-api.fly.dev/demo.html`
- **Panel Negocio:** `https://banco-gt-api.fly.dev/business-demo.html`
- **Widget JS:** `https://banco-gt-api.fly.dev/widget/banco-payment-widget.js`

## 🧪 Integración del Widget

### Widget de Pago (Clientes)
```html
<script src="https://banco-gt-api.herokuapp.com/widget/banco-payment-widget.js"></script>
<script>
const paymentWidget = new BancoPaymentWidget({
    merchantId: 'DEMO_STORE',
    onSuccess: (result) => console.log('Pago exitoso:', result),
    onError: (error) => console.error('Error:', error)
});

// Abrir widget con monto
paymentWidget.open(100.00);
</script>
```

### Panel de Negocio
```html
<script src="https://banco-gt-api.herokuapp.com/widget/banco-payment-widget.js"></script>
<script>
const businessPanel = new BancoPaymentWidget({
    merchantId: '2001',
    mode: 'business',
    onSuccess: (data) => console.log('Orden generada:', data),
    onError: (error) => console.error('Error:', error)
});

businessPanel.open();
</script>
```

## 📊 Funcionalidades

### 👥 Clientes
- ✅ Consultar saldo
- ✅ Ver movimientos
- ✅ Realizar transferencias
- ✅ Pagar órdenes de pago

### 🏢 Negocios
- ✅ Dashboard con estadísticas
- ✅ Generar órdenes de pago
- ✅ Ver órdenes generadas
- ✅ Ver ingresos

### 💳 Widget
- ✅ Procesamiento de pagos
- ✅ Panel de gestión para negocios
- ✅ Actualizaciones automáticas
- ✅ Múltiples temas
- ✅ Responsive design

## 🗃️ Base de Datos

### Requisitos
- SQL Server 2016 o superior
- Azure SQL Database (recomendado)
- AWS RDS SQL Server
- Google Cloud SQL Server

### Scripts SQL
Ejecutar en orden:
1. `create_orden_pago_table.sql`
2. `sp_generarOrdenPago.sql`
3. `sp_realizarTransferencia.sql`
4. `sp_pagarOrdenPago.sql`

## 🔧 Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | `production` |
| `PORT` | Puerto del servidor | `3000` |
| `DB_SERVER` | Servidor SQL | `tu-servidor.database.windows.net` |
| `DB_DATABASE` | Nombre de BD | `BancoGT` |
| `DB_USER` | Usuario de BD | `tu-usuario` |
| `DB_PASSWORD` | Contraseña de BD | `tu-password` |

## 📞 Soporte

- 📧 Email: soporte@banco-gt.com
- 📚 Docs: [Documentación completa](https://docs.banco-gt.com)
- 🐛 Issues: [GitHub Issues](https://github.com/tu-usuario/banco-gt-api/issues)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

# Clonar el repositorio

```bash
git clone https://github.com/williRR/node-api-sqlServer-Banco 

cd tu-api

```
# instalar dependencias (Node.js)

```bash
npm install


```

# Configurar variables de entorno

Crear un archivo .env en la raíz del proyecto.

Copiar las variables de ejemplo desde .env 

```bash
PORT =  3000
DB_USER = "sa"
DB_PASSWORD = "password"
DB_SERVER = "localhost"
DB_DATABASE = "Banco" 
```

# Ejecutar la API en modo desarrollo
```bash

npm run dev

```

# Probar los endpoints fácilmente

Para probar los endpoints sin necesidad de Postman:

Instalar la extensión REST Client en Visual Studio Code

Abrir el archivo api-test.http incluido en este repositorio.

Dar clic en "Send Request" sobre el endpoint que quieras probar (ejemplo: clientes, negocios, cuentas, tarjetas).
