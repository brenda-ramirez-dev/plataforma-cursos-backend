'use strict';

const crypto = require('node:crypto');

function generateActionToken() {
  const token = crypto.randomBytes(32).toString('base64url');

  const tokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return { token, tokenHash };
}

function hashActionToken(token) {
  if (typeof token !== 'string' || !token) {
    throw new Error('El token es obligatorio.');
  }

  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

module.exports = {
  generateActionToken,
  hashActionToken,
};
