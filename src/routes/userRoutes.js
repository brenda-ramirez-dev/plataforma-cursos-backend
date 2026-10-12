'use strict';

const express = require('express');
const { pool } = require('../config/database');
const { User } = require('../models');

const createUserQueries = require('../repositories/native-sql/userQueries');
const createUserController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const userQueries = createUserQueries(pool);

const controller = createUserController({
  userQueries,
  User,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
});

// Login público.
router.post('/auth/login', controller.login);

// Registro público: el servidor asigna el rol student.
router.post('/users', controller.register);

// Rutas que necesitan un JWT válido.
router.get('/users/me', authenticate, controller.getMe);
router.put('/users/me', authenticate, controller.updateMe);
router.get('/users', authenticate, controller.listUsers);
router.delete('/users/:id', authenticate, controller.deleteUser);

module.exports = router;
