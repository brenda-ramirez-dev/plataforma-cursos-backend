const { pool } = require('../config/database');
const Category = require('../models/Category');
const { consultarGraphQL } = require('../db/graphSubase');
const { 
    obtenerCategorias, 
    obtenerCategoriaPorId, 
    crearCategoria, 
    actualizarCategoria, 
    eliminarCategoria,
    buscarCategoria
} = require('../queries/Categoria');
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

// ==========================================
// GRAPHQL (Supabase)
// ==========================================
categoryController.getCategoriesGraph = async (req, res, next) => {
    try {
        const data = await consultarGraphQL(obtenerCategorias);
        const categorias = data.categoriesCollection.edges.map(edge => edge.node);
        res.status(200).json({ success: true, data: categorias });
    } catch (error) {
        next(error);
    }
};

categoryController.getCategoryByIdGraph = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await consultarGraphQL(obtenerCategoriaPorId, { id: parseInt(id) });
        const categorias = data.categoriesCollection.edges;
        if (categorias.length === 0) return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
        res.status(200).json({ success: true, data: categorias[0].node });
    } catch (error) { next(error); }
};

categoryController.createCategoryGraph = async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const data = await consultarGraphQL(crearCategoria, { name, description });
        const nuevaCategoria = data.insertIntocategoriesCollection.records[0];
        res.status(201).json({ success: true, data: nuevaCategoria });
    } catch (error) { next(error); }
};

categoryController.updateCategoryGraph = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const data = await consultarGraphQL(actualizarCategoria, { id: parseInt(id), name, description });
        const actualizada = data.updatecategoriesCollection.records[0];
        res.status(200).json({ success: true, data: actualizada });
    } catch (error) { next(error); }
};

categoryController.deleteCategoryGraph = async (req, res, next) => {
    try {
        const { id } = req.params;
        const data = await consultarGraphQL(eliminarCategoria, { id: parseInt(id) });
        const eliminada = data.deleteFromcategoriesCollection.records[0];
        res.status(200).json({ success: true, data: eliminada });
    } catch (error) { next(error); }
};

categoryController.searchCategoryGraph = async (req, res, next) => {
    try {
        const { q } = req.query; 
        const data = await consultarGraphQL(buscarCategoria, { keyword: `%${q}%` });
        const categorias = data.categoriesCollection.edges.map(edge => edge.node);
        res.status(200).json({ success: true, data: categorias });
    } catch (error) { next(error); }
};

module.exports = categoryController;