-- database/seed.sql
-- Ejecutar después de schema.sql.
-- Datos iniciales para pruebas.
-- No incluye usuarios ni contraseñas.

INSERT INTO categories (name, description) VALUES
    ('Programación Web',
     'Desarrollo web frontend y backend.'),
    ('Bases de Datos',
     'Diseño y administración de bases de datos relacionales.'),
    ('Cloud y DevOps',
     'Infraestructura en la nube y automatización de despliegues.'),
    ('Seguridad',
     'Buenas prácticas de seguridad en aplicaciones.')
ON CONFLICT (name) DO NOTHING;


INSERT INTO courses (title, description, price, category_id)
SELECT
    v.title,
    v.description,
    v.price,
    c.id
FROM (
    VALUES
        ('Desarrollo Backend con Node.js',
         'Creación de APIs REST con Express.',
         49.99,
         'Programación Web'),

        ('Introducción a JavaScript',
         'Fundamentos de programación para aplicaciones web.',
         19.99,
         'Programación Web'),

        ('PostgreSQL desde cero',
         'Modelado y consultas SQL relacionales.',
         39.99,
         'Bases de Datos'),

        ('SQL avanzado con PostgreSQL',
         'JOIN, índices y consultas de mayor complejidad.',
         59.99,
         'Bases de Datos'),

        ('Despliegue de APIs en AWS',
         'Publicación de servicios backend en la nube.',
         69.99,
         'Cloud y DevOps'),

        ('Seguridad en APIs REST',
         'Validación de datos y protección de endpoints.',
         44.99,
         'Seguridad')
) AS v(title, description, price, category_name)
JOIN categories c
    ON c.name = v.category_name
WHERE NOT EXISTS (
    SELECT 1
    FROM courses existing
    WHERE existing.title = v.title
      AND existing.category_id = c.id
);
