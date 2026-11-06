const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { verifyToken } = require('../middlewares/auth');

// Las rutas específicas van antes de /:id.
router.get('/', courseController.getAll);
router.get('/search', courseController.search);
router.get('/:id', courseController.getById);

// Operaciones de escritura protegidas por JWT.
router.post('/', verifyToken, courseController.create);
router.put('/:id', verifyToken, courseController.update);
router.delete('/:id', verifyToken, courseController.delete);

module.exports = router;
