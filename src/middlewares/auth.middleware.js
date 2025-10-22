import jwt from 'jsonwebtoken';

// Middleware de autenticación JWT (ESM)
export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_temporal');

    // Inyecta el usuario para controladores
    req.usuario = {
      id: decoded.id,
      tipo: decoded.tipo,
      username: decoded.username,
      nombre: decoded.nombre,
      paterno: decoded.paterno,
      materno: decoded.materno,
      email: decoded.email,
      nit: decoded.nit
    };

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
  }
}