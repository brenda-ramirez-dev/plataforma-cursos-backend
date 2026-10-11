# Contrato de API REST
## Plataforma de Cursos Backend

**Versión:** 1.0  
**Estado:** Propuesta inicial para revisión del equipo  
**Base URL:** `/api/v1`

## 1. Objetivo

Este documento establece las rutas, métodos HTTP, permisos, formatos de
respuesta y mecanismos de acceso a datos del backend.

Su propósito es que los módulos de usuarios, categorías y cursos puedan
desarrollarse de forma independiente y funcionar de manera compatible.

Las rutas se consideran una propuesta hasta que Brenda, Vane y Tefy
confirmen conjuntamente el contrato.

## 2. Formato de comunicación

Las solicitudes que incluyan un cuerpo deben utilizar:

`Content-Type: application/json`

Las respuestas exitosas utilizarán esta estructura:

{
  "success": true,
  "data": {}
}

Las respuestas de error utilizarán esta estructura:

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos."
  }
}

Los ejemplos muestran la estructura general; `data` contendrá el registro,
la lista o el resultado correspondiente a cada operación.

## 3. Autenticación

Las rutas protegidas utilizarán un token JWT mediante el encabezado:

`Authorization: Bearer <token>`

El token identificará al usuario autenticado y contendrá, como mínimo,
su identificador y la información de autorización acordada por el equipo.

El middleware de autenticación verificará el token antes de permitir
el acceso a las rutas protegidas.

## 4. Módulo de usuarios y autenticación

Responsable: Brenda.

| Operación | Método y ruta | Acceso a datos | Permiso |
|---|---|---|---|
| Iniciar sesión | POST `/api/v1/auth/login` | SQL nativo (`pg`) | Público |
| Consultar perfil | GET `/api/v1/users/me` | SQL nativo (`pg`) | Usuario autenticado |
| Listar usuarios | GET `/api/v1/users` | SQL nativo (`pg`) | Administrador |
| Registrar usuario | POST `/api/v1/users` | Sequelize | Público |
| Actualizar perfil | PUT `/api/v1/users/me` | Sequelize | Propietario del perfil |
| Eliminar usuario | DELETE `/api/v1/users/:id` | Sequelize | Administrador |

### Reglas del módulo

- El login buscará el correo mediante una consulta SQL parametrizada.
- La contraseña se verificará contra su hash, nunca contra texto plano.
- El registro asignará el rol `student` en el servidor.
- El cliente no podrá establecer su propio rol al registrarse.
- Un usuario solo podrá consultar o actualizar su propio perfil.
- El listado y la eliminación de usuarios estarán restringidos a administradores.
- Las respuestas nunca incluirán `password_hash`.
- Los correos se normalizarán a minúsculas.

## 5. Módulo de categorías

Responsable: Vane.

| Operación | Método y ruta | Acceso a datos | Permiso |
|---|---|---|---|
| Listar categorías | GET `/api/v1/categories` | SQL nativo (`pg`) | Público |
| Consultar categoría | GET `/api/v1/categories/:id` | SQL nativo (`pg`) | Público |
| Buscar categorías | GET `/api/v1/categories/search?name=...` | SQL nativo (`pg`) | Público |
| Crear categoría | POST `/api/v1/categories` | Sequelize | Administrador |
| Actualizar categoría | PUT `/api/v1/categories/:id` | Sequelize | Administrador |
| Eliminar categoría | DELETE `/api/v1/categories/:id` | Sequelize | Administrador |

Las rutas de búsqueda deberán declararse antes de las rutas dinámicas
`/:id`, para evitar que la palabra `search` sea interpretada como un ID.

Una categoría asociada a cursos no podrá eliminarse mientras existan
cursos relacionados.

## 6. Módulo de cursos

Responsable: Tefy.

| Operación | Método y ruta | Acceso a datos | Permiso |
|---|---|---|---|
| Listar cursos | GET `/api/v1/courses` | SQL nativo (`pg`) | Público |
| Consultar curso | GET `/api/v1/courses/:id` | SQL nativo (`pg`) | Público |
| Buscar cursos | GET `/api/v1/courses/search?title=...` | SQL nativo (`pg`) | Público |
| Crear curso | POST `/api/v1/courses` | Sequelize | Administrador o instructor |
| Actualizar curso | PUT `/api/v1/courses/:id` | Sequelize | Administrador o creador autorizado |
| Eliminar curso | DELETE `/api/v1/courses/:id` | Sequelize | Administrador o creador autorizado |

Las búsquedas podrán utilizar consultas parametrizadas y las lecturas que
necesiten información de categorías podrán realizar JOIN entre las tablas.

Las rutas `search` deberán declararse antes de `/:id`.

Los permisos de modificación deberán comprobarse en el servidor.

## 7. Códigos de estado HTTP

- `200 OK`: consulta o actualización exitosa.
- `201 Created`: registro creado correctamente.
- `400 Bad Request`: parámetros o datos inválidos.
- `401 Unauthorized`: credenciales inválidas o token ausente/no válido.
- `403 Forbidden`: usuario autenticado sin permisos suficientes.
- `404 Not Found`: registro inexistente.
- `409 Conflict`: conflicto con un registro existente, por ejemplo un correo duplicado.
- `500 Internal Server Error`: error inesperado, sin exponer detalles internos.

Los identificadores de las rutas son enteros positivos. El servidor debe
validarlos antes de consultar PostgreSQL y responder con `400` cuando
el formato sea inválido.

## 8. Reglas de acceso a datos

- Las operaciones de lectura del inventario se implementarán con SQL nativo
  mediante `pg`.
- Las operaciones de escritura se implementarán mediante Sequelize.
- Las consultas SQL deberán utilizar parámetros.
- Los modelos Sequelize deberán coincidir con los nombres y tipos del esquema.
- Los campos `created_at` y `updated_at` deberán mantenerse consistentes.
- No se utilizará `sequelize.sync()` para crear o modificar la estructura
  de tablas; `database/schema.sql` será la fuente de verdad.

## 9. Seguridad

- Las contraseñas se almacenarán usando un algoritmo de hashing apropiado.
- Los secretos estarán en variables de entorno y nunca se subirán al repositorio.
- Las entradas se validarán en el servidor.
- Se aplicará autorización por rol y propiedad del recurso.
- Los errores no expondrán contraseñas, hashes, tokens ni datos de conexión.
- Se aplicarán controles básicos para limitar solicitudes y proteger la API.

## 10. Estado de implementación

Este documento define el contrato propuesto. Las operaciones se marcarán
como implementadas únicamente después de desarrollar sus endpoints y
comprobarlos mediante escenarios de prueba.

Los cambios al contrato deberán revisarse entre las tres integrantes antes
de modificar rutas, campos o formatos de respuesta.
