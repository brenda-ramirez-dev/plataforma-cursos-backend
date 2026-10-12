'use strict';

require('dotenv').config();

const { Pool } = require('pg');
const { Sequelize } = require('sequelize');

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  throw new Error('Falta configurar DATABASE_URL en el archivo .env');
}

// Conexión para consultas SQL nativas.
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Registra errores inesperados de conexiones inactivas sin mostrar secretos.
pool.on('error', (error) => {
  console.error('Error inesperado en el pool PostgreSQL:', error.message);
});

// Conexión para operaciones mediante Sequelize.
const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

// Comprueba ambos métodos de acceso a la misma base de datos.
// No crea ni modifica tablas.
async function testConnections() {
  await pool.query('SELECT 1');
  await sequelize.authenticate();
}

module.exports = {
  pool,
  sequelize,
  testConnections,
};
