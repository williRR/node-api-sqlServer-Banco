import * as negocioService from './negocio.service.js';

export const crearTarjeta = async (req, res) => {
  try {
    const data = req.body;
    const nuevaTarjeta = await negocioService.crearTarjeta(data);
    res.status(201).json(nuevaTarjeta);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarjeta', error: error.message });
  }
};