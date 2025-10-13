// Configuración de CORS para producción
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://banco-gt-api.fly.dev',
        'https://banco-gt-api-aa7d620b23f8.herokuapp.com',
        'https://banco-gt-api.herokuapp.com',
        /\.herokuapp\.com$/, // Permitir subdominios de Heroku
        /\.fly\.dev$/, // Permitir subdominios de fly.dev
      ]
    : '*', // En desarrollo permitir todo
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));