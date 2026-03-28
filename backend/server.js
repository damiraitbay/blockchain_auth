import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
  cleanupExpired,
  countActiveSessionsForAddress,
  dbHealth,
  deleteAccount,
  getAdminDashboardStats,
  getExportBundle,
  getNonce,
  getPool,
  getSessionByJti,
  getStats,
  getUser,
  insertNotification,
  listActiveSessionsForAddress,
  listNotifications,
  listChatConversations,
  listChatMessages,
  sendChatMessage,
  markChatRead,
  markAllNotificationsRead,
  markNotificationRead,
  countUnreadNotifications,
  revokeAllSessionsForAddress,
  revokeSessionByJti,
  setUserRole,
  transactionAuthenticate,
  transactionRefreshRotate,
  updateProfile,
  upsertNonce,
  closePool
} from './db.js';
import { bundleToCsv } from './exportCsv.js';
import { runGeminiAssistant } from './geminiAssistant.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'blockchain-secret';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '15m';
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || '7d';
const NONCE_TTL_SECONDS = Number(process.env.NONCE_TTL_SECONDS || 300);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 80);
const APP_DOMAIN = process.env.APP_DOMAIN || 'localhost';
function normalizeOrigin(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.host}`;
  } catch {
    return s.replace(/\/+$/, '');
  }
}

const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

const ADMIN_ADDRESSES = new Set(
  (process.env.ADMIN_ADDRESSES || '')
    .split(',')
    .map((a) => a.trim())
    .filter(Boolean)
    .map((a) => {
      try {
        return ethers.getAddress(a);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
);

const NODE_ENV = process.env.NODE_ENV || 'development';

if (NODE_ENV === 'production' && (!process.env.JWT_SECRET || JWT_SECRET === 'blockchain-secret')) {
  console.error('FATAL: set a strong JWT_SECRET in production.');
  process.exit(1);
}

const rateBuckets = new Map();

// same-origin по умолчанию ломает fetch с Vercel → Render; для публичного API нужен cross-origin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const localPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
      const reqOrigin = normalizeOrigin(origin);
      if (localPattern.test(origin) || CORS_ORIGINS.includes(reqOrigin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    }
  })
);
app.use(express.json({ limit: '128kb' }));
app.use(rateLimitMiddleware);

function getIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function rateLimitMiddleware(req, res, next) {
  const ip = getIp(req);
  const key = `${ip}:${req.method}:${req.path}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.startedAt >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: 'Too many requests, slow down and retry shortly.'
    });
  }

  bucket.count += 1;
  return next();
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function getExpiryFromToken(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== 'object' || typeof decoded.exp !== 'number') {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(decoded.exp * 1000).toISOString();
}

function publicUserView(user) {
  return {
    address: user.address,
    displayName: user.displayName,
    bio: user.bio,
    role: user.role || 'user',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function publicSessionView(session) {
  return {
    jti: session.jti,
    createdAt: session.createdAt,
    lastUsedAt: session.lastUsedAt,
    expiresAt: session.expiresAt
  };
}

function createNonce() {
  return crypto.randomInt(100000, 999999).toString();
}

function buildAuthMessage({ address, nonce, chainId, issuedAt, expirationTime, origin }) {
  const uri = origin || `http://${APP_DOMAIN}:${PORT}`;
  return [
    `${APP_DOMAIN} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign this message to authenticate with Blockchain Auth MVP.',
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`
  ].join('\n');
}

function createAccessToken(address, role = 'user') {
  return jwt.sign({ sub: address, type: 'access', role: role || 'user' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES
  });
}

function createRefreshToken(address, jti) {
  return jwt.sign({ sub: address, type: 'refresh', jti }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES
  });
}

function createRefreshPair(address) {
  const jti = crypto.randomUUID();
  const refreshToken = createRefreshToken(address, jti);
  const expiresAt = getExpiryFromToken(refreshToken);
  return {
    jti,
    refreshToken,
    tokenHash: sha256(refreshToken),
    expiresAt
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'authorization header missing' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || payload.type !== 'access' || !payload.sub) {
      return res.status(401).json({ error: 'invalid access token' });
    }
    req.user = { address: payload.sub, role: payload.role || 'user' };
    return next();
  } catch {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'admin access required' });
  }
  return next();
}

