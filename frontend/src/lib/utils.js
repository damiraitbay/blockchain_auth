import { getAddress } from 'ethers';

export function sameAddress(a, b) {
  if (!a || !b) return false;
  try {
    return getAddress(a) === getAddress(b);
  } catch {
    return a.toLowerCase() === b.toLowerCase();
  }
}

export function shortAddress(address) {
  if (!address) return '—';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function toLocalDate(value, lang) {
  if (!value) return '—';
  const locale = lang === 'kz' ? 'kk-KZ' : 'ru-RU';
  return new Date(value).toLocaleString(locale);
}

export function getFriendlyError(error, t) {
  if (error instanceof TypeError) {
    return t.backendOffline;
  }
  if (error?.message === 'WALLETCONNECT_PROJECT_ID') {
    return t.wcProjectMissing;
  }
  if (error?.message === 'EXPORT_OLD_FORMAT') {
    return t.exportOldFormat;
  }
  return error.message || 'Unexpected error';
}
