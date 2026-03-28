-- Roles
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_role_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Session client hints (for security notifications)
ALTER TABLE refresh_sessions
  ADD COLUMN IF NOT EXISTS client_ip VARCHAR(128),
  ADD COLUMN IF NOT EXISTS user_agent TEXT;

-- In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address VARCHAR(42) NOT NULL REFERENCES users (address) ON DELETE CASCADE,
  kind VARCHAR(64) NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_address_created
  ON notifications (address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (address)
  WHERE read_at IS NULL;
