// Safe text utilities for Ask Purposely
export const truncate = (v: unknown, n = 180) => String(v ?? '').slice(0, n);
