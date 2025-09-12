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
