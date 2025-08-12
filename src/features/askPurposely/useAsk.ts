import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useAuth } from '@/hooks/useAuth';
import { AskPurposelyService, type Scenario } from './service';
import { truncate } from './types';

export interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const TARGET_PREFETCH = 6;
const REFILL_THRESHOLD = 3;
const CLICK_DEBOUNCE_MS = 350;

export function useAskPurposelyFeature(userProfile: OnboardingData) {
  const { getAIResponse } = useRelationshipAI();
  const { user } = useAuth();

  const userKey = useMemo(() => user?.id || 'anon', [user?.id]);

  const serviceRef = useRef<AskPurposelyService | null>(null);
  const [current, setCurrent] = useState<Scenario | null>(null);
  const [queue, setQueue] = useState<Scenario[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'swapping'>('loading');
  const [error, setError] = useState<string | null>(null);
  const lastClickRef = useRef<number>(0);
  const consumedRef = useRef<Set<string>>(new Set());

  // Initialize service once per user
  useEffect(() => {
    serviceRef.current = new AskPurposelyService({
      userKey,
      telemetry: localStorage.getItem('ap_telemetry_off') !== '1',
      getAIResponse,
      userProfile,
    });

    // Try fast path: rehydrate existing queue
    const persisted = serviceRef.current.loadPersistedQueue?.() ?? [];
    if (persisted.length) {
      setCurrent(persisted[0]);
      setQueue(persisted.slice(1));
      setStatus('idle');
    } else {
      setCurrent(null);
      setQueue([]);
      setStatus('loading');
    }

    let mounted = true;
    (async () => {
      try {
        const svc = serviceRef.current!;
        const fresh = await svc.prefetch(TARGET_PREFETCH);
        if (!mounted) return;
        setCurrent(fresh[0] ?? null);
        setQueue(fresh.slice(1));
        svc.saveQueue?.(fresh);
        setStatus('idle');
      } catch (e) {
        console.warn('AskPurposely prefetch failed', e);
        if (mounted) setStatus('idle');
      }
    })();

    return () => {
      serviceRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  // Consume seed once per shown id
  useEffect(() => {
    const id = current?.id;
    if (!id || consumedRef.current.has(id)) return;
    consumedRef.current.add(id);
    serviceRef.current?.consumeIfSeed(id).catch(() => {});
  }, [current?.id]);

  const ensureRefill = useCallback(async () => {
    const svc = serviceRef.current!;
    if (!svc) return;
    try {
      const need = Math.max(0, TARGET_PREFETCH - (queue.length + 1)); // +1 for current
      if (need <= 0) return;
      const fresh = await svc.prefetch(need);
      setQueue((prev) => {
        const merged = [...prev, ...fresh].slice(0, TARGET_PREFETCH - 1);
        svc.saveQueue?.([current!, ...merged].filter(Boolean as any));
        console.info('telemetry:queue_refilled', { size: merged.length + 1 });
        return merged;
      });
    } catch (e) {
      console.warn('AskPurposely refill failed', e);
    }
  }, [queue.length, current]);

  const seeMore = useCallback(async () => {
    const now = Date.now();
    if (now - lastClickRef.current < CLICK_DEBOUNCE_MS) return;
    lastClickRef.current = now;

    setError(null);

    // Case 1: we already have next in queue
    if (queue.length > 0) {
      setQueue((prev) => {
        const [next, ...rest] = prev;
        setCurrent(next);
        serviceRef.current?.saveQueue?.([next!, ...rest]);
        // Background refill
        ensureRefill();
        return rest;
      });
      return;
    }

    // Case 2: queue empty → generate one immediately
    setStatus('loading');
    try {
      const svc = serviceRef.current!;
      const one = await svc.generateOne();
      setCurrent(one);
      setQueue([]);
      svc.saveQueue?.([one]);
      // Background refill
      ensureRefill();
    } catch (e) {
      console.error('AskPurposely generation error', e);
      setError("could_not_load");
    } finally {
      setStatus('idle');
    }
  }, [queue.length, ensureRefill]);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const svc = serviceRef.current!;
      const fresh = await svc.prefetch(TARGET_PREFETCH);
      setCurrent(fresh[0] ?? null);
      setQueue(fresh.slice(1));
      svc.saveQueue?.(fresh);
    } catch (e) {
      console.warn('AskPurposely refresh failed', e);
      setError('refresh_failed');
    } finally {
      setStatus('idle');
    }
  }, []);

  // Public API to component
  const currentItem = current
    ? { id: current.id, question: current.question, answer: current.perspective, tags: current.tags }
    : { id: 'none', question: '', answer: '' } as any;

  return {
    current: currentItem,
    nextScenario: seeMore,
    refresh,
    isLoading: status === 'loading' || !current,
    isSwapping: status === 'swapping',
    error,
  } as const;
}
