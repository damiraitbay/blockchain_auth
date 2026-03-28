/**
 * GDPR-style bundle → single UTF-8 CSV (BOM for Excel), three logical blocks.
 */

/** Только текст в ячейках — без JSON.stringify (иначе в CSV попадают фигурные скобки). */
function toCellText(value) {
  if (value === null || value === undefined) return '';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(value);
  if (t === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((v) => toCellText(v)).join('; ');
  }
  if (t === 'object') {
    try {
      return Object.entries(value)
        .map(([k, v]) => `${k}=${toCellText(v)}`)
        .join('; ');
    } catch {
      return '';
    }
  }
  return String(value);
}

function escapeCell(value) {
  const s = toCellText(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function line(cells) {
  return cells.map(escapeCell).join(',');
}

/** Разворачиваем JSONB metadata в плоские колонки без строки JSON в ячейке. */
function flattenNotificationMetadata(raw) {
  if (raw == null) return { ip: '', ua: '', ended: '', other: '' };
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      if (typeof p === 'object' && p !== null) obj = p;
      else return { ip: '', ua: '', ended: '', other: raw };
    } catch {
      return { ip: '', ua: '', ended: '', other: raw };
    }
  }
  if (typeof obj !== 'object' || obj === null) {
    return { ip: '', ua: '', ended: '', other: String(obj) };
  }
  const ip = obj.ip != null ? String(obj.ip) : '';
  const ua = obj.userAgent != null ? String(obj.userAgent) : '';
  const ended = obj.endedOtherSessions != null ? String(obj.endedOtherSessions) : '';
  const known = new Set(['ip', 'userAgent', 'endedOtherSessions']);
  const otherParts = [];
  for (const [k, v] of Object.entries(obj)) {
    if (known.has(k) || v === undefined) continue;
    otherParts.push(`${k}=${String(v).replace(/[\r\n;]/g, ' ')}`);
  }
  return { ip, ua, ended, other: otherParts.join('; ') };
}

export function bundleToCsv(bundle) {
  const lines = [];

  lines.push('address,display_name,bio,role,created_at,updated_at,exported_at');
  const u = bundle.user;
  if (u) {
    lines.push(
      line([
        u.address,
        u.displayName ?? '',
        u.bio ?? '',
        u.role ?? '',
        u.createdAt ?? '',
        u.updatedAt ?? '',
        bundle.exportedAt ?? ''
      ])
    );
  } else {
    lines.push(line(['', '', '', '', '', '', bundle.exportedAt ?? '']));
  }

  lines.push('');
  lines.push(
    'id,kind,title,body,metadata_ip,metadata_user_agent,metadata_ended_other_sessions,metadata_other,read_at,created_at'
  );
  for (const n of bundle.notifications || []) {
    const m = flattenNotificationMetadata(n.metadata);
    lines.push(
      line([
        n.id,
        n.kind,
        n.title ?? '',
        n.body ?? '',
        m.ip,
        m.ua,
        m.ended,
        m.other,
        n.readAt ?? '',
        n.createdAt ?? ''
      ])
    );
  }

  lines.push('');
  lines.push('jti,created_at,expires_at,last_used_at,client_ip,user_agent');
  for (const s of bundle.activeSessions || []) {
    lines.push(
      line([
        s.jti,
        s.createdAt,
        s.expiresAt,
        s.lastUsedAt ?? '',
        s.clientIp ?? '',
        s.userAgent ?? ''
      ])
    );
  }

  lines.push('');
  lines.push('id,sender_address,recipient_address,body,read_at,created_at');
  for (const m of bundle.chatMessages || []) {
    lines.push(
      line([
        m.id,
        m.senderAddress,
        m.recipientAddress,
        m.body ?? '',
        m.readAt ?? '',
        m.createdAt ?? ''
      ])
    );
  }

  return `\uFEFF${lines.join('\n')}`;
}
