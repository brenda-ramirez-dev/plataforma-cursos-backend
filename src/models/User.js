'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },

      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },

      role: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'student',
        validate: {
          isIn: [['admin', 'instructor', 'student']],
        },
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      underscored: true,
    }
  );
};
