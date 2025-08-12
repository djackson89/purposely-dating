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
  const len = opts.length;
  const sentenceRange = len === 'short' ? '4–6 sentences' : len === 'standard' ? '6–9 sentences' : '8–12 sentences';
  return `Ask Purposely — Unified Content Prompt\n\nTask\nGenerate ${opts.count} on-brand Q&A items for the Ask Purposely card. Each item contains:\n\nquestion: a realistic, first-person scenario from an anonymous user (2–4 sentences) with emotion and a tangible clue.\n\nperspective: a bold, witty, emotionally intelligent “Purposely Perspective” response (hook first, ${sentenceRange}).\n\ntags: relevant topic labels.\n\nInputs (provided by the app)\n- audience: ${opts.audience}\n- spice_level: ${opts.spice_level} (1 warm & gentle → 5 savage but respectful)\n- length: ${opts.length} (~120 | 200 | 320 words)\n- topic_tags: ${JSON.stringify(opts.topic_tags)}\n- count: ${opts.count}\n\nOutput (MUST be valid JSON only)\nReturn an array of length count. Each element:\n[\n  {\n    "question": "<string>",\n    "perspective": "<string>",\n    "tags": ["tag1","tag2"]\n  }\n]\nNo extra text before or after the JSON.\n\nVoice & Style Blueprint (match this exactly)\n- Tone: straight-talk, no‑BS male relationship coach; confident, witty, validating; sharp one‑liners and clean reversals.\n- Hook first line in perspective: a punchy, quotable thesis (≤ 20 words).\n- Each sentence must hit hard and stand alone as a viral‑worthy relationship quote.\n- Emotionally compelling and slightly polarizing (never cruel); validate the user, jab the behavior, not the person.\n- Specificity over clichés: mirror at least 2 concrete details from the question (receipts, late returns, apps installed, DMs, timelines, etc.).\n- Structure: Hook → 2–4 compact paragraphs mixing empathy + bars + flips → momentum close (one sentence that empowers action).\n- Spice dial: ${opts.spice_level} (1–2 warm & compassionate; 3–4 bolder with playful jabs at behaviors; 5 gloves‑off truth, still dignified).\n- Safety: PG‑13, inclusive language; no explicit content; no revenge.\n- Prohibited filler: avoid “As an AI…,” “communication is key,” boundary talk without specifics, disclaimers.\n\nQuestion Crafting Blueprint (the scenario)\n- First‑person, anonymous, natural voice.\n- 2–4 sentences with one tangible clue or contradiction: late‑night pings, DND face‑down phone, “leftover” app notifications, boutique hotel receipt, co‑parenting midnight texts, girl‑best‑friend bikini comments, missed therapy, public vs private labels, money borrowed vs flowers receipt, no photos together on vacation, “space” while daily texting.\n- Show implied stakes (confusion, doubt, frustration) without therapy‑legal disclaimers.\n- End with a sharp, simple ask (e.g., “Am I wrong?”, “What should I do?”).\n\nRules for perspective\n- Lead with the hook. Name the pattern (e.g., post‑breakup surveillance, contingent confession, damage deflection, effort minimization).\n- Flip the frame (call out the incentive behind the behavior). Validate → then empower with a clear stance.\n- Mirror the question’s details with micro‑specifics. Keep the cadence quotable; vary sentence length; no rambling.\n- For length='long', target ${sentenceRange} so it reads like a complete thought on the Home page.\n\nGeneration procedure (must follow)\n1) Read topic_tags and pick a fitting pattern.\n2) Write the question (2–4 sentences, include at least one concrete clue; end with a direct ask).\n3) Write the perspective using the blueprint and spice_level. Hook first. Mirror two details. End with momentum.\n4) Return 2–4 concise tags.\n\nQuality checklist (auto‑enforce before output)\n- question.length ≥ 12 and not generic.\n- perspective begins with a hook; includes 2+ callbacks to question details; ${sentenceRange} when length='long'.\n- No banned filler; no disclaimers; no copying from examples.\n- Tone matches spice_level; respectful but firm.\n- JSON validates and matches the exact schema.\n`; 
}

function buildSinglePrompt(question: string, opts: GenOptions) {
  const len = opts.length;
  const sentenceRange = len === 'short' ? '4–6 sentences' : len === 'standard' ? '6–9 sentences' : '8–12 sentences';
  return `Ask Purposely — Single Item\n\nTask\nGiven the user's question below, generate ONE on-brand Q&A item in JSON only.\n\nUser question:\n"""\n${question}\n"""\n\nConstraints\n- audience: ${opts.audience}\n- spice_level: ${opts.spice_level}\n- length: ${opts.length} (${sentenceRange} for the perspective; ensure complete thought)\n- topic_tags: ${JSON.stringify(opts.topic_tags)}\n\nOutput (MUST be valid JSON only)\n{\n  "question": "<string>",\n  "perspective": "<string>",\n  "tags": ["tag1","tag2"]\n}\nNo extra text before or after the JSON.\n\nVoice & Style Blueprint (strict)\n- Tone: straight-talk, no‑BS male relationship coach; confident, witty, validating; sharp one‑liners and clean reversals.\n- Begin with a hook line (≤ 20 words).\n- Each sentence should stand alone as a quotable line; emotionally compelling; slightly polarizing but respectful.\n- Mirror at least 2 concrete details from the user's question (receipts, notifications, timelines, objects, apps, DMs).\n- Structure: Hook → compact, high‑impact paragraphs → one‑line momentum close.\n- Safety: PG‑13; inclusive; no revenge; no disclaimers; avoid generic filler (“communication is key,” etc.).\n`;
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
