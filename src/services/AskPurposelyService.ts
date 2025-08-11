import { sha256 } from 'js-sha256';
import { supabase } from '@/integrations/supabase/client';
import { normalizeScenario } from '@/lib/ask/types';

// Minimal inline UUID generator with crypto fallback
const uuidFallback = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const newId = () => {
  try {
    const c: any = (globalThis as any).crypto;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID();
    }
  } catch {}
  return uuidFallback();
};

export type Scenario = {
  id: string;
  question: string;
  perspective: string;
  tags: string[];
  createdAt: number;
  hash: string;
};

export type ServiceOptions = {
  userKey: string;
  telemetry?: boolean;
  getAIResponse: (prompt: string, userProfile: any, type?: any) => Promise<string>;
  userProfile: any;
};

const TELEMETRY_DEFAULT = true;

const log = (enabled: boolean, event: string, data?: Record<string, any>) => {
  if (!enabled) return;
  console.info(`telemetry:${event}`, data || {});
};

const now = () => Date.now();

const computeHash = (q: string, p: string) => sha256(q + '|' + p);

const detectTags = (q: string, p: string): string[] => {
  const text = `${q} ${p}`.toLowerCase();
  const tags: string[] = [];
  const add = (t: string) => {
    if (!tags.includes(t)) tags.push(t);
  };
  if (/(cheat|affair|unfaithful|flirt|ex\b)/.test(text)) add('trust');
  if (/(gaslight|manipulat|control)/.test(text)) add('boundaries');
  if (/(inconsisten|mixed signal|hot and cold)/.test(text)) add('inconsistency');
  if (/(money|debt|finance)/.test(text)) add('money');
  if (/(sex|intimacy|attracted)/.test(text)) add('intimacy');
  if (/(family|parent|child|kids)/.test(text)) add('family');
  if (/(ex\b|past relationship)/.test(text)) add('post-breakup');
  return tags;
};

const parseArrayJson = (raw: string): Array<{ question: string; answer: string }> | null => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as any) : null;
  } catch {
    const match = raw?.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        return Array.isArray(parsed) ? (parsed as any) : null;
      } catch {}
    }
  }
  return null;
};

const parseOneJson = (raw: string): { question: string; answer: string } | null => {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'question' in parsed && 'answer' in parsed) return parsed as any;
  } catch {}
  const match = raw?.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object' && 'question' in parsed && 'answer' in parsed) return parsed as any;
    } catch {}
  }
  return null;
};

const buildPromptMany = (n: number, seedBank?: string) => `You are writing fictional, anonymous, user-submitted relationship and dating dilemmas for a section called "Ask Purposely".
Your goal is to produce emotionally gripping, debate-inducing scenarios that feel real.

Return a STRICT JSON array with exactly ${n} objects, each exactly: {"question": "...", "answer": "..."}.
No markdown, no backticks, no labels, no extra commentary.

Tone & Style Rules:
- Authentic first-person voice, specific details, a twist/reveal, and end with a vulnerable question.
- Perspective (answer) must be 5–7 sentences, sharp, validating, and actionable.
- Avoid clichés and therapy-speak.
`;

const buildPromptOne = () => `Return a STRICT JSON object exactly: {"question": "...", "answer": "..."} with the same tone rules. No markdown.`;

// Local fallback scenarios to ensure UI never renders empty
const FALLBACK: Array<{ question: string; answer: string }> = [
  {
    question:
      `Two months ago, things felt easy. Now my boyfriend keeps working "late" and coming home showered, saying, "Don’t start, I’m exhausted." I brushed it off—until I recognized the cologne on his hoodie that isn’t his. When I asked, he said they’ve been training together at the gym. Then I found a receipt for a fancy wine bar, two glasses. He swears it was a client. Am I wrong for feeling like I’m being slowly gaslit?`,
    answer:
      'Your body clocked the truth before your brain did—listen to it. Ask for receipts, calendars, and a quick call with the “client.” Set a hard boundary: no more mystery nights. If clarity is resisted, that is your clarity—choose your peace.'
  },
  {
    question:
      `At brunch, my fiancé passed his phone to show a meme; I accidentally saw a group chat called "Operation Upgrade" rating bridesmaids. He sent a laughing emoji and said, "Relax, guy stuff." Now he wants to add an ex to the wedding party. Am I overreacting?`,
    answer:
      'He didn’t stop the disrespect because he benefits from it. Set terms: no objectifying chat, no ex in the party, accountability to clean up his circle. If he minimizes you again, this isn’t a wedding issue—it’s values.'
  },
  {
    question:
      `I found a velvet pouch in my boyfriend’s jacket—inside was a ring engraved with another woman’s initials. He says it’s from years ago and kept it for closure. Last week he asked my ring size “for fun.” Am I the real choice or the second chance?`,
    answer:
      'You can’t start a new chapter while he’s still bookmarking the last one. Ask him to release the ring and close the loop. If he can’t choose cleanly, you can choose yourself.'
  },
];

