import express from 'express';
import authController from './auth.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/v1/auth/login
 * @desc    Iniciar sesión con username o DPI y contraseña
 * @access  Public
 */
router.post('/login', authController.login.bind(authController));

/**
 * @route   POST /api/v1/auth/verify
 * @desc    Verificar si un token JWT es válido
 * @access  Public
 */
router.post('/verify', authController.verifyToken.bind(authController));

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obtener perfil completo del usuario autenticado
 * @access  Private (requiere token)
 */
router.get('/me', authMiddleware, authController.obtenerPerfil.bind(authController));

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Cambiar contraseña del usuario
 * @access  Private (requiere token)
 */
router.post('/change-password', authMiddleware, authController.cambiarPassword.bind(authController));

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Cerrar sesión
 * @access  Private (requiere token)
 */
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export default router;