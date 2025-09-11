import * as tarjetaService from './tarjetas.services.js';

export const crearTarjeta = async (req, res) => {
  try {
    const data = req.body;
    const nuevaTarjeta = await tarjetaService.crearTarjeta(data);
    res.status(201).json(nuevaTarjeta);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear tarjeta', error: error.message });
  }
};