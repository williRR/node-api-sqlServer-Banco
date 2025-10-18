import authService from './auth.service.js';

class AuthController {
  /**
   * POST /api/auth/login
   * Iniciar sesión
   */
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Usuario y contraseña son requeridos'
        });
      }

      const resultado = await authService.login(username, password);
      
      res.json(resultado);

    } catch (error) {
      if (error.message.includes('incorrectos') || error.message.includes('contraseña')) {
        return res.status(401).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * POST /api/auth/verify
   * Verificar token JWT
   */
  async verifyToken(req, res) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const resultado = await authService.verifyToken(token);
      res.json(resultado);

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: error.message
      });
    }
  }

  /**
   * POST /api/auth/change-password
   * Cambiar contraseña (requiere autenticación)
   */
  async cambiarPassword(req, res, next) {
    try {
      const { passwordActual, passwordNueva } = req.body;
      const userId = req.usuario?.id;
      const userType = req.usuario?.tipo;

      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual y nueva son requeridas'
        });
      }

      const resultado = await authService.cambiarPassword(
        userId,
        userType,
        passwordActual, 
        passwordNueva
      );

      res.json(resultado);

    } catch (error) {
      if (error.message.includes('incorrecta') || error.message.includes('caracteres')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Obtener perfil completo del usuario autenticado
   */
  async obtenerPerfil(req, res, next) {
    try {
      const userId = req.usuario?.id;
      const userType = req.usuario?.tipo;
      const resultado = await authService.obtenerPerfilCompleto(userId, userType);
      res.json(resultado);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Cerrar sesión (invalidar token del lado del cliente)
   */
  async logout(req, res) {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  }
}

export default new AuthController();