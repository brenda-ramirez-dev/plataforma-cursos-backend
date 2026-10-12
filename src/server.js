// src/server.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { sequelize } = require('./config/database');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json()); // Para que el backend entienda JSON
app.use(morgan('dev')); // Para ver las peticiones en la terminal

// Aquí irán las rutas más adelante (ej. app.use('/api/categories', categoryRoutes))
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenido a la API de la Plataforma de Cursos' });
});

// Importar rutas
const categoryRoutes = require('./routes/category.routes');

// Usar rutas
app.use('/api/categories', categoryRoutes);

// Middleware centralizado de manejo de errores (Tu tarea)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Ocurrió un error interno en el servidor.',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

// Inicialización del servidor y conexión a BD
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Sincronización con PostgreSQL (Sequelize) exitosa.');
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el puerto ${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo conectar a la base de datos:', error);
    }
};

startServer();