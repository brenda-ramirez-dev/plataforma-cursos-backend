'use strict';

const { sequelize } = require('../config/database');
const defineUser = require('./User');

const User = defineUser(sequelize);

module.exports = {
  sequelize,
  User,
};

