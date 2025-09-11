import * as clientesService from "./clientes.service.js";

export const crearCliente = async (req, res) => {
  try {
    const data = req.body;
    const nuevoCliente = await clientesService.crearCliente(data);
    res.status(201).json(nuevoCliente);
  } catch (error) {
    res.status(500).json({ message: "Error al crear cliente", error: error.message });
  } 
};

export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const cliente = await clientesService.obtenerCliente(id);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    res.json(cliente);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar cliente", error: error.message });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const clienteActualizado = await clientesService.actualizarCliente(id, data);
    res.json(clienteActualizado);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
  }
};
