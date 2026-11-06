'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');

const { pool } = require('../config/database');
const { User } = require('../models');

const createUserQueries = require('../repositories/native-sql/userQueries');
const createActionTokenQueries = require('../repositories/native-sql/actionTokenQueries');
const createUserController = require('../controllers/userController');

const emailService = require('../services/emailService');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const userQueries = createUserQueries(pool);
const actionTokenQueries = createActionTokenQueries(pool);

const controller = createUserController({
  userQueries,
  actionTokenQueries,
  User,
  emailService,
  appBaseUrl: process.env.APP_BASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
});

// Límite para solicitudes de confirmación y recuperación.
const emailRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Intenta más tarde.',
    },
  },
});

// Límite para validar tokens.
const tokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Intenta más tarde.',
    },
  },
});

// Autenticación.
router.post('/auth/login', controller.login);

// Registro.
router.post('/users', controller.register);

// Confirmación de correo.
router.get(
  '/auth/verify-email',
  tokenLimiter,
  controller.verifyEmail
);

// Reenvío de confirmación.
router.post(
  '/auth/resend-verification',
  emailRequestLimiter,
  controller.resendVerification
);

// Recuperación de contraseña.
router.post(
  '/auth/forgot-password',
  emailRequestLimiter,
  controller.forgotPassword
);

router.post(
  '/auth/reset-password',
  tokenLimiter,
  controller.resetPassword
);

// Notificaciones: solamente administradores e instructores.
router.post(
  '/notifications/email',
  authenticate,
  controller.sendNotification
);

// Perfil y administración de usuarios.
router.get('/users/me', authenticate, controller.getMe);
router.put('/users/me', authenticate, controller.updateMe);
router.get('/users', authenticate, controller.listUsers);
router.delete('/users/:id', authenticate, controller.deleteUser);

module.exports = router;
