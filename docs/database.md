# Documentación de la base de datos

## 1. Objetivo

Este documento describe el modelo relacional inicial de la Plataforma de Cursos
y las instrucciones para preparar la base de datos PostgreSQL utilizada por el
backend.

El esquema se encuentra en `database/schema.sql`, mientras que los datos
iniciales de prueba se encuentran en `database/seed.sql`.

## 2. Tecnologías

- PostgreSQL: almacenamiento relacional.
- Node.js y Express: servicios web del backend.
- pg: ejecución de consultas SQL nativas.
- Sequelize: operaciones de acceso a datos mediante ORM.

El archivo `schema.sql` es la fuente de verdad para la estructura de la base
de datos. No se utilizará `sequelize.sync()` para crear, alterar o eliminar
automáticamente las tablas.

## 3. Tablas principales

### 3.1. users

Almacena las cuentas de los usuarios del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| id | INTEGER | Clave primaria autogenerada |
| name | VARCHAR(100) | Nombre del usuario |
| email | VARCHAR(150) | Correo electrónico |
| password_hash | VARCHAR(255) | Hash seguro de la contraseña |
| role | VARCHAR(20) | Rol: admin, instructor o student |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de última actualización |

El correo electrónico debe normalizarse a minúsculas antes de almacenarse.
Existe un índice único basado en `LOWER(email)` para evitar duplicados que
solo difieran por mayúsculas y minúsculas.

Las contraseñas no deben almacenarse en texto plano. El backend utilizará
una biblioteca de hashing de contraseñas compatible con el registro y el login.

### 3.2. categories

Contiene las categorías con las que se clasifican los cursos.

| Campo | Tipo | Descripción |
|---|---|---|
| id | INTEGER | Clave primaria autogenerada |
| name | VARCHAR(100) | Nombre único de la categoría |
| description | TEXT | Descripción de la categoría |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de última actualización |

El nombre de la categoría es único y obligatorio.

### 3.3. courses

Almacena la información básica de los cursos.

| Campo | Tipo | Descripción |
|---|---|---|
| id | INTEGER | Clave primaria autogenerada |
| title | VARCHAR(200) | Título del curso |
| description | TEXT | Descripción del curso |
| price | NUMERIC(10,2) | Precio no negativo |
| category_id | INTEGER | Clave foránea hacia categories |
| created_by | INTEGER | Clave foránea hacia users, opcional |
| created_at | TIMESTAMPTZ | Fecha de creación |
| updated_at | TIMESTAMPTZ | Fecha de última actualización |

Cada curso debe pertenecer a una categoría existente. La categoría no puede
eliminarse mientras tenga cursos relacionados.

Si se elimina un usuario creador, el curso se conserva y `created_by` pasa
a ser NULL.

## 4. Relaciones

- Una categoría puede tener varios cursos.
- Cada curso pertenece a una categoría.
- Un usuario puede crear varios cursos.
- Un curso puede conservarse aunque se elimine su usuario creador.

Las relaciones se implementan mediante claves foráneas en PostgreSQL.

## 5. Preparación de la base de datos

Los siguientes comandos se ejecutan desde la raíz del repositorio, con
PostgreSQL instalado y accesible.

### 5.1. Crear una base de datos de desarrollo

```bash
createdb cursos_db
