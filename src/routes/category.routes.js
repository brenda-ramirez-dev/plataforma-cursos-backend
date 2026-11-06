'use strict';

const express = require('express');
const controller = require('../controllers/category.controller');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Solo un administrador puede gestionar categorías.',
      },
    });
  }

  return next();
}

// Consultas GraphQL ejecutadas mediante Supabase.
router.get('/graphql/list', controller.getCategoriesGraph);
router.get('/graphql/search', controller.searchCategoryGraph);
router.get('/graphql/:id', controller.getCategoryByIdGraph);

// Mutaciones GraphQL protegidas.
router.post('/graphql/create', authenticate, requireAdmin, controller.createCategoryGraph);
router.put('/graphql/update/:id', authenticate, requireAdmin, controller.updateCategoryGraph);
router.delete('/graphql/delete/:id', authenticate, requireAdmin, controller.deleteCategoryGraph);

// Consultas REST.
router.get('/', controller.getAll);
router.get('/search', controller.search);
router.get('/:id', controller.getById);

// Escrituras REST protegidas.
router.post('/', authenticate, requireAdmin, controller.create);
router.put('/:id', authenticate, requireAdmin, controller.update);
router.delete('/:id', authenticate, requireAdmin, controller.delete);

module.exports = router;
