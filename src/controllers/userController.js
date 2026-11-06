'use strict';

const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const {
  generateActionToken,
  hashActionToken,
} = require('../services/tokenService');

function safeUser(user) {
  const value = typeof user.toJSON === 'function'
    ? user.toJSON()
    : user;

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    role: value.role,
    email_verified_at:
      value.email_verified_at ?? value.emailVerifiedAt ?? null,
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
  actionTokenQueries,
  User,
  emailService,
  appBaseUrl,
  jwtSecret,
  jwtExpiresIn = '24h',
}) {
  if (
    !userQueries ||
    !actionTokenQueries ||
    !User ||
    !emailService ||
    !emailService.sendEmail ||
    !appBaseUrl ||
    !jwtSecret
  ) {
    throw new Error('Faltan dependencias para configurar UserController.');
  }

  const baseUrl = appBaseUrl.replace(/\/+$/, '');

  // Genera un token, almacena su hash y establece su expiración.
  async function createToken(user, purpose, minutes) {
    const { token, tokenHash } = generateActionToken();

    const expiresAt = new Date(
      Date.now() + minutes * 60 * 1000
    );

    await actionTokenQueries.create({
      userId: user.id,
      tokenHash,
      purpose,
      expiresAt,
    });

    return token;
  }

  // Envía el enlace para confirmar el correo.
  async function sendVerificationEmail(user) {
    const token = await createToken(user, 'verify_email', 1440);

    const verificationUrl =
      `${baseUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Confirma tu cuenta - Plataforma de Cursos',
      text:
        `Hola ${user.name}.\n\n` +
        `Gracias por registrarte en nuestra Plataforma de Cursos.\n\n` +
        `Confirma tu correo abriendo este enlace:\n${verificationUrl}\n\n` +
        `Este enlace expira en 24 horas.`,
    });
  }

  // Envía el código para recuperar la contraseña.
  async function sendPasswordResetEmail(user) {
    const token = await createToken(user, 'reset_password', 15);

    await emailService.sendEmail({
      to: user.email,
      subject: 'Recuperación de contraseña - Plataforma de Cursos',
      text:
        `Hola ${user.name}.\n\n` +
        `Tu código temporal para recuperar tu contraseña es:\n\n` +
        `${token}\n\n` +
        `Este código expira en 15 minutos y solo puede utilizarse una vez.\n\n` +
        `Si no solicitaste este cambio, ignora este correo.`,
    });
  }

  return {
    // POST /api/v1/auth/login
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

        if (!user.email_verified_at) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'EMAIL_NOT_VERIFIED',
              message: 'Debes confirmar tu correo antes de iniciar sesión.',
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

    // POST /api/v1/users
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

        let emailSent = true;

        try {
          await sendVerificationEmail(user);
        } catch (emailError) {
          emailSent = false;
          console.error(
            'No se pudo enviar el correo de confirmación:',
            emailError.code || emailError.message
          );
        }

        return res.status(201).json({
          success: true,
          message: emailSent
            ? 'Cuenta creada. Revisa tu correo para confirmarla.'
            : 'Cuenta creada, pero no pudimos enviar el correo. Solicita uno nuevo.',
          data: safeUser(user),
        });
      } catch (error) {
        return handleWriteError(error, res, next);
      }
    },

    // GET /api/v1/auth/verify-email
    verifyEmail: async (req, res, next) => {
      try {
        const token = req.query?.token;

        if (
          typeof token !== 'string' ||
          token.length !== 43
        ) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'El enlace de confirmación no es válido.',
            },
          });
        }

        const tokenHash = hashActionToken(token);

        const user =
          await actionTokenQueries.confirmEmail(tokenHash);

        if (!user) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_OR_EXPIRED_TOKEN',
              message: 'El enlace expiró, ya fue utilizado o no es válido.',
            },
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Tu correo ha sido confirmado. Ya puedes iniciar sesión.',
        });
      } catch (error) {
        return next(error);
      }
    },

    // POST /api/v1/auth/resend-verification
    resendVerification: async (req, res, next) => {
      try {
        const email = String(req.body?.email || '')
          .trim()
          .toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Proporciona un correo válido.',
            },
          });
        }

        const user = await User.findOne({ where: { email } });

        if (user && !user.emailVerifiedAt) {
          try {
            await sendVerificationEmail(user);
          } catch (emailError) {
            console.error(
              'No se pudo reenviar la confirmación:',
              emailError.code || emailError.message
            );
          }
        }

        return res.status(200).json({
          success: true,
          message:
            'Si existe una cuenta pendiente de confirmación, recibirás un correo.',
        });
      } catch (error) {
        return next(error);
      }
    },

    // POST /api/v1/auth/forgot-password
    forgotPassword: async (req, res, next) => {
      try {
        const email = String(req.body?.email || '')
          .trim()
          .toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Proporciona un correo válido.',
            },
          });
        }

        const user = await User.findOne({ where: { email } });

        if (user) {
          try {
            await sendPasswordResetEmail(user);
          } catch (emailError) {
            console.error(
              'No se pudo enviar la recuperación:',
              emailError.code || emailError.message
            );
          }
        }

        return res.status(200).json({
          success: true,
          message:
            'Si la cuenta existe, recibirás instrucciones para recuperar tu contraseña.',
        });
      } catch (error) {
        return next(error);
      }
    },

    // POST /api/v1/auth/reset-password
    resetPassword: async (req, res, next) => {
      try {
        const token = req.body?.token;
        const newPassword = req.body?.newPassword;

        if (
          typeof token !== 'string' ||
          token.length !== 43 ||
          typeof newPassword !== 'string' ||
          newPassword.length < 12
        ) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message:
                'Proporciona un token válido y una contraseña de al menos 12 caracteres.',
            },
          });
        }

        const tokenHash = hashActionToken(token);
        const passwordHash = await argon2.hash(newPassword);

        const user = await actionTokenQueries.resetPassword(
          tokenHash,
          passwordHash
        );

        if (!user) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_OR_EXPIRED_TOKEN',
              message: 'El código expiró, ya fue utilizado o no es válido.',
            },
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Tu contraseña ha sido actualizada correctamente.',
        });
      } catch (error) {
        return next(error);
      }
    },

    // POST /api/v1/notifications/email
    sendNotification: async (req, res, next) => {
      try {
        if (!['admin', 'instructor'].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'No tienes permiso para enviar notificaciones.',
            },
          });
        }

        const userId = Number(req.body?.userId);
        const subject = String(req.body?.subject || '').trim();
        const message = String(req.body?.message || '').trim();

        if (
          !Number.isSafeInteger(userId) ||
          userId <= 0 ||
          !subject ||
          subject.length > 150 ||
          !message ||
          message.length > 5000
        ) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Proporciona destinatario, asunto y mensaje válidos.',
            },
          });
        }

        const recipient = await User.findByPk(userId);

        if (!recipient) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Usuario destinatario no encontrado.',
            },
          });
        }

        await emailService.sendEmail({
          to: recipient.email,
          subject,
          text: message,
        });

        return res.status(200).json({
          success: true,
          message: 'Notificación enviada correctamente.',
        });
      } catch (error) {
        return next(error);
      }
    },

    // GET /api/v1/users/me
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

    // GET /api/v1/users
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

    // PUT /api/v1/users/me
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
        let emailChanged = false;

        if (
          Object.hasOwn(body, 'role') ||
          Object.hasOwn(body, 'passwordHash') ||
          Object.hasOwn(body, 'password_hash')
        ) {
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

          if (email !== user.email.toLowerCase()) {
            updates.email = email;
            updates.emailVerifiedAt = null;
            emailChanged = true;
          }
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

        let message = 'Perfil actualizado correctamente.';

        if (emailChanged) {
          try {
            await sendVerificationEmail(user);
            message =
              'Perfil actualizado. Confirma tu nuevo correo electrónico.';
          } catch (emailError) {
            console.error(
              'No se pudo enviar la nueva confirmación:',
              emailError.code || emailError.message
            );

            message =
              'Perfil actualizado, pero no se pudo enviar la confirmación del nuevo correo.';
          }
        }

        return res.status(200).json({
          success: true,
          message,
          data: safeUser(user),
        });
      } catch (error) {
        return handleWriteError(error, res, next);
      }
    },

    // DELETE /api/v1/users/:id
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
