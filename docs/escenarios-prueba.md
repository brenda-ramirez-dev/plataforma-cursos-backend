# Escenarios de prueba — Usuarios y autenticación

## Entorno

- Node.js: v22.22.2
- PostgreSQL: 18.6
- Base de datos: cursos_db_test
- Framework: Express
- Acceso a datos: pg y Sequelize

## Resultados de las pruebas

| ID | Escenario | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| P01 | Registrar un usuario con datos válidos | HTTP 201 | Correcto |
| P02 | Iniciar sesión con credenciales válidas | HTTP 200 y JWT | Correcto |
| P03 | Consultar perfil con token válido | HTTP 200 | Correcto |
| P04 | Consultar perfil sin token | HTTP 401 | Correcto |
| P05 | Actualizar el perfil propio | HTTP 200 | Correcto |
| P06 | Un estudiante intenta listar usuarios | HTTP 403 | Correcto |
| P07 | Administrador lista usuarios | HTTP 200 | Correcto |
| P08 | La respuesta de usuario no expone el hash | Hash ausente | Correcto |
| P09 | Administrador elimina usuario de prueba | HTTP 200 | Correcto |
| P10 | Consultar perfil después de eliminar la cuenta | HTTP 404 | Correcto |

## Pruebas de base de datos

- Se crearon las tablas users, categories y courses.
- Se insertaron cuatro categorías y seis cursos.
- Se comprobó que repetir el seed no duplica registros.
- Se verificaron las relaciones entre cursos y categorías mediante JOIN.
- Se creó el usuario administrador utilizando Argon2.
- Se comprobó que volver a ejecutar el script no duplica al administrador.

## Observaciones

Las pruebas se ejecutaron manualmente en el entorno local de desarrollo.
Los resultados deben volver a verificarse después de integrar los módulos
del equipo en la rama develop.

La integración completa y las pruebas de categorías y cursos quedan pendientes
de consolidación con las responsables de esos módulos.
