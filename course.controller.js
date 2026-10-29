const { pool } = require('../config/database');
const Course = require('../models/Course');

const courseController = {};

// Lecturas: SQL nativo con pg
courseController.getAll = async (req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT c.id, c.title, c.description, c.price, c.category_id,
                    c.created_by, c.created_at, c.updated_at,
                    cat.name AS category_name
             FROM courses c
             JOIN categories cat ON cat.id = c.category_id
             ORDER BY c.id ASC`
        );
        return res.json({ success: true, data: result.rows });
    } catch (error) { return next(error); }
};

courseController.getById = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ success: false, message: 'El ID debe ser un número entero positivo.' });
        }
        const result = await pool.query(
            `SELECT c.id, c.title, c.description, c.price, c.category_id,
                    c.created_by, c.created_at, c.updated_at,
                    cat.name AS category_name
             FROM courses c
             JOIN categories cat ON cat.id = c.category_id
             WHERE c.id = $1`, [id]
        );
        if (!result.rows.length) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });
        return res.json({ success: true, data: result.rows[0] });
    } catch (error) { return next(error); }
};

courseController.search = async (req, res, next) => {
    try {
        const { q = '', category_id, min_price, max_price } = req.query;
        const conditions = [];
        const values = [];
        const add = (sql, value) => { values.push(value); conditions.push(sql.replace('?', `$${values.length}`)); };

        if (String(q).trim()) add("(c.title ILIKE ? OR COALESCE(c.description, '') ILIKE ?)", `%${String(q).trim()}%`);
        // La condición de búsqueda textual usa el mismo valor dos veces.
        if (String(q).trim()) {
            const first = values.pop();
            conditions.pop();
            values.push(first, first);
            conditions.push(`(c.title ILIKE $${values.length - 1} OR COALESCE(c.description, '') ILIKE $${values.length})`);
        }
        if (category_id !== undefined) {
            const n = Number(category_id);
            if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ success: false, message: 'category_id debe ser un entero positivo.' });
            add('c.category_id = ?', n);
        }
        if (min_price !== undefined) {
            const n = Number(min_price);
            if (!Number.isFinite(n) || n < 0) return res.status(400).json({ success: false, message: 'min_price debe ser un número mayor o igual a cero.' });
            add('c.price >= ?', n);
        }
        if (max_price !== undefined) {
            const n = Number(max_price);
            if (!Number.isFinite(n) || n < 0) return res.status(400).json({ success: false, message: 'max_price debe ser un número mayor o igual a cero.' });
            add('c.price <= ?', n);
        }
        if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
            return res.status(400).json({ success: false, message: 'min_price no puede ser mayor que max_price.' });
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const result = await pool.query(
            `SELECT c.id, c.title, c.description, c.price, c.category_id,
                    c.created_by, c.created_at, c.updated_at,
                    cat.name AS category_name
             FROM courses c
             JOIN categories cat ON cat.id = c.category_id
             ${where}
             ORDER BY c.id ASC`, values
        );
        return res.json({ success: true, data: result.rows });
    } catch (error) { return next(error); }
};

// Escrituras: Sequelize
courseController.create = async (req, res, next) => {
    try {
        const { title, description = null, price = 0, category_id } = req.body;
        if (typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ success: false, message: 'El título es obligatorio.' });
        }
        const numericPrice = Number(price);
        const categoryId = Number(category_id);
        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            return res.status(400).json({ success: false, message: 'El precio debe ser un número mayor o igual a cero.' });
        }
        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({ success: false, message: 'category_id debe ser un entero positivo.' });
        }
        const createdBy = req.user && Number.isInteger(Number(req.user.id)) ? Number(req.user.id) : null;
        const course = await Course.create({
            title: title.trim(), description, price: numericPrice,
            category_id: categoryId, created_by: createdBy
        });
        return res.status(201).json({ success: true, data: course });
    } catch (error) { return next(error); }
};

courseController.update = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'El ID debe ser un número entero positivo.' });
        const course = await Course.findByPk(id);
        if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });

        const updates = {};
        if (req.body.title !== undefined) {
            if (typeof req.body.title !== 'string' || !req.body.title.trim()) return res.status(400).json({ success: false, message: 'El título no puede estar vacío.' });
            updates.title = req.body.title.trim();
        }
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.price !== undefined) {
            const price = Number(req.body.price);
            if (!Number.isFinite(price) || price < 0) return res.status(400).json({ success: false, message: 'El precio debe ser un número mayor o igual a cero.' });
            updates.price = price;
        }
        if (req.body.category_id !== undefined) {
            const categoryId = Number(req.body.category_id);
            if (!Number.isInteger(categoryId) || categoryId <= 0) return res.status(400).json({ success: false, message: 'category_id debe ser un entero positivo.' });
            updates.category_id = categoryId;
        }
        await course.update(updates);
        return res.json({ success: true, data: course });
    } catch (error) { return next(error); }
};

courseController.delete = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'El ID debe ser un número entero positivo.' });
        const deleted = await Course.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });
        return res.json({ success: true, message: 'Curso eliminado correctamente.' });
    } catch (error) { return next(error); }
};

module.exports = courseController;
