'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
module.exports = sequelize.define('Course', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200), allowNull: false, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT, allowNull: true },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, validate: { min: 0 } },
  category_id: { type: DataTypes.INTEGER, allowNull: false, field: 'category_id',
    references: { model: 'categories', key: 'id' } },
  created_by: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by',
    references: { model: 'users', key: 'id' } }
}, { tableName: 'courses', timestamps: true, underscored: true });
