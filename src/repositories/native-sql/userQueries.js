'use strict';

function createUserQueries(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('Se requiere una conexión PostgreSQL válida.');
  }

  return {
    // Consulta interna para verificar las credenciales durante el login.
    async findByEmailForAuthentication(email) {
      const normalizedEmail = String(email || '').trim().toLowerCase();

      if (!normalizedEmail) {
        return null;
      }

      const { rows } = await pool.query(
        `SELECT id, name, email, password_hash, role
         FROM users
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [normalizedEmail]
      );

      return rows[0] ?? null;
    },

    // Consulta del perfil. No devuelve password_hash.
    async findProfileById(id) {
      const { rows } = await pool.query(
        `SELECT id, name, email, role, created_at, updated_at
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [id]
      );

      return rows[0] ?? null;
    },

    // Listado de usuarios sin exponer hashes de contraseñas.
    async listUsers() {
      const { rows } = await pool.query(
        `SELECT id, name, email, role, created_at, updated_at
         FROM users
         ORDER BY id ASC`
      );

      return rows;
    }
  };
}

module.exports = createUserQueries;
