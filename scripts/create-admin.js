// scripts/create-admin.js
require('dotenv').config();

const { Pool } = require('pg');
const argon2 = require('argon2');

async function createAdmin() {
  const {
    DATABASE_URL,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
    ADMIN_NAME = 'Admin Sistema'
  } = process.env;

  const email = (ADMIN_EMAIL || '').trim().toLowerCase();

  if (!DATABASE_URL || !email || !ADMIN_PASSWORD ||
      ADMIN_PASSWORD.length < 12) {
    throw new Error(
      'Configura DATABASE_URL, ADMIN_EMAIL y ADMIN_PASSWORD ' +
      '(mínimo 12 caracteres) en .env.'
    );
  }

  const pool = new Pool({
    connectionString: DATABASE_URL
  });

  try {
    const passwordHash = await argon2.hash(ADMIN_PASSWORD);

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT DO NOTHING
       RETURNING id, name, email, role`,
      [ADMIN_NAME, email, passwordHash]
    );

    if (rows.length > 0) {
      console.log('Administrador creado:', rows[0]);
    } else {
      console.log('Ya existe un usuario con ese correo; sin cambios.');
    }
  } finally {
    await pool.end();
  }
}

createAdmin().catch((error) => {
  console.error('Error al crear el administrador:', error.message);
  process.exitCode = 1;
});
