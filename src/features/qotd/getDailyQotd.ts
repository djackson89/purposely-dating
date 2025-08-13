import { supabase } from '@/integrations/supabase/client';
import { QotdItem } from './types';
import { QOTD_SEEDS } from './seeds';
import { dedupe, validateItems, pickForWeek, hashQuestion, saveHistory } from './utils';

export async function getDailyQotd(): Promise<QotdItem> {
  const todayKey = `qotd_${new Date().toDateString()}`;
  const cached = localStorage.getItem(todayKey);
  if (cached) return JSON.parse(cached);

  let items: QotdItem[] = [];
  try {
    const { data, error } = await supabase.functions.invoke('generate-qotd', {
      body: {
        audience: 'woman→man',
        count: 14,
        tone: 'curious, warm, direct, playful-but-substantive',
        depth: 5
      }
    });
    if (error) throw error;
    items = Array.isArray(data) ? data : [];
  } catch {
    items = QOTD_SEEDS;
  }

  // Validate, dedupe against history, enforce weekly rotation, and pick one
  const valid = validateItems(items);
  const unique = dedupe(valid.length ? valid : QOTD_SEEDS);
  const pick = pickForWeek(unique) || QOTD_SEEDS[0];

  // Persist for the day and update history
  localStorage.setItem(todayKey, JSON.stringify(pick));
  const hash = hashQuestion(pick.question);
  saveHistory({ date: new Date().toISOString(), hash, tags: pick.tags || [] });

  return pick;
}