const fallbackList = (n: number) => {
  const arr: Array<{ question: string; answer: string }> = [];
  for (let i = 0; i < n; i++) arr.push(FALLBACK[i % FALLBACK.length]);
  return arr;
};

export class AskPurposelyService {
  private telemetry: boolean;
  private getAIResponse: ServiceOptions['getAIResponse'];
  private userProfile: any;
  private userKey: string;
  private inflight: Promise<Scenario[] | Scenario> | null = null;
  private aborted = false;

  constructor(opts: ServiceOptions) {
    this.telemetry = opts.telemetry ?? TELEMETRY_DEFAULT;
    this.getAIResponse = opts.getAIResponse;
    this.userProfile = opts.userProfile;
    this.userKey = opts.userKey || 'anon';
  }

  cancel() {
    this.aborted = true;
  }

  private mapToScenarios(rows: Array<any>): Scenario[] {
    return rows
      .map((r) => {
        try {
          const normalized = normalizeScenario({
            id: newId(),
            question: r?.question,
            perspective: (r as any)?.perspective,
            answer: (r as any)?.answer,
            tags: Array.isArray((r as any)?.tags) ? (r as any).tags : [],
            createdAt: new Date().toISOString(),
            hash: undefined,
          });
          return {
            id: normalized.id,
            question: normalized.question,
            perspective: normalized.perspective,
            tags: normalized.tags?.length ? normalized.tags : detectTags(normalized.question, normalized.perspective),
            createdAt: Date.parse(normalized.createdAt),
            hash: normalized.hash,
          } as Scenario;
        } catch (e) {
          log(this.telemetry, 'normalize_fail', { error: String((e as any)?.message || e) });
          return null as any;
        }
      })
      .filter((s) => s && s.question && s.perspective);
  }

