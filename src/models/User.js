'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: 'password_hash' },
  role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'student',
    validate: { isIn: [['admin', 'instructor', 'student']] } },
  emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
  emailVerificationTokenHash: { type: DataTypes.STRING(64), allowNull: true, field: 'email_verification_token_hash' },
  emailVerificationExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verification_expires_at' },
  passwordResetTokenHash: { type: DataTypes.STRING(64), allowNull: true, field: 'password_reset_token_hash' },
  passwordResetExpiresAt: { type: DataTypes.DATE, allowNull: true, field: 'password_reset_expires_at' }
}, { tableName: 'users', timestamps: true, underscored: true });
