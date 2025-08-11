import { sha256 } from 'js-sha256';
import { z } from 'zod';

// UUID with safe fallback for Safari/WebKit
const uuidFallback = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const safeRandomUUID = () => {
  try {
    const c: any = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {}
  return uuidFallback();
};

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  perspective: z.string().min(1),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().transform((v) => new Date(v).toISOString()),
  hash: z.string().min(16),
});

export type CanonicalScenario = z.infer<typeof ScenarioSchema>;

// Coerce unknown values to a usable string
const coerceText = (v: any): string => {
  if (typeof v === 'string') return v.trim();
  if (v == null) return '';
  if (Array.isArray(v)) return v.filter(Boolean).join(' ').trim();
  if (typeof v === 'object') {
    const candidates = [v.text, v.answer, v.content, v.value, v.message];
    const first = candidates.find((x) => typeof x === 'string');
    if (first) return String(first).trim();
  }
  return String(v ?? '').trim();
};

export function normalizeScenario(raw: any): CanonicalScenario {
  // Accept legacy shapes from AI and DB
  const question = coerceText(raw?.question);
  const perspective = coerceText(raw?.perspective ?? raw?.answer);
  const id = String(raw?.id ?? safeRandomUUID());
  const tags: string[] = Array.isArray(raw?.tags) ? raw.tags.map(String) : [];
  const createdAt = raw?.createdAt
    ? new Date(raw.createdAt).toISOString()
    : new Date().toISOString();
  const hash = String(raw?.hash ?? sha256(question + '|' + perspective));

  return ScenarioSchema.parse({ id, question, perspective, tags, createdAt, hash });
}