  private getHistory(): string[] {
    const key = `ap:history:${this.userKey}`;
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  private saveHistory(hashes: string[]) {
    const key = `ap:history:${this.userKey}`;
    try {
      sessionStorage.setItem(key, JSON.stringify(hashes.slice(-50)));
    } catch {}
  }

  private deDupe(input: Scenario[]): Scenario[] {
    const history = this.getHistory();
    const set = new Set(history);
    const unique: Scenario[] = [];
    for (const s of input) {
      if (!set.has(s.hash)) {
        unique.push(s);
        set.add(s.hash);
      }
    }
    this.saveHistory(Array.from(set));
    return unique;
  }

  private withTimeout<T>(p: Promise<T>, ms = 12000): Promise<T> {
    let t: any;
    const timeout = new Promise<T>((_, rej) => {
      t = setTimeout(() => rej(new Error('timeout')), ms);
    });
    const cleaned = p.then((v) => { clearTimeout(t); return v; }, (e) => { clearTimeout(t); throw e; });
    return Promise.race([cleaned, timeout]);
  }

  private isAuthed() {
    return this.userKey && this.userKey !== 'anon';
  }

  private mapSeedRows(rows: Array<{ id: string; question: any; perspective?: any; answer?: any; tags?: any; created_at?: string; hash?: string; }>): Scenario[] {
    return (rows || []).map((r) => {
      try {
        const normalized = normalizeScenario({
          id: `seed_${r.id}`,
          question: r.question,
          perspective: (r as any)?.perspective,
          answer: (r as any)?.answer,
          tags: Array.isArray(r.tags) ? r.tags : [],
          createdAt: r.created_at ?? new Date().toISOString(),
          hash: r.hash,
        });
        return {
          id: normalized.id,
          question: normalized.question,
          perspective: normalized.perspective,
          tags: normalized.tags?.length ? normalized.tags : detectTags(normalized.question, normalized.perspective),
          createdAt: Date.parse(normalized.createdAt),
          hash: normalized.hash,
        } as Scenario;
      } catch (e) {
        log(this.telemetry, 'normalize_fail', { error: String((e as any)?.message || e) });
        return null as any;
      }
    }).filter(Boolean as any);
  }

  private async takeFromSeed(n: number): Promise<Scenario[]> {
    if (!this.isAuthed()) return [];
    const { data, error } = await supabase.rpc('ap_seed_take', {
      p_user: this.userKey,
      p_n: n,
    });
    if (error) {
      log(this.telemetry, 'ap_seed_take_fail', { error: error.message });
      return [];
    }
    const mapped = this.mapSeedRows(data as any[]);
    log(this.telemetry, 'ap_seed_take', { count: mapped.length });
    return this.deDupe(mapped);
  }

  async consumeIfSeed(id: string) {
    if (!this.isAuthed()) return;
    if (!id?.startsWith('seed_')) return;
    const realId = id.slice(5);
    const { error } = await supabase.rpc('ap_seed_consume', { p_ids: [realId] });
    if (error) log(this.telemetry, 'ap_seed_consume_fail', { error: error.message, id });
    else log(this.telemetry, 'ap_seed_consume', { id });
  }

  async prefetch(n: number): Promise<Scenario[]> {
    if (this.inflight) return (this.inflight as Promise<Scenario[]>);
    this.aborted = false;
    const start = performance.now();
    log(this.telemetry, 'askprefetch_start', { n });

    const task = (async () => {
      try {
        // 1) Try seed inventory first for instant UX
        const seed = await this.takeFromSeed(n);
        let results: Scenario[] = [...seed];
        const remaining = Math.max(0, n - results.length);

        // 2) If not enough, generate remainder live (with timeout + retry handled by generateMany)
        if (remaining > 0) {
          try {
            const prompt = buildPromptMany(Math.max(remaining, 3));
            const raw = await this.withTimeout(this.getAIResponse(prompt, this.userProfile, 'therapy'));
            if (this.aborted) throw new Error('aborted');
            const arr = parseArrayJson(raw) || [];
            const scenarios = this.mapToScenarios(arr);
            results = this.deDupe([...results, ...scenarios]);
          } catch (e: any) {
            log(this.telemetry, 'askprefetch_live_fill_fail', { error: String(e?.message || e) });
          }
        }

        // 3) Ensure we always have something
        if (!results.length) {
          results = this.mapToScenarios(fallbackList(Math.max(3, n)));
        }

        const finalList = results.slice(0, n);
        log(this.telemetry, 'askprefetch_success', { took_ms: performance.now() - start, count: finalList.length });
        return finalList;
      } catch (e: any) {
        log(this.telemetry, 'askprefetch_fail', { error: String(e?.message || e) });
        const fb = this.mapToScenarios(fallbackList(Math.max(3, n)));
        return fb.slice(0, n);
      } finally {
        this.inflight = null;
      }
    })();

    this.inflight = task;
    return task;
  }

  async generateOne(): Promise<Scenario> {
    if (this.inflight) return (this.inflight as Promise<Scenario>);
    this.aborted = false;
    const start = performance.now();
    log(this.telemetry, 'generate_start');

    const run = async () => {
      const prompt = buildPromptOne();
      const raw = await this.withTimeout(this.getAIResponse(prompt, this.userProfile, 'therapy'));
      if (this.aborted) throw new Error('aborted');
      const one = parseOneJson(raw);
      if (!one) throw new Error('bad_response');
      const [scenario] = this.deDupe(this.mapToScenarios([one]));
      if (!scenario) throw new Error('duplicate');
      return scenario;
    };

    const task = (async () => {
      try {
        try {
          const s = await run();
          log(this.telemetry, 'generate_success', { took_ms: performance.now() - start });
          return s;
        } catch {
          // auto-retry once
          const s = await run();
          log(this.telemetry, 'generate_success_retry', { took_ms: performance.now() - start });
          return s;
        }
      } catch (e: any) {
        log(this.telemetry, 'generate_fail', { error: String(e?.message || e) });
        // Fallback single scenario so UI keeps moving
        const [fb] = this.mapToScenarios(fallbackList(1));
        return fb;
      } finally {
        this.inflight = null;
      }
    })();

    this.inflight = task;
    return task as Promise<Scenario>;
  }

  loadPersistedQueue(): Scenario[] {
    const key = `ap:queue:${this.userKey}`;
    try {
      const raw = sessionStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as any[]) : [];
      if (!Array.isArray(parsed)) return [];
      const normalized = parsed.map((r: any) => {
        try {
          const n = normalizeScenario(r);
          return {
            id: n.id,
            question: n.question,
            perspective: n.perspective,
            tags: Array.isArray(n.tags) ? n.tags : [],
            createdAt: Date.parse(n.createdAt),
            hash: n.hash,
          } as Scenario;
        } catch {
          return null as any;
        }
      }).filter(Boolean as any);
      return normalized;
    } catch {
      return [];
    }
  }

  saveQueue(queue: Scenario[]) {
    const key = `ap:queue:${this.userKey}`;
    try {
      sessionStorage.setItem(key, JSON.stringify(queue.slice(0, 6)));
    } catch {}
  }
}
