// Importar rutas
import clienteRoutes from '../modules/clientes/clientes.routes.js';
import negocioRoutes from '../modules/negocios/negocio.routes.js';
// ...existing imports...

// Usar rutas
router.use('/cliente', clienteRoutes);
router.use('/negocio', negocioRoutes);

// 🆕 Endpoint para información del widget
router.get('/widget/version', (req, res) => {
  res.json({
    version: '1.1.0',
    releaseDate: '2024-10-13',
    features: [
      'Panel de negocio integrado',
      'Generación de órdenes de pago',
      'Dashboard con estadísticas en tiempo real',
      'Vista de órdenes generadas',
      'Códigos QR para pagos',
      'Copia de datos al portapapeles'
    ],
    breaking: false,
    updateUrl: 'https://docs.banco-gt.com/widget/update',
    migration: {
      required: false,
      guide: 'https://docs.banco-gt.com/migration/v1.1.0'
    }
  });
});

// ...existing routes...