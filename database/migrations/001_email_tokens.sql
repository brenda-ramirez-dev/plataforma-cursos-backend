BEGIN;

-- Fecha de confirmación del correo del usuario.
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Conservamos como verificadas las cuentas que ya existían.
UPDATE users
SET email_verified_at = created_at
WHERE email_verified_at IS NULL;

-- Almacena los tokens de confirmación y recuperación.
CREATE TABLE IF NOT EXISTS user_action_tokens (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id INTEGER NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,

    token_hash CHAR(64) NOT NULL UNIQUE,

    purpose VARCHAR(30) NOT NULL
        CHECK (purpose IN ('verify_email', 'reset_password')),

    expires_at TIMESTAMPTZ NOT NULL,

    used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_action_tokens_user_purpose
ON user_action_tokens(user_id, purpose);

CREATE INDEX IF NOT EXISTS idx_user_action_tokens_expires
ON user_action_tokens(expires_at);

COMMIT;
