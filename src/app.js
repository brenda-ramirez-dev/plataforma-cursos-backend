'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger-output.json');

const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/category.routes');
const courseRoutes = require('./routes/course.routes');

const app = express();

app.disable('x-powered-by');

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10kb' }));

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

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok' },
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api/v1/auth/login', loginLimiter);
app.use('/api/v1', apiLimiter);

app.use('/api/v1', userRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/courses', courseRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'La ruta solicitada no existe.',
    },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

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
