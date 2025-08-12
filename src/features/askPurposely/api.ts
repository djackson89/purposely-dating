import { supabase } from '@/integrations/supabase/client';

// Fetch up to n seeds from ap_seed as plain strings; UI normalization will coerce shapes
export async function seedTake(userId: string, n: number) {
  try {
    const { data, error } = await supabase
      .from('ap_seed')
      .select('id, question, perspective, tags, hash, created_at')
      .eq('status', 'available')
      .order('created_at', { ascending: true })
      .limit(n);

    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      question: row.question,
      perspective: row.perspective,
      tags: row.tags ?? [],
      hash: row.hash,
      createdAt: row.created_at,
    }));
  } catch (e) {
    console.warn('seedTake failed', e);
    return [] as any[];
  }
}

// Best-effort consume (may fail due to RLS if no RPC; safe to ignore)
export async function seedConsume(ids: string[]) {
  try {
    if (!ids?.length) return;
    await supabase
      .from('ap_seed')
      .update({ status: 'consumed', consumed_at: new Date().toISOString() })
      .in('id', ids);
  } catch (e) {
    // Intentionally swallow; frontend should never crash on RLS
    console.info('seedConsume noop/failed (expected without RPC)', e);
  }
}
