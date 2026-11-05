'use strict';

function createActionTokenQueries(pool) {
  if (!pool || typeof pool.query !== 'function') {
    throw new TypeError('Se requiere una conexión PostgreSQL válida.');
  }

  return {
    async create({ userId, tokenHash, purpose, expiresAt }) {
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Invalida los tokens anteriores del mismo tipo.
        await client.query(
          `UPDATE user_action_tokens
           SET used_at = CURRENT_TIMESTAMP
           WHERE user_id = $1
             AND purpose = $2
             AND used_at IS NULL`,
          [userId, purpose]
        );

        // Guarda el nuevo token dentro de la transacción.
        await client.query(
          `INSERT INTO user_action_tokens
            (user_id, token_hash, purpose, expires_at)
           VALUES ($1, $2, $3, $4)`,
          [userId, tokenHash, purpose, expiresAt]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },

    async confirmEmail(tokenHash) {
      const { rows } = await pool.query(
        `WITH consumed AS (
          UPDATE user_action_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE token_hash = $1
            AND purpose = 'verify_email'
            AND used_at IS NULL
            AND expires_at > CURRENT_TIMESTAMP
          RETURNING user_id
        )
        UPDATE users
        SET email_verified_at = COALESCE(
              email_verified_at,
              CURRENT_TIMESTAMP
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT user_id FROM consumed)
        RETURNING id, email, email_verified_at`,
        [tokenHash]
      );

      return rows[0] ?? null;
    },

    async resetPassword(tokenHash, passwordHash) {
      const { rows } = await pool.query(
        `WITH consumed AS (
          UPDATE user_action_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE token_hash = $1
            AND purpose = 'reset_password'
            AND used_at IS NULL
            AND expires_at > CURRENT_TIMESTAMP
          RETURNING user_id
        )
        UPDATE users
        SET password_hash = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT user_id FROM consumed)
        RETURNING id`,
        [tokenHash, passwordHash]
      );

      return rows[0] ?? null;
    },
  };
}

module.exports = createActionTokenQueries;
