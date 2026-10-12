'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

// Límite general para la API.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
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

// Límite adicional para intentos de inicio de sesión.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'LOGIN_RATE_LIMITED',
      message: 'Demasiados intentos. Intenta más tarde.',
    },
  },
});

// Endpoint para comprobar que Express está activo.
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok' },
  });
});

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1', apiLimiter);
app.use('/api/v1', userRoutes);

// Ruta inexistente.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'La ruta solicitada no existe.',
    },
  });
});

// Manejo centralizado de errores.
app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const status =
    Number.isInteger(error.status) &&
    error.status >= 400 &&
    error.status < 500
      ? error.status
      : 500;

  if (status >= 500) {
    console.error('Error interno de API:', error.message);
  }

  return res.status(status).json({
    success: false,
    error: {
      code: status >= 500 ? 'SERVER_ERROR' : 'INVALID_REQUEST',
      message:
        status >= 500
          ? 'Ocurrió un error interno del servidor.'
          : 'La solicitud no es válida.',
    },
  });
});

module.exports = app;
