import { API_BASE } from './constants.js';

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/api/health`);
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'health check failed');
  return data;
}

export async function fetchSession(token) {
  const response = await fetch(`${API_BASE}/api/session`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'session failed');
  return data.user;
}

export async function fetchSessions(token) {
  const response = await fetch(`${API_BASE}/api/sessions`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'sessions failed');
  return data.sessions || [];
}

export async function putProfile(token, body) {
  const response = await fetch(`${API_BASE}/api/profile`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'profile save failed');
  return data;
}

export async function postRevokeSession(token, jti) {
  const response = await fetch(`${API_BASE}/api/sessions/revoke`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ jti })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'revoke failed');
  return data;
}

export async function postRefresh(refreshToken) {
  const response = await fetch(`${API_BASE}/api/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'refresh failed');
  return data;
}

export async function postLogout(token) {
  await fetch(`${API_BASE}/api/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function fetchNonce(address, chainId) {
  const response = await fetch(
    `${API_BASE}/api/nonce?address=${encodeURIComponent(address)}&chainId=${chainId}`
  );
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'nonce failed');
  return data;
}

export async function postAuthenticate(address, signature) {
  const response = await fetch(`${API_BASE}/api/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'auth failed');
  return data;
}

export async function fetchNotifications(token, { unreadOnly = false } = {}) {
  const q = unreadOnly ? '?unread=1' : '';
  const response = await fetch(`${API_BASE}/api/notifications${q}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'notifications failed');
  return data;
}

export async function postNotificationRead(token, id) {
  const response = await fetch(`${API_BASE}/api/notifications/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'read failed');
  return data;
}

export async function postNotificationsReadAll(token) {
  const response = await fetch(`${API_BASE}/api/notifications/read-all`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'read all failed');
  return data;
}

export async function fetchChatConversations(token) {
  const response = await fetch(`${API_BASE}/api/chat/conversations`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'conversations failed');
  return data.conversations || [];
}

export async function fetchChatMessages(token, peerAddress) {
  const response = await fetch(
    `${API_BASE}/api/chat/messages?with=${encodeURIComponent(peerAddress)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'messages failed');
  return data.messages || [];
}

export async function postAssistantChat(token, messages) {
  const response = await fetch(`${API_BASE}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ messages })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'assistant failed');
  return data.reply;
}

export async function postChatMessage(token, { to, body }) {
  const response = await fetch(`${API_BASE}/api/chat/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to, body })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'send failed');
  return data;
}

export async function downloadMyDataExport(token) {
  const response = await fetch(`${API_BASE}/api/me/export`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'text/csv, text/plain;q=0.9, */*;q=0.8' }
  });
  const ct = (response.headers.get('Content-Type') || '').toLowerCase();
  const text = await response.text();

  if (!response.ok || ct.includes('application/json')) {
    try {
      const data = JSON.parse(text);
      throw new Error(data.error || 'export failed');
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text.slice(0, 200) || 'export failed');
      throw e;
    }
  }

  const trimmed = text.trimStart();
  if (trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(text);
      if (
        data &&
        typeof data === 'object' &&
        (Object.prototype.hasOwnProperty.call(data, 'exportedAt') ||
          Object.prototype.hasOwnProperty.call(data, 'notifications'))
      ) {
        throw new Error(
          'Сервер отдал JSON (старый формат экспорта). Перезапустите backend с export CSV и скачайте снова.'
        );
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        /* не JSON — оставляем как CSV */
      } else {
        throw e;
      }
    }
  }

  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
  const cd = response.headers.get('Content-Disposition');
  let filename = 'blockchain-auth-export.csv';
  if (cd) {
    const m = /filename="([^"]+)"/.exec(cd);
    if (m) filename = m[1];
  }
  return { blob, filename };
}

export async function deleteMyAccount(token) {
  const response = await fetch(`${API_BASE}/api/me`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ confirm: 'DELETE_MY_ACCOUNT' })
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'delete failed');
  return data;
}

export async function fetchAdminStats(token) {
  const response = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await parseJson(response);
  if (!response.ok) throw new Error(data.error || 'admin stats failed');
  return data;
}
