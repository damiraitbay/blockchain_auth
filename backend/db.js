import pg from 'pg';

/** @type {pg.Pool | null} */
let pool = null;

export function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error('DATABASE_URL is not set. Start Postgres and configure .env (see .env.example).');
    }
    pool = new pg.Pool({
      connectionString: url,
      max: Number(process.env.PG_POOL_MAX || 20),
      idleTimeoutMillis: 30_000
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function dbHealth() {
  const p = getPool();
  await p.query('SELECT 1 AS ok');
  return true;
}

function mapUser(row) {
  if (!row) return null;
  return {
    address: row.address,
    displayName: row.display_name,
    bio: row.bio,
    role: row.role || 'user',
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapSession(row) {
  if (!row) return null;
  return {
    jti: typeof row.jti === 'string' ? row.jti : row.jti.toString(),
    address: row.address,
    tokenHash: row.token_hash,
    createdAt: row.created_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    lastUsedAt: row.last_used_at ? row.last_used_at.toISOString() : null,
    revokedAt: row.revoked_at ? row.revoked_at.toISOString() : null
  };
}

export async function upsertNonce({ address, nonce, chainId, message, issuedAt, expiresAt }) {
  const p = getPool();
  await p.query(
    `INSERT INTO auth_nonces (address, nonce, chain_id, message, issued_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (address) DO UPDATE SET
       nonce = EXCLUDED.nonce,
       chain_id = EXCLUDED.chain_id,
       message = EXCLUDED.message,
       issued_at = EXCLUDED.issued_at,
       expires_at = EXCLUDED.expires_at`,
    [address, nonce, chainId, message, issuedAt, expiresAt]
  );
}

export async function getNonce(address) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT address, nonce, chain_id AS "chainId", message, issued_at AS "issuedAt", expires_at AS "expiresAt"
     FROM auth_nonces WHERE address = $1`,
    [address]
  );
  const row = rows[0];
  if (!row) return null;
  return {
    nonce: row.nonce,
    chainId: row.chainId,
    message: row.message,
    issuedAt: row.issuedAt.toISOString(),
    expiresAt: row.expiresAt.toISOString()
  };
}

export async function deleteNonce(address) {
  const p = getPool();
  await p.query('DELETE FROM auth_nonces WHERE address = $1', [address]);
}

export async function getUser(address) {
  const p = getPool();
  const { rows } = await p.query('SELECT * FROM users WHERE address = $1', [address]);
  return mapUser(rows[0]);
}

export async function updateProfile(address, { displayName, bio }) {
  const p = getPool();
  const { rows } = await p.query(
    `UPDATE users
     SET display_name = $2, bio = $3, updated_at = NOW()
     WHERE address = $1
     RETURNING *`,
    [address, displayName, bio]
  );
  return mapUser(rows[0]);
}

export async function revokeAllSessionsForAddress(address) {
  const p = getPool();
  await p.query(
    `UPDATE refresh_sessions SET revoked_at = NOW()
     WHERE address = $1 AND revoked_at IS NULL`,
    [address]
  );
}

export async function getSessionByJti(jti) {
  const p = getPool();
  const { rows } = await p.query('SELECT * FROM refresh_sessions WHERE jti = $1::uuid', [jti]);
  return mapSession(rows[0]);
}

export async function countActiveSessionsForAddress(address) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT COUNT(*)::int AS c FROM refresh_sessions
     WHERE address = $1 AND revoked_at IS NULL AND expires_at > NOW()`,
    [address]
  );
  return rows[0].c;
}

export async function listActiveSessionsForAddress(address) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT * FROM refresh_sessions
     WHERE address = $1 AND revoked_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC`,
    [address]
  );
  return rows.map(mapSession);
}

export async function revokeSessionByJti(jti) {
  const p = getPool();
  const { rowCount } = await p.query(
    `UPDATE refresh_sessions SET revoked_at = NOW() WHERE jti = $1::uuid AND revoked_at IS NULL`,
    [jti]
  );
  return rowCount > 0;
}

/**
 * Authenticate: remove nonce, ensure user, revoke refresh sessions, insert new session — one transaction.
 */
export async function transactionAuthenticate({
  address,
  session: { jti, tokenHash, expiresAt },
  clientIp = null,
  userAgent = null
}) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM auth_nonces WHERE address = $1', [address]);
    await client.query(
      `INSERT INTO users (address) VALUES ($1) ON CONFLICT (address) DO NOTHING`,
      [address]
    );
    await client.query(
      `UPDATE refresh_sessions SET revoked_at = NOW()
       WHERE address = $1 AND revoked_at IS NULL`,
      [address]
    );
    const exp = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    await client.query(
      `INSERT INTO refresh_sessions (jti, address, token_hash, created_at, expires_at, last_used_at, revoked_at, client_ip, user_agent)
       VALUES ($1::uuid, $2, $3, NOW(), $4, NULL, NULL, $5, $6)`,
      [jti, address, tokenHash, exp, clientIp, userAgent]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Refresh: mark old session revoked, insert new — one transaction.
 */
export async function transactionRefreshRotate({
  oldJti,
  address,
  session: { jti, tokenHash, expiresAt },
  clientIp = null,
  userAgent = null
}) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE refresh_sessions
       SET revoked_at = NOW(), last_used_at = NOW()
       WHERE jti = $1::uuid`,
      [oldJti]
    );
    const exp = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    await client.query(
      `INSERT INTO refresh_sessions (jti, address, token_hash, created_at, expires_at, last_used_at, revoked_at, client_ip, user_agent)
       VALUES ($1::uuid, $2, $3, NOW(), $4, NULL, NULL, $5, $6)`,
      [jti, address, tokenHash, exp, clientIp, userAgent]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function cleanupExpired() {
  const p = getPool();
  await p.query('DELETE FROM auth_nonces WHERE expires_at < NOW()');
  await p.query('DELETE FROM refresh_sessions WHERE expires_at < NOW() OR revoked_at IS NOT NULL');
  await p.query(`DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '365 days'`);
}

export async function getStats() {
  const p = getPool();
  const [users, nonces] = await Promise.all([
    p.query('SELECT COUNT(*)::int AS c FROM users'),
    p.query('SELECT COUNT(*)::int AS c FROM auth_nonces WHERE expires_at > NOW()')
  ]);
  return {
    users: users.rows[0].c,
    activeChallenges: nonces.rows[0].c
  };
}

export async function setUserRole(address, role) {
  const p = getPool();
  await p.query(`UPDATE users SET role = $2, updated_at = NOW() WHERE address = $1`, [address, role]);
}

export async function insertNotification({ address, kind, title, body, metadata = {} }) {
  const p = getPool();
  const { rows } = await p.query(
    `INSERT INTO notifications (address, kind, title, body, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, kind, title, body, metadata, read_at, created_at`,
    [address, kind, title, body || null, JSON.stringify(metadata)]
  );
  const r = rows[0];
  return {
    id: r.id.toString(),
    kind: r.kind,
    title: r.title,
    body: r.body,
    metadata: r.metadata,
    readAt: r.read_at ? r.read_at.toISOString() : null,
    createdAt: r.created_at.toISOString()
  };
}

export async function listNotifications(address, { limit = 50, unreadOnly = false } = {}) {
  const p = getPool();
  const unreadClause = unreadOnly ? 'AND read_at IS NULL' : '';
  const { rows } = await p.query(
    `SELECT id, kind, title, body, metadata, read_at, created_at
     FROM notifications
     WHERE address = $1 ${unreadClause}
     ORDER BY created_at DESC
     LIMIT $2`,
    [address, limit]
  );
  return rows.map((r) => ({
    id: r.id.toString(),
    kind: r.kind,
    title: r.title,
    body: r.body,
    metadata: r.metadata,
    readAt: r.read_at ? r.read_at.toISOString() : null,
    createdAt: r.created_at.toISOString()
  }));
}

export async function countUnreadNotifications(address) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT COUNT(*)::int AS c FROM notifications WHERE address = $1 AND read_at IS NULL`,
    [address]
  );
  return rows[0].c;
}

export async function markNotificationRead(id, address) {
  const p = getPool();
  const { rowCount } = await p.query(
    `UPDATE notifications SET read_at = NOW()
     WHERE id = $1::uuid AND address = $2 AND read_at IS NULL`,
    [id, address]
  );
  return rowCount > 0;
}

export async function markAllNotificationsRead(address) {
  const p = getPool();
  await p.query(`UPDATE notifications SET read_at = NOW() WHERE address = $1 AND read_at IS NULL`, [
    address
  ]);
}

export async function getExportBundle(address) {
  const p = getPool();
  const [user, notifications, sessions, chatRows] = await Promise.all([
    p.query('SELECT * FROM users WHERE address = $1', [address]),
    p.query(
      `SELECT id, kind, title, body, metadata, read_at, created_at FROM notifications WHERE address = $1 ORDER BY created_at DESC`,
      [address]
    ),
    p.query(
      `SELECT jti, created_at, expires_at, last_used_at, client_ip, user_agent
       FROM refresh_sessions WHERE address = $1 AND revoked_at IS NULL AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [address]
    ),
    listChatMessagesForExport(address)
  ]);
  const u = user.rows[0];
  return {
    user: u ? mapUser(u) : null,
    notifications: notifications.rows.map((r) => ({
      id: String(r.id),
      kind: String(r.kind ?? ''),
      title: r.title != null ? String(r.title) : '',
      body: r.body != null ? String(r.body) : '',
      metadata: r.metadata,
      readAt: r.read_at ? r.read_at.toISOString() : null,
      createdAt: r.created_at.toISOString()
    })),
    activeSessions: sessions.rows.map((r) => ({
      jti: r.jti.toString(),
      createdAt: r.created_at.toISOString(),
      expiresAt: r.expires_at.toISOString(),
      lastUsedAt: r.last_used_at ? r.last_used_at.toISOString() : null,
      clientIp: r.client_ip,
      userAgent: r.user_agent
    })),
    chatMessages: chatRows,
    exportedAt: new Date().toISOString()
  };
}

