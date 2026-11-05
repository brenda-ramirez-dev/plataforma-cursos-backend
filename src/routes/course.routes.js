'use strict';

const express = require('express');
const controller = require('../controllers/course.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/', controller.getAll);
router.get('/search', controller.search);
router.get('/:id', controller.getById);

router.post('/', authenticate, controller.create);
router.put('/:id', authenticate, controller.update);
router.delete('/:id', authenticate, controller.delete);

module.exports = router;
