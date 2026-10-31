// src/config/database.js
const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
require('dotenv').config();

// 1. Conexión ORM (Sequelize)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'postgres',
        logging: false, // Puedes ponerlo en true para ver el SQL generado en consola
    }
);

// 2. Conexión Nativa (pg)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

module.exports = { sequelize, pool };