'use strict';

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

function safeUser(user) {
  const value = typeof user.toJSON === 'function'
    ? user.toJSON()
    : user;

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
    created_at: value.created_at ?? value.createdAt,
    updated_at: value.updated_at ?? value.updatedAt,
  };
}

function validId(value) {
  return /^\d+$/.test(String(value)) &&
    Number.isSafeInteger(Number(value)) &&
    Number(value) > 0;
}

function handleWriteError(error, res, next) {
  if (
    error.name === 'SequelizeUniqueConstraintError' ||
    error.original?.code === '23505'
  ) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'Ya existe un registro con esos datos.',
      },
    });
  }

  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos enviados no son válidos.',
      },
    });
  }

  return next(error);
}

function createUserController({
  userQueries,
  User,
  jwtSecret,
  jwtExpiresIn = '24h',
}) {
  if (!userQueries || !User || !jwtSecret) {
    throw new Error(
      'Falta configurar userQueries, User o JWT_SECRET.'
    );
  }

  return {
    // 1. POST /api/v1/auth/login — SQL nativo.
    login: async (req, res, next) => {
      try {
        const email = String(req.body?.email || '')
          .trim()
          .toLowerCase();
        const password = req.body?.password;

        if (!email || typeof password !== 'string' || !password) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Correo y contraseña son obligatorios.',
            },
          });
        }

        const user =
          await userQueries.findByEmailForAuthentication(email);

        if (
          !user ||
          !(await argon2.verify(user.password_hash, password))
        ) {
          return res.status(401).json({
            success: false,
            error: {
              code: 'INVALID_CREDENTIALS',
              message: 'Correo o contraseña incorrectos.',
            },
          });
        }

        const token = jwt.sign(
          { role: user.role },
          jwtSecret,
          {
            subject: String(user.id),
            expiresIn: jwtExpiresIn,
          }
        );

        return res.status(200).json({
          success: true,
          data: {
            token,
            user: safeUser(user),
          },
        });
      } catch (error) {
        return next(error);
      }
    },

    // 2. GET /api/v1/users/me — SQL nativo.
    getMe: async (req, res, next) => {
      try {
        const user = await userQueries.findProfileById(req.user.id);

        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Usuario no encontrado.',
            },
          });
        }

        return res.status(200).json({
          success: true,
          data: safeUser(user),
        });
      } catch (error) {
        return next(error);
      }
    },

    // 3. GET /api/v1/users — SQL nativo, solo administrador.
    listUsers: async (req, res, next) => {
      try {
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Se requieren permisos de administrador.',
            },
          });
        }

        const users = await userQueries.listUsers();

        return res.status(200).json({
          success: true,
          data: users.map(safeUser),
        });
      } catch (error) {
        return next(error);
      }
    },

    // 4. POST /api/v1/users — Sequelize.
    register: async (req, res, next) => {
      try {
        const name = String(req.body?.name || '').trim();
        const email = String(req.body?.email || '')
          .trim()
          .toLowerCase();
        const password = req.body?.password;

        if (
          !name ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          typeof password !== 'string' ||
          password.length < 12
        ) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message:
                'Proporciona un nombre, correo válido y contraseña de al menos 12 caracteres.',
            },
          });
        }

        const passwordHash = await argon2.hash(password);

        const user = await User.create({
          name,
          email,
          passwordHash,
          role: 'student',
        });

        return res.status(201).json({
          success: true,
          data: safeUser(user),
        });
      } catch (error) {
        return handleWriteError(error, res, next);
      }
    },

    // 5. PUT /api/v1/users/me — Sequelize.
    updateMe: async (req, res, next) => {
      try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Usuario no encontrado.',
            },
          });
        }

        const body = req.body || {};
        const updates = {};

        if (Object.hasOwn(body, 'role') ||
            Object.hasOwn(body, 'passwordHash') ||
            Object.hasOwn(body, 'password_hash')) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FIELDS',
              message: 'No puedes modificar tu rol ni el hash directamente.',
            },
          });
        }

        if (Object.hasOwn(body, 'name')) {
          const name = String(body.name || '').trim();

          if (!name) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'El nombre no puede estar vacío.',
              },
            });
          }

          updates.name = name;
        }

        if (Object.hasOwn(body, 'email')) {
          const email = String(body.email || '')
            .trim()
            .toLowerCase();

          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'El correo no es válido.',
              },
            });
          }

          updates.email = email;
        }

        if (Object.hasOwn(body, 'password')) {
          if (
            typeof body.password !== 'string' ||
            body.password.length < 12
          ) {
            return res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'La contraseña debe tener al menos 12 caracteres.',
              },
            });
          }

          updates.passwordHash = await argon2.hash(body.password);
        }

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'EMPTY_UPDATE',
              message: 'Envía al menos un campo válido para actualizar.',
            },
          });
        }

        await user.update(updates);

        return res.status(200).json({
          success: true,
          data: safeUser(user),
        });
      } catch (error) {
        return handleWriteError(error, res, next);
      }
    },

    // 6. DELETE /api/v1/users/:id — Sequelize, solo administrador.
    deleteUser: async (req, res, next) => {
      try {
        if (req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Se requieren permisos de administrador.',
            },
          });
        }

        const { id } = req.params;

        if (!validId(id)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_ID',
              message: 'El ID debe ser un entero positivo.',
            },
          });
        }

        if (Number(id) === Number(req.user.id)) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'SELF_DELETE',
              message: 'No puedes eliminar tu propia cuenta.',
            },
          });
        }

        const user = await User.findByPk(Number(id));

        if (!user) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Usuario no encontrado.',
            },
          });
        }

        await user.destroy();

        return res.status(200).json({
          success: true,
          data: { id: Number(id) },
        });
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = createUserController;
