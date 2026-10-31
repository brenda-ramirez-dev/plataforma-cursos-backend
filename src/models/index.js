'use strict';
const { sequelize } = require('../config/database');
const defineUser = require('./User');
const User = defineUser(sequelize);
const Category = require('./Category');
const Course = require('./Course');
module.exports = { sequelize, User, Category, Course };