app.get('/api/health', async (_req, res) => {
  try {
    await cleanupExpired();
    await dbHealth();
    const stats = await getStats();
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      users: stats.users,
      activeChallenges: stats.activeChallenges
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      database: error.message || 'unavailable'
    });
  }
});

app.get('/api/nonce', async (req, res) => {
  await cleanupExpired();
  const { address } = req.query;
  const chainIdValue = String(req.query.chainId || '1');

  if (!address) {
    return res.status(400).json({ error: 'address parameter is required' });
  }

  if (!/^\d+$/.test(chainIdValue)) {
    return res.status(400).json({ error: 'chainId must be a numeric value' });
  }

  try {
    const checksum = ethers.getAddress(String(address));
    const now = new Date();
    const issuedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + NONCE_TTL_SECONDS * 1000).toISOString();
    const nonce = createNonce();
    const message = buildAuthMessage({
      address: checksum,
      nonce,
      chainId: Number(chainIdValue),
      issuedAt,
      expirationTime: expiresAt,
      origin: req.headers.origin
    });

    await upsertNonce({
      address: checksum,
      nonce,
      chainId: Number(chainIdValue),
      message,
      issuedAt,
      expiresAt
    });

    return res.json({
      nonce,
      chainId: Number(chainIdValue),
      message,
      expiresAt
    });
  } catch {
    return res.status(400).json({ error: 'invalid wallet address' });
  }
});

app.post('/api/authenticate', async (req, res) => {
  await cleanupExpired();
  const { address, signature } = req.body || {};

  if (!address || !signature) {
    return res.status(400).json({ error: 'address and signature are required' });
  }

  try {
    const checksum = ethers.getAddress(String(address));
    const challenge = await getNonce(checksum);
    if (!challenge) {
      return res.status(400).json({ error: 'nonce not found or expired, request a new nonce' });
    }

    if (new Date(challenge.expiresAt).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'nonce expired, request a new one' });
    }

    const recovered = ethers.verifyMessage(challenge.message, signature);
    if (recovered.toLowerCase() !== checksum.toLowerCase()) {
      return res.status(401).json({ error: 'signature verification failed' });
    }

    const prevSessionCount = await countActiveSessionsForAddress(checksum);
    const clientIp = getIp(req);
    const userAgent = String(req.headers['user-agent'] || '').slice(0, 2000);

    const refreshPair = createRefreshPair(checksum);
    await transactionAuthenticate({
      address: checksum,
      session: {
        jti: refreshPair.jti,
        tokenHash: refreshPair.tokenHash,
        expiresAt: refreshPair.expiresAt
      },
      clientIp,
      userAgent
    });

    if (ADMIN_ADDRESSES.has(checksum)) {
      await setUserRole(checksum, 'admin');
    }

    const user = await getUser(checksum);
    if (!user) {
      return res.status(500).json({ error: 'user persistence failed' });
    }

    const token = createAccessToken(checksum, user.role);

    if (prevSessionCount > 0) {
      await insertNotification({
        address: checksum,
        kind: 'login_new_device',
        title: 'Новый вход в аккаунт',
        body: `Обнаружен вход, пока у вас были другие активные сессии. IP: ${clientIp}`,
        metadata: {
          ip: clientIp,
          userAgent,
          endedOtherSessions: prevSessionCount
        }
      });
    }

    return res.json({ token, refreshToken: refreshPair.refreshToken, user: publicUserView(user) });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'authentication failed' });
  }
});

