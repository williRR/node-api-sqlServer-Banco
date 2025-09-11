import * as cuentaService from "./cuentas.service.js";

export const crearCuenta = async (req, res) => {
  try {
    const data = req.body;
    const nuevaCuenta = await cuentaService.crearCuenta(data);
    res.status(201).json(nuevaCuenta);
  } catch (error) {
    res.status(500).json({ message: "Error al crear cuenta", error: error.message });
  }
};

export const obtenerCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const cuenta = await cuentaService.obtenerCuenta(id);
    if (!cuenta) {
      return res.status(404).json({ message: "Cuenta no encontrada" });
    }
    res.json(cuenta);
  } catch (error) {
    res.status(500).json({ message: "Error al consultar cuenta", error: error.message });
  }
};

export const actualizarCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const cuentaActualizada = await cuentaService.actualizarCuenta(id, data);
    res.json(cuentaActualizada);
  } catch (error) {
    res.status(500).json({ message: "Error al actualizar cuenta", error: error.message });
  }
};

export const eliminarCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    await cuentaService.eliminarCuenta(id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar cuenta", error: error.message });
  }
}
