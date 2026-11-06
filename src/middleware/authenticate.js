'use strict';

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authorization = req.get('authorization') || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_REQUIRED',
        message: 'Debes iniciar sesión para acceder a este recurso.',
      },
    });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error('Falta configurar JWT_SECRET.'));
  }

  try {
    const payload = jwt.verify(match[1], process.env.JWT_SECRET);
    const id = Number(payload.sub);
    const validRoles = ['admin', 'instructor', 'student'];

    if (
      !Number.isSafeInteger(id) ||
      id <= 0 ||
      !validRoles.includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'El token no contiene información válida.',
        },
      });
    }

    req.user = {
      id,
      role: payload.role,
    };

    return next();
  } catch {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'El token es inválido o ha expirado.',
      },
    });
  }
}

module.exports = authenticate;
