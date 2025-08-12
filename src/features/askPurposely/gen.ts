import { supabase } from '@/integrations/supabase/client';
import { normalizeScenario } from './types';

export type Audience = 'woman' | 'man' | 'couple' | 'unspecified';
export type LengthPref = 'short' | 'standard' | 'long';

export interface GenOptions {
  audience: Audience;
  spice_level: number; // 1-5
  length: LengthPref;
  topic_tags: string[];
}

function buildBatchPrompt(opts: GenOptions & { count: number }) {
  return `Ask Purposely — Unified Content Prompt\n\nTask\nGenerate ${opts.count} on-brand Q&A items for the Ask Purposely card. Each item contains:\n\nquestion: a realistic, first-person scenario from an anonymous user (2–4 sentences).\n\nperspective: a bold, witty, emotionally intelligent “Purposely Perspective” response (on-brand voice, hook first).\n\ntags: relevant topic labels.\n\nInputs (provided by the app)\n- audience: ${opts.audience}\n- spice_level: ${opts.spice_level} (1 warm & gentle → 5 savage but respectful)\n- length: ${opts.length} (~120 | 200 | 320 words for perspective)\n- topic_tags: ${JSON.stringify(opts.topic_tags)}\n- count: ${opts.count}\n\nOutput (MUST be valid JSON only)\nReturn an array of length count. Each element:\n[\n  {\n    "question": "<string>",\n    "perspective": "<string>",\n    "tags": ["tag1","tag2"]\n  }\n]\nNo extra text before or after the JSON.\n\nVoice & Style Blueprint (match this exactly)\n- Hook first line in perspective: a punchy, quotable thesis (≤ 20 words).\n- Tonality: confident, witty, validating; sharp one-liners and clean reversals.\n- Specificity over clichés: cite 2+ concrete details from the question.\n- Structure: Hook line → 2–4 short paragraphs mixing empathy + bars + flips → Close with momentum (one sentence that empowers a decision).\n- Spice dial: ${opts.spice_level} (stay respectful and safe).\n- Safety: PG-13, inclusive language; no explicit content; no revenge.\n- Prohibited filler: avoid “As an AI…,” “communication is key,” generic boundary talk without specifics, disclaimers.\n\nRules for question (the scenario)\n- First-person, anonymous, natural voice.\n- 2–4 sentences, include one tangible clue (timeline, object found, DMs, etc.).\n- End with a simple ask (e.g., “Am I wrong?”, “What should I do?”).\n- No therapy-legal disclaimers.\n\nRules for perspective\n- Lead with the hook.\n- Name the pattern; flip the frame (call out incentive behind behavior).\n- Validate → then empower with a clear stance.\n- Mirror at least two details from the question.\n- Keep cadence quotable; vary sentence length; no rambling.\n\nQuality checklist (auto-enforce before output)\n- question.length >= 12 and not generic.\n- perspective starts with a hook and includes 2+ callbacks to question details.\n- No banned filler phrases; no disclaimers; original phrasing.\n- Tone matches spice_level; respectful but firm.\n- JSON validates and matches the exact schema.\n`;
}

function buildSinglePrompt(question: string, opts: GenOptions) {
  return `Ask Purposely — Single Item\n\nTask\nGiven the user's question below, generate ONE on-brand Q&A item in JSON only.\n\nUser question:\n"""\n${question}\n"""\n\nConstraints\n- audience: ${opts.audience}\n- spice_level: ${opts.spice_level}\n- length: ${opts.length}\n- topic_tags: ${JSON.stringify(opts.topic_tags)}\n\nOutput (MUST be valid JSON only)\n{\n  "question": "<string>",\n  "perspective": "<string>",\n  "tags": ["tag1","tag2"]\n}\nNo extra text before or after the JSON.\n\nVoice & Style Blueprint\n- Hook first line in perspective (≤ 20 words).\n- Confident, witty, validating; sharp one-liners and clean reversals.\n- Specific, mirror at least two details from the question.\n- Structure: Hook → 2–4 short paragraphs → one-line momentum close.\n- Safety: PG-13; inclusive; no revenge.\n- Avoid generic filler and disclaimers.\n`;
}

function parseJsonArray(input: any): any[] {
  try {
    if (Array.isArray(input)) return input;
    if (typeof input === 'string') return JSON.parse(input);
    if (input && typeof input === 'object') return input.items ?? input.data ?? [];
  } catch {}
  // last attempt: extract JSON array via regex
  if (typeof input === 'string') {
    const match = input.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
  }
  return [];
}

function parseJsonObject(input: any): any {
  try {
    if (input && typeof input === 'object' && !Array.isArray(input)) return input;
    if (typeof input === 'string') return JSON.parse(input);
  } catch {}
  if (typeof input === 'string') {
    const match = input.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
  }
  return {};
}

export async function generateScenarios(count: number, opts: GenOptions) {
  const prompt = buildBatchPrompt({ ...opts, count: Math.max(1, count) });
  const { data, error } = await supabase.functions.invoke('relationship-ai', {
    body: {
      type: 'purposely',
      prompt,
      audience: opts.audience,
      spice_level: opts.spice_level,
      length: opts.length,
      topic_tags: opts.topic_tags,
      count: Math.max(1, count),
    },
  });
  if (error) throw new Error(error.message || 'Failed to generate scenarios');
  const arr = Array.isArray((data as any)?.json)
    ? (data as any).json
    : parseJsonArray((data as any)?.response ?? data);
  return arr.map((it: any) => normalizeScenario(it));
}

export async function generatePerspectiveFor(question: string, opts: GenOptions) {
  const prompt = buildSinglePrompt(question, opts);
  const { data, error } = await supabase.functions.invoke('relationship-ai', {
    body: {
      type: 'purposely',
      prompt,
      audience: opts.audience,
      spice_level: opts.spice_level,
      length: opts.length,
      topic_tags: opts.topic_tags,
    },
  });
  if (error) throw new Error(error.message || 'Failed to generate perspective');
  const obj = (data as any)?.json && !Array.isArray((data as any).json)
    ? (data as any).json
    : parseJsonObject((data as any)?.response ?? data);
  return normalizeScenario(obj);
}
