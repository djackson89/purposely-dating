import { sha256 } from 'js-sha256';
import { QotdItem } from './types';

const PROFANE = [
  'fuck','shit','bitch','asshole','dick','pussy','cunt','bastard','slut','whore'
];

export function isClean(text: string): boolean {
  const t = text.toLowerCase();
  return !PROFANE.some(w => new RegExp(`\\b${w}\\b`, 'i').test(t));
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}

export function hashQuestion(q: string): string {
  return sha256(q.trim().toLowerCase());
}

export function getWeekKey(d = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

export function getHistory(): { date: string; hash: string; tags: string[] }[] {
  try { return JSON.parse(localStorage.getItem('qotd_history') || '[]'); } catch { return []; }
}

export function saveHistory(entry: { date: string; hash: string; tags: string[] }) {
  const hist = getHistory().filter(h => daysBetween(new Date(h.date), new Date()) <= 120);
  hist.push(entry);
  localStorage.setItem('qotd_history', JSON.stringify(hist));
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((+b - +a) / 86400000);
}

export function dedupe(items: QotdItem[]): QotdItem[] {
  const seen = new Set<string>();
  const hist = getHistory();
  const histHashes = new Set(hist.map(h => h.hash));
  return items.filter(it => {
    const h = hashQuestion(it.question);
    if (seen.has(h)) return false;
    seen.add(h);
    return !histHashes.has(h);
  });
}

export function pickForWeek(items: QotdItem[]): QotdItem | null {
  if (!items.length) return null;
  const weekKey = getWeekKey();
  const key = `qotd_week_tags_${weekKey}`;
  const used: string[] = (() => { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } })();
  const usedSet = new Set(used);
  // Prefer an item that adds a new tag to the week set
  const preferred = items.find(it => (it.tags || []).some(t => !usedSet.has(t)) ) || items[0];
  // Update storage
  const tagToAdd = (preferred.tags || []).find(t => !usedSet.has(t));
  if (tagToAdd) {
    used.push(tagToAdd);
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(used)).slice(0, 10)));
  }
  return preferred;
}

export function validateItems(items: QotdItem[]): QotdItem[] {
  return items.filter(it => {
    const wc = wordCount(it.question);
    return wc >= 14 && wc <= 28 && isClean(it.question);
  });
}
