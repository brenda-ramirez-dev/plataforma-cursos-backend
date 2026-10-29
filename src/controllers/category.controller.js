const { pool } = require('../config/database');
const Category = require('../models/Category');

const categoryController = {};

// ==========================================
// LECTURAS (SQL Nativo mediante pg)
// ==========================================
categoryController.getAll = async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) { next(error); } // Pasa el error al middleware centralizado
};

categoryController.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) { next(error); }
};

categoryController.search = async (req, res, next) => {
    try {
        const { q } = req.query;
        const result = await pool.query('SELECT * FROM categories WHERE name ILIKE $1', [`%${q}%`]);
        res.json({ success: true, data: result.rows });
    } catch (error) { next(error); }
};

// ==========================================
// ESCRITURAS (ORM Sequelize)
// ==========================================
categoryController.create = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const newCategory = await Category.create({ name, description });
        res.status(201).json({ success: true, data: newCategory });
    } catch (error) { next(error); }
};

categoryController.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const category = await Category.findByPk(id);
        
        if (!category) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        
        await category.update({ name, description });
        res.json({ success: true, data: category });
    } catch (error) { next(error); }
};

categoryController.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await Category.destroy({ where: { id } });
        
        if (!deleted) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.json({ success: true, message: 'Categoría eliminada correctamente' });
    } catch (error) { next(error); }
};

module.exports = categoryController;