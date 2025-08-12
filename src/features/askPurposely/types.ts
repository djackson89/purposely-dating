import { sha256 } from 'js-sha256';
import { z } from 'zod';

export const ScenarioSchema = z.object({
  id: z.string(),
  question: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 12, 'empty_question'),
  perspective: z
    .string()
    .transform((s) => s.trim())
    .refine((s) => s.length >= 24, 'empty_perspective'),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  hash: z.string().min(16),
});
export type Scenario = z.infer<typeof ScenarioSchema>;

// Coerce legacy/varied shapes into canonical strings and enforce non-empty content
export function normalizeScenario(raw: any): Scenario {
  const q =
    typeof raw?.question === 'string' ? raw.question :
    typeof raw?.question?.text === 'string' ? raw.question.text :
    typeof raw?.question?.answer === 'string' ? raw.question.answer :
    typeof raw?.prompt === 'string' ? raw.prompt :
    '';

  const p =
    typeof raw?.perspective === 'string' ? raw.perspective :
    typeof raw?.answer === 'string' ? raw.answer :
    typeof raw?.advice === 'string' ? raw.advice :
    typeof raw?.rendered === 'string' ? raw.rendered :
    '';

  const id = String(raw?.id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`));
  const createdAt = new Date(raw?.createdAt ?? Date.now()).toISOString();
  const tags: string[] = Array.isArray(raw?.tags) ? raw.tags.map(String) : [];
  const hash = String(raw?.hash ?? sha256(String(q) + '|' + String(p)));

  return ScenarioSchema.parse({ id, question: q, perspective: p, tags, createdAt, hash });
}