app.post('/api/refresh', async (req, res) => {
  await cleanupExpired();
  const { refreshToken } = req.body || {};

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken is required' });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET);
    if (!payload || payload.type !== 'refresh' || !payload.sub || !payload.jti) {
      return res.status(401).json({ error: 'invalid refresh token' });
    }

    const session = await getSessionByJti(payload.jti);
    if (!session || session.revokedAt || session.tokenHash !== sha256(refreshToken)) {
      return res.status(401).json({ error: 'invalid refresh session' });
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'refresh token expired' });
    }

    const user = await getUser(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'user not found' });
    }

    const nextPair = createRefreshPair(payload.sub);
    await transactionRefreshRotate({
      oldJti: payload.jti,
      address: payload.sub,
      session: {
        jti: nextPair.jti,
        tokenHash: nextPair.tokenHash,
        expiresAt: nextPair.expiresAt
      },
      clientIp: getIp(req),
      userAgent: String(req.headers['user-agent'] || '').slice(0, 2000)
    });

    const token = createAccessToken(payload.sub, user.role);

    return res.json({
      token,
      refreshToken: nextPair.refreshToken
    });
  } catch {
    return res.status(401).json({ error: 'invalid or expired refresh token' });
  }
});

app.post('/api/logout', authMiddleware, async (req, res) => {
  await revokeAllSessionsForAddress(req.user.address);
  return res.json({ message: 'Logged out' });
});

app.get('/api/sessions', authMiddleware, async (req, res) => {
  const sessions = (await listActiveSessionsForAddress(req.user.address)).map(publicSessionView);
  return res.json({ sessions });
});

app.post('/api/sessions/revoke', authMiddleware, async (req, res) => {
  const { jti } = req.body || {};
  if (!jti || typeof jti !== 'string') {
    return res.status(400).json({ error: 'jti is required' });
  }

  const session = await getSessionByJti(jti);
  if (!session || session.address !== req.user.address || session.revokedAt) {
    return res.status(404).json({ error: 'session not found' });
  }

  const ok = await revokeSessionByJti(jti);
  if (!ok) {
    return res.status(404).json({ error: 'session not found' });
  }
  return res.json({ success: true });
});

app.get('/api/session', authMiddleware, async (req, res) => {
  const user = await getUser(req.user.address);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  return res.json({ user: publicUserView(user) });
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  const user = await getUser(req.user.address);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  return res.json(publicUserView(user));
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  const { displayName, bio } = req.body || {};
  if (displayName != null && typeof displayName !== 'string') {
    return res.status(400).json({ error: 'displayName must be a string' });
  }
  if (bio != null && typeof bio !== 'string') {
    return res.status(400).json({ error: 'bio must be a string' });
  }

  const nextDisplayName = (displayName || '').trim().slice(0, 60);
  const nextBio = (bio || '').trim().slice(0, 240);
  const user = await updateProfile(req.user.address, { displayName: nextDisplayName, bio: nextBio });
  return res.json(publicUserView(user));
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
  const items = await listNotifications(req.user.address, { limit: 100, unreadOnly });
  const unread = await countUnreadNotifications(req.user.address);
  return res.json({ notifications: items, unreadCount: unread });
});

app.post('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const ok = await markNotificationRead(id, req.user.address);
  if (!ok) {
    return res.status(404).json({ error: 'notification not found' });
  }
  return res.json({ success: true });
});

app.post('/api/notifications/read-all', authMiddleware, async (req, res) => {
  await markAllNotificationsRead(req.user.address);
  return res.json({ success: true });
});

app.get('/api/chat/conversations', authMiddleware, async (req, res, next) => {
  try {
    const conversations = await listChatConversations(req.user.address);
    return res.json({ conversations });
  } catch (err) {
    next(err);
  }
});

app.get('/api/chat/messages', authMiddleware, async (req, res) => {
  const raw = req.query.with;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).json({ error: 'query "with" (peer address) is required' });
  }
  let peer;
  try {
    peer = ethers.getAddress(raw.trim());
  } catch {
    return res.status(400).json({ error: 'invalid peer address' });
  }
  const messages = await listChatMessages(req.user.address, peer, { limit: 200 });
  await markChatRead(req.user.address, peer);
  return res.json({ peer, messages });
});

