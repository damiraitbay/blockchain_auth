-- Users identified by checksummed Ethereum address
CREATE TABLE IF NOT EXISTS users (
  address VARCHAR(42) PRIMARY KEY,
  display_name VARCHAR(60) NOT NULL DEFAULT '',
  bio VARCHAR(240) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sign-in challenges: created before a users row exists (GET /api/nonce)
CREATE TABLE IF NOT EXISTS auth_nonces (
  address VARCHAR(42) PRIMARY KEY,
  nonce VARCHAR(32) NOT NULL,
  chain_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_nonces_expires ON auth_nonces (expires_at);

-- Refresh token sessions (rotation)
CREATE TABLE IF NOT EXISTS refresh_sessions (
  jti UUID PRIMARY KEY,
  address VARCHAR(42) NOT NULL REFERENCES users (address) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_refresh_sessions_address_active
  ON refresh_sessions (address)
  WHERE revoked_at IS NULL;
