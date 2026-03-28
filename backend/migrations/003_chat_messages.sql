-- Direct messages between registered users (by Ethereum address)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_address VARCHAR(42) NOT NULL REFERENCES users (address) ON DELETE CASCADE,
  recipient_address VARCHAR(42) NOT NULL REFERENCES users (address) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_not_self CHECK (sender_address <> recipient_address)
);

CREATE INDEX IF NOT EXISTS idx_chat_pair_time ON chat_messages (
  LEAST(sender_address, recipient_address),
  GREATEST(sender_address, recipient_address),
  created_at DESC
);

CREATE INDEX IF NOT EXISTS idx_chat_recipient_unread
  ON chat_messages (recipient_address)
  WHERE read_at IS NULL;
