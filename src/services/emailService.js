'use strict';

const nodemailer = require('nodemailer');

let transporter;

/**
 * Crea el transportador SMTP cuando se necesita.
 * La configuración se obtiene de las variables de entorno.
 */
function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Falta configurar las variables de conexión SMTP.'
    );
  }

  const port = Number(SMTP_PORT || 587);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('El puerto SMTP no es válido.');
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Envía un correo electrónico.
 */
async function sendEmail({ to, subject, text, html }) {
  if (!to || !subject || (!text && !html)) {
    throw new Error(
      'El destinatario, asunto y contenido del correo son obligatorios.'
    );
  }

  const mailer = getTransporter();

  const info = await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

/**
 * Comprueba la conexión con el servidor SMTP.
 */
async function verifyConnection() {
  await getTransporter().verify();
  return true;
}

module.exports = {
  sendEmail,
  verifyConnection,
};
