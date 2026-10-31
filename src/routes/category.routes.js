const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { verifyToken } = require('../middlewares/auth');

// ==========================================
// RUTAS GRAPHQL (Supabase)
// ==========================================
router.get('/graphql/list', categoryController.getCategoriesGraph);
router.get('/graphql/search', categoryController.searchCategoryGraph);
router.get('/graphql/:id', categoryController.getCategoryByIdGraph);
router.post('/graphql/create', verifyToken, categoryController.createCategoryGraph);
router.put('/graphql/update/:id', verifyToken, categoryController.updateCategoryGraph);
router.delete('/graphql/delete/:id', verifyToken, categoryController.deleteCategoryGraph);

// ==========================================
// RUTAS PÚBLICAS Y PROTEGIDAS (REST)
// ==========================================
router.get('/', categoryController.getAll);
router.get('/search', categoryController.search); 
router.get('/:id', categoryController.getById);
router.post('/', verifyToken, categoryController.create);
router.put('/:id', verifyToken, categoryController.update);
router.delete('/:id', verifyToken, categoryController.delete);

module.exports = router;