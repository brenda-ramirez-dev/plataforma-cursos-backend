'use strict';
const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const doc = {
  info: {
    title: 'Plataforma de Cursos API REST',
    description: 'Documentación de los endpoints REST de usuarios, categorías, cursos y correo.',
    version: '2.0.0'
  },
  servers: [{ url: 'http://localhost:3000', description: 'Entorno local' }],
  tags: [
    { name: 'Health' }, { name: 'Autenticación' }, { name: 'Usuarios' },
    { name: 'Categorías' }, { name: 'Cursos' }, { name: 'Notificaciones' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    },
    schemas: {
      Error: { type: 'object', properties: { success: { type: 'boolean', example: false }, message: { type: 'string' } } },
      User: { type: 'object', properties: {
        id: { type: 'integer', example: 1 }, name: { type: 'string', example: 'Ana López' },
        email: { type: 'string', example: 'ana@example.com' }, role: { type: 'string', enum: ['admin', 'instructor', 'student'] },
        email_verified_at: { type: 'string', format: 'date-time', nullable: true }
      } },
      CategoryInput: { type: 'object', required: ['name'], properties: { name: { type: 'string', maxLength: 100 }, description: { type: 'string', nullable: true } } },
      CourseInput: { type: 'object', required: ['title', 'price', 'category_id'], properties: {
        title: { type: 'string', maxLength: 200 }, description: { type: 'string', nullable: true },
        price: { type: 'number', minimum: 0 }, category_id: { type: 'integer' }
      } }
    }
  }
};
const outputFile = './swagger-output.json';
const endpointsFiles = [
  './src/app.js',
  './src/routes/userRoutes.js',
  './src/routes/category.routes.js',
  './src/routes/course.routes.js'
];
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Documentación Swagger generada en swagger-output.json');
});
