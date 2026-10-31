const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

// ==========================================
// RUTAS GRAPHQL (Supabase)
// ==========================================
// Debe ir hasta arriba para que Express la detecte primero
router.get('/graphql/list', categoryController.getCategoriesGraph);
router.get('/graphql/:id', categoryController.getCategoryByIdGraph);
router.post('/graphql/create', categoryController.createCategoryGraph);
router.put('/graphql/update/:id', categoryController.updateCategoryGraph);
router.delete('/graphql/delete/:id', categoryController.deleteCategoryGraph);

// ==========================================
// RUTAS PÚBLICAS (REST)
// ==========================================
router.get('/', categoryController.getAll);
router.get('/search', categoryController.search); 
router.get('/:id', categoryController.getById);

// ==========================================
// RUTAS PROTEGIDAS (REST - Temporalmente sin verifyToken)
// ==========================================
router.post('/', categoryController.create);
router.get('/graphql/search', categoryController.searchCategoriesGraph);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.delete);

module.exports = router;