'use strict';
const { pool } = require('../config/database');
const { Course } = require('../models');
const courseController = {};
const selectCourses = `
  SELECT c.id, c.title, c.description, c.price, c.category_id, c.created_by,
         c.created_at, c.updated_at, cat.name AS category_name
  FROM courses c JOIN categories cat ON cat.id = c.category_id`;

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}
courseController.getAll = async (req, res, next) => {
  try {
    const result = await pool.query(`${selectCourses} ORDER BY c.id ASC`);
    return res.json({ success: true, data: result.rows });
  } catch (error) { return next(error); }
};
courseController.getById = async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'El ID debe ser un entero positivo.' });
    const result = await pool.query(`${selectCourses} WHERE c.id = $1`, [id]);
    if (!result.rowCount) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
};
courseController.search = async (req, res, next) => {
  try {
    const { q = '', category_id, min_price, max_price } = req.query;
    const conditions = [], values = [];
    const add = (condition, value) => { values.push(value); conditions.push(condition.replace('?', `$${values.length}`)); };
    if (String(q).trim()) {
      values.push(`%${String(q).trim()}%`);
      conditions.push(`(c.title ILIKE $${values.length} OR COALESCE(c.description, '') ILIKE $${values.length})`);
    }
    if (category_id !== undefined) {
      const id = validId(category_id);
      if (!id) return res.status(400).json({ success: false, message: 'category_id debe ser un entero positivo.' });
      add('c.category_id = ?', id);
    }
    if (min_price !== undefined) {
      const n = Number(min_price);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ success: false, message: 'min_price debe ser mayor o igual a cero.' });
      add('c.price >= ?', n);
    }
    if (max_price !== undefined) {
      const n = Number(max_price);
      if (!Number.isFinite(n) || n < 0) return res.status(400).json({ success: false, message: 'max_price debe ser mayor o igual a cero.' });
      add('c.price <= ?', n);
    }
    if (min_price !== undefined && max_price !== undefined && Number(min_price) > Number(max_price)) {
      return res.status(400).json({ success: false, message: 'min_price no puede superar max_price.' });
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`${selectCourses} ${where} ORDER BY c.id ASC`, values);
    return res.json({ success: true, data: result.rows });
  } catch (error) { return next(error); }
};
courseController.create = async (req, res, next) => {
  try {
    if (!req.user || !['admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Solo administradores e instructores pueden crear cursos.' });
    }
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const description = body.description ?? null;
    const price = Number(body.price ?? 0);
    const categoryId = validId(body.category_id);
    if (!title || title.length > 200) return res.status(400).json({ success: false, message: 'El título es obligatorio (máximo 200 caracteres).' });
    if (!Number.isFinite(price) || price < 0) return res.status(400).json({ success: false, message: 'El precio debe ser mayor o igual a cero.' });
    if (!categoryId) return res.status(400).json({ success: false, message: 'category_id debe ser un entero positivo.' });
    const course = await Course.create({ title, description, price, category_id: categoryId, created_by: req.user.id });
    const result = await pool.query(`${selectCourses} WHERE c.id = $1`, [course.id]);
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
};
courseController.update = async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'El ID debe ser un entero positivo.' });
    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });
    if (req.user.role !== 'admin' && Number(course.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Solo el administrador o el creador puede modificar este curso.' });
    }
    const body = req.body || {}, updates = {};
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) return res.status(400).json({ success: false, message: 'Título no válido.' });
      updates.title = body.title.trim();
    }
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price < 0) return res.status(400).json({ success: false, message: 'Precio no válido.' });
      updates.price = price;
    }
    if (body.category_id !== undefined) {
      const categoryId = validId(body.category_id);
      if (!categoryId) return res.status(400).json({ success: false, message: 'category_id no válido.' });
      updates.category_id = categoryId;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, message: 'Envía al menos un campo para actualizar.' });
    await course.update(updates);
    const result = await pool.query(`${selectCourses} WHERE c.id = $1`, [id]);
    return res.json({ success: true, data: result.rows[0] });
  } catch (error) { return next(error); }
};
courseController.delete = async (req, res, next) => {
  try {
    const id = validId(req.params.id);
    if (!id) return res.status(400).json({ success: false, message: 'El ID debe ser un entero positivo.' });
    const course = await Course.findByPk(id);
    if (!course) return res.status(404).json({ success: false, message: 'Curso no encontrado.' });
    if (req.user.role !== 'admin' && Number(course.created_by) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Solo el administrador o el creador puede eliminar este curso.' });
    }
    await course.destroy();
    return res.json({ success: true, message: 'Curso eliminado correctamente.' });
  } catch (error) { return next(error); }
};
module.exports = courseController;
