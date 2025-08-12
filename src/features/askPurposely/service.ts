import { Scenario, normalizeScenario } from './types';
import { seedTake, seedConsume } from './api';

export type Generators = {
  generateScenarios: (n: number) => Promise<any[]>; // returns raw items; will be normalized
  generatePerspectiveFor: (question: string) => Promise<any>; // raw item with perspective
};

export type ServiceState = {
  current: Scenario | null;
  queue: Scenario[];
  status: 'idle' | 'loading' | 'swapping' | 'error';
  error: string | null;
};

export class AskService {
  private state: ServiceState = { current: null, queue: [], status: 'idle', error: null };
  private listeners = new Set<(s: ServiceState) => void>();
  private inflight = false;
  private lru = new Set<string>();

  constructor(private userId: string, private gens: Generators) {}

  subscribe(fn: (s: ServiceState) => void) {
    this.listeners.add(fn);
    fn(this.snapshot());
    return () => this.listeners.delete(fn);
  }

  private snapshot(): ServiceState {
    return { ...this.state, queue: [...this.state.queue] };
  }

  private emit() {
    const snap = this.snapshot();
    this.listeners.forEach((fn) => fn(snap));
    try {
      const uid = this.userId || 'anon';
      sessionStorage.setItem(`ap:${uid}`, JSON.stringify({ current: snap.current, queue: snap.queue }));
    } catch {}
  }

  private pushUnique(items: Scenario[]) {
    for (const it of items) {
      if (!it) continue;
      if (this.lru.has(it.hash)) continue;
      this.state.queue.push(it);
      this.lru.add(it.hash);
      if (this.lru.size > 50) {
        const [first] = Array.from(this.lru);
        if (first) this.lru.delete(first);
      }
    }
  }

  hydrateFromSession() {
    try {
      const uid = this.userId || 'anon';
      const raw = sessionStorage.getItem(`ap:${uid}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (parsed?.current) this.state.current = normalizeScenario(parsed.current);
      const q = Array.isArray(parsed?.queue) ? parsed.queue.map(normalizeScenario) : [];
      this.state.queue = q;
      q.forEach((i) => this.lru.add(i.hash));
      this.state.status = this.state.current ? 'idle' : 'loading';
      this.emit();
      return !!this.state.current;
    } catch {
      return false;
    }
  }

  async loadInitial(count = 6) {
    this.state.status = 'loading';
    this.emit();
    try {
      let items = (await seedTake(this.userId, count)).map(normalizeScenario).filter(Boolean);
      if (!items.length) {
        const gen = await this.gens.generateScenarios(Math.max(1, count));
        items = gen.map(normalizeScenario).filter(Boolean);
      }
      this.state.current = items.shift() ?? null;
      this.state.queue = [];
      this.pushUnique(items);
      this.state.status = this.state.current ? 'idle' : 'error';
      this.emit();
      // Background ensure
      if (this.state.current) this.ensure(3).catch(() => {});
    } catch (e: any) {
      this.state.status = 'error';
      this.state.error = String(e?.message ?? e);
      this.emit();
    }
  }

  async ensure(min = 3) {
    if (this.inflight || this.state.queue.length >= min) return;
    this.inflight = true;
    try {
      const need = Math.max(0, min - this.state.queue.length);
      let more = (await seedTake(this.userId, Math.max(6, need))).map(normalizeScenario).filter(Boolean);
      if (more.length < need) {
        const gen = await this.gens.generateScenarios(need - more.length);
        more = [...more, ...gen.map(normalizeScenario).filter(Boolean)];
      }
      this.pushUnique(more);
      this.emit();
    } finally {
      this.inflight = false;
    }
  }

  async advance() {
    // Swap only when next exists; never clear current preemptively
    const next = this.state.queue.shift() ?? null;
    if (!next) {
      // Ensure and wait for one item
      this.state.status = 'loading';
      this.emit();
      await this.ensure(1);
      const after = this.state.queue.shift() ?? null;
      if (!after) {
        this.state.status = 'idle';
        this.emit();
        return;
      }
      this.state.status = 'swapping';
      const prev = this.state.current;
      this.state.current = after;
      this.emit();
      this.state.status = 'idle';
      this.emit();
      const id = prev?.id;
      if (id) seedConsume([id]).catch(() => {});
      // Refill in background
      this.ensure(3).catch(() => {});
      return;
    }
    this.state.status = 'swapping';
    const prev = this.state.current;
    this.state.current = next;
    this.emit();
    this.state.status = 'idle';
    this.emit();
    const id2 = prev?.id;
    if (id2) seedConsume([id2]).catch(() => {});
    this.ensure(3).catch(() => {});
  }

  async askCustom(question: string) {
    this.state.status = 'loading';
    this.emit();
    try {
      const raw = await this.gens.generatePerspectiveFor(question);
      const scenario = normalizeScenario({ ...raw, question });
      const prev = this.state.current;
      this.state.current = scenario;
      this.state.status = 'idle';
      this.emit();
      const id3 = prev?.id;
      if (id3) seedConsume([id3]).catch(() => {});
    } catch (e: any) {
      this.state.status = 'error';
      this.state.error = String(e?.message ?? e);
      this.emit();
    }
  }
}
