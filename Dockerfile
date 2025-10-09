FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Exponer el puerto
EXPOSE 3000

# Usuario no root por seguridad
USER node

# Comando de inicio
CMD ["npm", "start"]
