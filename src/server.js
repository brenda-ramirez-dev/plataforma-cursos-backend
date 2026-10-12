'use strict';

require('dotenv').config();

const app = require('./app');
const {
  pool,
  sequelize,
  testConnections,
} = require('./config/database');

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  try {
    await testConnections();

    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`API disponible en el puerto ${port}`);
      console.log('PostgreSQL con pg: conectado');
      console.log('PostgreSQL con Sequelize: conectado');
    });

    async function shutdown() {
      console.log('\nCerrando servidor...');

      server.close(async () => {
        try {
          await pool.end();
          await sequelize.close();
          console.log('Conexiones cerradas.');
          process.exitCode = 0;
        } catch (error) {
          console.error('Error al cerrar conexiones:', error.message);
          process.exitCode = 1;
        }
      });
    }

    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);

    await Promise.allSettled([
      pool.end(),
      sequelize.close(),
    ]);

    process.exitCode = 1;
  }
}

startServer();
