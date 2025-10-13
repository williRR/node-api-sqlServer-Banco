// Test básico de servidor para debug
import express from 'express';
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware básico
app.use(express.json());

// Health check simple
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Banco GT API funcionando',
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV,
    node_version: process.version
  });
});

// Test de variables de entorno
app.get('/debug', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DB_SERVER: process.env.DB_SERVER ? 'Configurado' : 'No configurado',
    DB_DATABASE: process.env.DB_DATABASE ? 'Configurado' : 'No configurado',
    DB_USER: process.env.DB_USER ? 'Configurado' : 'No configurado',
    DB_PASSWORD: process.env.DB_PASSWORD ? 'Configurado' : 'No configurado'
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor test corriendo en puerto ${PORT}`);
  console.log(`📱 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 Variables de entorno cargadas: ${Object.keys(process.env).length}`);
});

// Manejo de errores
process.on('uncaughtException', (err) => {
  console.error('💥 Error no capturado:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promesa rechazada no manejada:', reason);
  process.exit(1);
});