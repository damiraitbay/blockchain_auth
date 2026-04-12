const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
export const API_BASE = String(raw).trim().replace(/\/+$/, '');

export const DEFAULT_CHAIN_ID = 11155111;

export const SUPPORTED_CHAINS = new Set([1, 11155111]);
