const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const { sequelize } = require('./config/database');
const categoryRoutes = require('./routes/category.routes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api/v1/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'Bienvenido a la API de la Plataforma de Cursos' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Ocurrió un error interno en el servidor.',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

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