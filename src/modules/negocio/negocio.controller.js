import * as negocioService from './negocio.service.js';

export const crearNegocio = async (req, res) => {
  try {
    const data = req.body;
    const nuevoNegocio = await negocioService.crearNegocio(data);
    res.status(201).json(nuevoNegocio);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear negocio', error: error.message });
  }
};

export const obtenerNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const negocio = await negocioService.obtenerNegocio(id);
    if (!negocio) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }
    res.json(negocio);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar negocio', error: error.message });
  }
};

export const actualizarNegocio = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const negocioActualizado = await negocioService.actualizarNegocio(id, data);
    if (!negocioActualizado) {
      return res.status(404).json({ message: 'Negocio no encontrado' });
    }
    res.json(negocioActualizado);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar negocio', error: error.message });
  }
};
