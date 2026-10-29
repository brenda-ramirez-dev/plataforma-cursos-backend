const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middlewares/auth');

// Rutas públicas (Lectura)
router.get('/', categoryController.getAll);
router.get('/search', categoryController.search); // Debe ir antes de /:id para no confundir rutas
router.get('/:id', categoryController.getById);

// Rutas protegidas (Escritura)
router.post('/', verifyToken, categoryController.create);
router.put('/:id', verifyToken, categoryController.update);
router.delete('/:id', verifyToken, categoryController.delete);

module.exports = router;