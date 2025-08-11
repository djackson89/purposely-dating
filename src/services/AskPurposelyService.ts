import { sha256 } from 'js-sha256';
import { v4 as uuidv4 } from 'uuid';

// Minimal inline UUID fallback if uuid isn't available (in case of tree-shaking)
// Note: We prefer uuid v4, but if it's not present, use a simple fallback.
// However, our project doesn't include uuid; create a tiny fallback.
const uuidFallback = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

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

  private mapToScenarios(rows: Array<{ question: string; answer: string }>): Scenario[] {
    return rows
      .map((r) => {
        const q = String(r?.question || '').trim().replace(/^[\["']|[\]"']$/g, '');
        const a = String(r?.answer || '').trim().replace(/^[\["']|[\]"']$/g, '');
        const id = (typeof uuidv4 === 'function' ? uuidv4() : uuidFallback());
        const hash = computeHash(q, a);
        return {
          id,
          question: q,
          perspective: a,
          tags: detectTags(q, a),
          createdAt: now(),
          hash,
        } as Scenario;
      })
      .filter((s) => s.question && s.perspective);
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
    return Promise.race([p.finally(() => clearTimeout(t)), timeout]);
  }

  async prefetch(n: number): Promise<Scenario[]> {
    if (this.inflight) return (this.inflight as Promise<Scenario[]>);
    this.aborted = false;
    const start = performance.now();
    log(this.telemetry, 'askprefetch_start', { n });

    const task = (async () => {
      try {
        const prompt = buildPromptMany(Math.max(6, n));
        const raw = await this.withTimeout(this.getAIResponse(prompt, this.userProfile, 'therapy'));
        if (this.aborted) throw new Error('aborted');
        const arr = parseArrayJson(raw) || [];
        const scenarios = this.mapToScenarios(arr);
        const unique = this.deDupe(scenarios);
        log(this.telemetry, 'askprefetch_success', { took_ms: performance.now() - start, count: unique.length });
        return unique.slice(0, n);
      } catch (e: any) {
        log(this.telemetry, 'askprefetch_fail', { error: String(e?.message || e) });
        throw e;
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
        throw e;
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
      const parsed = raw ? (JSON.parse(raw) as Scenario[]) : [];
      return Array.isArray(parsed) ? parsed : [];
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
