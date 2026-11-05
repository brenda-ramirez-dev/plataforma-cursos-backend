'use strict';

const swaggerAutogen = require('swagger-autogen')({
  openapi: '3.0.0',
});

const doc = {
  info: {
    title: 'Plataforma de Cursos API REST',
    description: 'API REST para usuarios, categorías, cursos y notificaciones.',
    version: '2.0.0',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Servidor local',
    },
  ],
  tags: [
    { name: 'Health' },
    { name: 'Autenticación' },
    { name: 'Usuarios' },
    { name: 'Categorías' },
    { name: 'Cursos' },
    { name: 'Notificaciones' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

const outputFile = './swagger-output.json';

const endpointsFiles = ['./src/app.js'];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger generado correctamente: swagger-output.json');
});
