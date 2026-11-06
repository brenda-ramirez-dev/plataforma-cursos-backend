# Entrega módulo de cursos

## Contenido
- `src/models/Course.js`: modelo Sequelize para la tabla `courses`.
- `src/controllers/course.controller.js`: seis operaciones del módulo.
- `src/routes/course.routes.js`: endpoints `/api/courses`.
- `postman/Plataforma_Cursos.postman_collection.json`: colección de pruebas.
- `docs/Pruebas.docx`: documentación y escenarios.
- `docs/Inventario_operaciones_backend.xlsx`: inventario consolidado.

## Integración
1. Copiar las carpetas `src/models`, `src/controllers` y `src/routes` al proyecto común, conservando los archivos existentes.
2. En `src/server.js`, importar `course.routes` y registrar `app.use('/api/courses', courseRoutes)`. El detalle está en `INTEGRACION-server.js.txt`.
3. Confirmar que `src/config/database.js` exporte `{ sequelize, pool }`, como en el código compartido.
4. Instalar las dependencias del proyecto común si aún no están: `express`, `pg`, `sequelize`, `dotenv`, `jsonwebtoken`, `cors`, `morgan`.
5. Crear `.env` a partir de `.env.example` y colocar las credenciales reales. No subir `.env` al repositorio.
6. Crear la base con `database/schema.sql` y ejecutar `database/seed.sql` después.
7. Iniciar el backend y probar primero `GET /api/courses`, que es público.

## Endpoints
- `GET /api/courses` — listar cursos.
- `GET /api/courses/:id` — consultar un curso.
- `GET /api/courses/search?q=sql&category_id=2&min_price=10&max_price=60` — buscar/filtrar.
- `POST /api/courses` — crear, requiere `Authorization: Bearer TOKEN`.
- `PUT /api/courses/:id` — actualizar, requiere token.
- `DELETE /api/courses/:id` — eliminar, requiere token.

## Decisiones y límites
Las lecturas usan SQL nativo mediante `pg`; las escrituras usan Sequelize, siguiendo el reparto acordado. La creación guarda `created_by` desde `req.user.id` si el token incluye `id`; si no, queda nulo. Las rutas de escritura solo exigen un JWT porque ese es el patrón existente de categorías. Antes de producción, el equipo debe confirmar si también requiere autorización por rol. No se han ejecutado pruebas contra una base real desde este paquete; los casos de prueba son una guía para ejecutar en el entorno integrado.
