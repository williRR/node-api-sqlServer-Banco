// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://banco-gt-api.fly.dev',
        'https://tu-sitio.com', // Agregar dominios permitidos
        /\.fly\.dev$/, // Permitir subdominios de fly.dev
      ]
    : '*', // En desarrollo permitir todo
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));