app.post('/api/chat/messages', authMiddleware, async (req, res, next) => {
  const { to, body } = req.body || {};
  try {
    const peer = ethers.getAddress(String(to || '').trim());
    const msg = await sendChatMessage({ from: req.user.address, to: peer, body });
    return res.status(201).json(msg);
  } catch (err) {
    const msg = err?.message || '';
    if (msg.includes('message body')) {
      return res.status(400).json({ error: msg });
    }
    if (msg.includes('not registered') || msg.includes('cannot message')) {
      return res.status(400).json({ error: msg });
    }
    if (msg.includes('invalid') || err?.code === 'INVALID_ARGUMENT') {
      return res.status(400).json({ error: 'invalid recipient address' });
    }
    next(err);
  }
});

app.post('/api/assistant/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }
    const reply = await runGeminiAssistant(messages);
    return res.json({ reply });
  } catch (err) {
    if (err.code === 'GEMINI_API_KEY_MISSING') {
      return res.status(503).json({
        error: 'Assistant is not configured. Set GEMINI_API_KEY in backend .env and restart the server.'
      });
    }
    if (err.code === 'GEMINI_MODEL_INVALID') {
      return res.status(503).json({
        error:
          'Указанная модель Gemini недоступна (устарела или неверное имя). В backend/.env задайте GEMINI_MODEL=gemini-2.5-flash или GEMINI_MODEL=gemini-2.5-flash-lite, перезапустите сервер. Список: https://ai.google.dev/gemini-api/docs/models/gemini'
      });
    }
    if (err.code === 'GEMINI_QUOTA') {
      return res.status(429).json({
        error:
          'Квота Gemini API: слишком много запросов или лимит на бесплатном плане. Подождите ~1 мин или в backend/.env укажите GEMINI_MODEL=gemini-2.5-flash-lite, проверьте лимиты на https://aistudio.google.com'
      });
    }
    const msg = err?.message || 'assistant failed';
    if (msg.includes('required') || msg.includes('must be')) {
      return res.status(400).json({ error: msg });
    }
    console.error('assistant:', err);
    return res.status(500).json({ error: msg });
  }
});

app.get('/api/me/export', authMiddleware, async (req, res, next) => {
  try {
    const bundle = await getExportBundle(req.user.address);
    const csv = bundleToCsv(bundle);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="blockchain-auth-export-${req.user.address.slice(0, 10)}.csv"`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(Buffer.from(csv, 'utf8'));
  } catch (err) {
    next(err);
  }
});

app.delete('/api/me', authMiddleware, async (req, res) => {
  const { confirm } = req.body || {};
  if (confirm !== 'DELETE_MY_ACCOUNT') {
    return res.status(400).json({
      error: 'Send JSON body { "confirm": "DELETE_MY_ACCOUNT" } to permanently delete your account.'
    });
  }
  await deleteAccount(req.user.address);
  return res.json({ message: 'Account deleted' });
});

app.get('/api/admin/stats', authMiddleware, requireAdmin, async (_req, res) => {
  const stats = await getAdminDashboardStats();
  const publicStats = await getStats();
  return res.json({
    ...stats,
    activeChallenges: publicStats.activeChallenges
  });
});

app.use((error, _req, res, _next) => {
  if (error?.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ error: error.message });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

setInterval(() => {
  cleanupExpired().catch(() => {});
}, 30_000);

async function start() {
  getPool();
  await dbHealth();
  await cleanupExpired();

  const server = app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT} (PostgreSQL)`);
  });

  const shutdown = async () => {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await closePool();
    process.exit(0);
  };
  process.on('SIGINT', () => {
    shutdown().catch(() => process.exit(1));
  });
  process.on('SIGTERM', () => {
    shutdown().catch(() => process.exit(1));
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
