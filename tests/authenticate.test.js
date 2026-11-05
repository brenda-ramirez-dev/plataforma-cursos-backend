'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'clave-exclusiva-para-pruebas-automatizadas';

const authenticate = require('../src/middleware/authenticate');

function createResponse() {
  return {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    },
  };
}

function createRequest(authorization = '') {
  return {
    get(header) {
      return header.toLowerCase() === 'authorization'
        ? authorization
        : undefined;
    },
  };
}

test('rechaza solicitudes sin token', () => {
  const req = createRequest();
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'TOKEN_REQUIRED');
  assert.equal(nextCalled, false);
});

test('rechaza tokens inválidos', () => {
  const req = createRequest('Bearer token-invalido');
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'INVALID_TOKEN');
  assert.equal(nextCalled, false);
});

test('acepta un JWT válido y carga los datos del usuario', () => {
  const token = jwt.sign(
    { role: 'student' },
    process.env.JWT_SECRET,
    { subject: '42', expiresIn: '5m' }
  );

  const req = createRequest(`Bearer ${token}`);
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, {
    id: 42,
    role: 'student',
  });
});

test('rechaza tokens con roles no permitidos', () => {
  const token = jwt.sign(
    { role: 'superuser' },
    process.env.JWT_SECRET,
    { subject: '42', expiresIn: '5m' }
  );

  const req = createRequest(`Bearer ${token}`);
  const res = createResponse();
  let nextCalled = false;

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error.code, 'INVALID_TOKEN');
  assert.equal(nextCalled, false);
});
