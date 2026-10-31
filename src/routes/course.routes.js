const express = require('express');
const controller = require('../controllers/course.controller');
const { verifyToken } = require('../middlewares/auth');
const router = express.Router();

router.get('/', controller.getAll);
router.get('/search', controller.search);
router.get('/:id', controller.getById);

router.post('/', verifyToken, controller.create);
router.put('/:id', verifyToken, controller.update);
router.delete('/:id', verifyToken, controller.delete);

module.exports = router;