export async function deleteAccount(address) {
  const p = getPool();
  const client = await p.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM auth_nonces WHERE address = $1', [address]);
    await client.query('DELETE FROM users WHERE address = $1', [address]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

const CHAT_BODY_MAX = 4000;

export async function listChatConversations(address) {
  const p = getPool();
  const last = await p.query(
    `WITH t AS (
       SELECT
         id,
         sender_address,
         recipient_address,
         body,
         created_at,
         CASE WHEN sender_address = $1 THEN recipient_address ELSE sender_address END AS peer,
         ROW_NUMBER() OVER (
           PARTITION BY LEAST(sender_address, recipient_address), GREATEST(sender_address, recipient_address)
           ORDER BY created_at DESC
         ) AS rk
       FROM chat_messages
       WHERE sender_address = $1 OR recipient_address = $1
     )
     SELECT id, sender_address, recipient_address, body, created_at, peer
     FROM t WHERE rk = 1
     ORDER BY created_at DESC`,
    [address]
  );
  const unread = await p.query(
    `SELECT sender_address, COUNT(*)::int AS c
     FROM chat_messages
     WHERE recipient_address = $1 AND read_at IS NULL
     GROUP BY sender_address`,
    [address]
  );
  const unreadMap = Object.fromEntries(unread.rows.map((r) => [r.sender_address, r.c]));
  return last.rows.map((r) => ({
    peer: r.peer,
    lastMessage: {
      id: r.id.toString(),
      body: r.body,
      createdAt: r.created_at.toISOString(),
      fromMe: r.sender_address === address
    },
    unreadCount: unreadMap[r.peer] || 0
  }));
}

export async function listChatMessages(me, peer, { limit = 100 } = {}) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT id, sender_address, recipient_address, body, read_at, created_at
     FROM chat_messages
     WHERE (sender_address = $1 AND recipient_address = $2)
        OR (sender_address = $2 AND recipient_address = $1)
     ORDER BY created_at ASC
     LIMIT $3`,
    [me, peer, limit]
  );
  return rows.map((r) => ({
    id: r.id.toString(),
    senderAddress: r.sender_address,
    recipientAddress: r.recipient_address,
    body: r.body,
    readAt: r.read_at ? r.read_at.toISOString() : null,
    createdAt: r.created_at.toISOString()
  }));
}

export async function sendChatMessage({ from, to, body }) {
  const trimmed = String(body ?? '').trim();
  if (!trimmed || trimmed.length > CHAT_BODY_MAX) {
    throw new Error(`message body must be 1–${CHAT_BODY_MAX} characters`);
  }
  if (from === to) throw new Error('cannot message yourself');
  const p = getPool();
  const [u1, u2] = await Promise.all([getUser(from), getUser(to)]);
  if (!u1 || !u2) throw new Error('recipient or sender not registered');
  const { rows } = await p.query(
    `INSERT INTO chat_messages (sender_address, recipient_address, body)
     VALUES ($1, $2, $3)
     RETURNING id, created_at`,
    [from, to, trimmed]
  );
  return {
    id: rows[0].id.toString(),
    createdAt: rows[0].created_at.toISOString()
  };
}

export async function markChatRead(recipient, senderPeer) {
  const p = getPool();
  await p.query(
    `UPDATE chat_messages SET read_at = NOW()
     WHERE recipient_address = $1 AND sender_address = $2 AND read_at IS NULL`,
    [recipient, senderPeer]
  );
}

export async function listChatMessagesForExport(address) {
  const p = getPool();
  const { rows } = await p.query(
    `SELECT id, sender_address, recipient_address, body, read_at, created_at
     FROM chat_messages
     WHERE sender_address = $1 OR recipient_address = $1
     ORDER BY created_at ASC`,
    [address]
  );
  return rows.map((r) => ({
    id: r.id.toString(),
    senderAddress: r.sender_address,
    recipientAddress: r.recipient_address,
    body: r.body,
    readAt: r.read_at ? r.read_at.toISOString() : null,
    createdAt: r.created_at.toISOString()
  }));
}

export async function getAdminDashboardStats() {
  const p = getPool();
  const [
    users,
    admins,
    sessions,
    notifs24h,
    notifsUnread
  ] = await Promise.all([
    p.query('SELECT COUNT(*)::int AS c FROM users'),
    p.query(`SELECT COUNT(*)::int AS c FROM users WHERE role = 'admin'`),
    p.query(
      `SELECT COUNT(*)::int AS c FROM refresh_sessions WHERE revoked_at IS NULL AND expires_at > NOW()`
    ),
    p.query(`SELECT COUNT(*)::int AS c FROM notifications WHERE created_at > NOW() - INTERVAL '24 hours'`),
    p.query(`SELECT COUNT(*)::int AS c FROM notifications WHERE read_at IS NULL`)
  ]);
  return {
    totalUsers: users.rows[0].c,
    adminUsers: admins.rows[0].c,
    activeRefreshSessions: sessions.rows[0].c,
    notificationsLast24h: notifs24h.rows[0].c,
    unreadNotificationsTotal: notifsUnread.rows[0].c
  };
}
