// modules/transacciones/transacciones.routes.js
const controller = require('./transacciones.controller');
const router = require('express').Router();

// Endpoint que la Pasarela de Pago llamar para autorizar un dbito
router.post('/autorizar', controller.autorizarPago); 

module.exports = router;