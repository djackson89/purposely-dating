import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useAuth } from '@/hooks/useAuth';
import { AskPurposelyService, Scenario } from '@/services/AskPurposelyService';

export interface AskItem {
  id?: string;
  question: string;
  answer: string;
  tags?: string[];
}

export interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

// Queue target and refill thresholds
const TARGET_PREFETCH = 6;
const REFILL_THRESHOLD = 3;

export const useAskPurposely = (userProfile: OnboardingData) => {
  const { getAIResponse } = useRelationshipAI();
  const { user } = useAuth();

  const userKey = useMemo(() => user?.id || 'anon', [user?.id]);
  const serviceRef = useRef<AskPurposelyService | null>(null);

  const [queue, setQueue] = useState<Scenario[]>([]);
  const [current, setCurrent] = useState<Scenario | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize service once per userKey
  useEffect(() => {
    serviceRef.current = new AskPurposelyService({
      userKey,
      telemetry: localStorage.getItem('ap_telemetry_off') !== '1',
      getAIResponse,
      userProfile,
    });
    // Rehydrate
    const persisted = serviceRef.current.loadPersistedQueue();
    if (persisted.length) {
      setQueue(persisted);
      setCurrent(persisted[0]);
      setIsLoading(false);
    } else {
      setQueue([]);
      setCurrent(null);
      setIsLoading(true);
    }

    // Prefetch on mount
    let mounted = true;
    const prefetch = async () => {
      try {
        const svc = serviceRef.current!;
        const fresh = await svc.prefetch(TARGET_PREFETCH);
        if (!mounted) return;
        const merged = [...(persisted.length ? persisted : []), ...fresh].slice(0, TARGET_PREFETCH);
        setQueue(merged);
        setCurrent(merged[0] ?? null);
        svc.saveQueue(merged);
      } catch (e) {
        console.warn('AskPurposely prefetch failed', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    prefetch();
    return () => {
      mounted = false;
      serviceRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userKey]);

  // Refill in background when queue below threshold
  const ensureRefill = useCallback(async () => {
    const svc = serviceRef.current!;
    if (!svc) return;
    if (queue.length >= REFILL_THRESHOLD) return;
    try {
      const fresh = await svc.prefetch(TARGET_PREFETCH - queue.length);
      const merged = [...queue, ...fresh].slice(0, TARGET_PREFETCH);
      setQueue(merged);
      svc.saveQueue(merged);
      console.info('telemetry:queue_refilled', { size: merged.length });
    } catch (e) {
      console.warn('AskPurposely refill failed', e);
    }
  }, [queue]);

  const nextScenario = useCallback(async () => {
    console.info('telemetry:seemore_click', { size_before: queue.length });
    setError(null);

    // Pop next if available
    if (queue.length > 1) {
      const [, ...rest] = queue;
      const next = rest[0] ?? null;
      setQueue(rest);
      setCurrent(next);
      serviceRef.current?.saveQueue(rest);
      ensureRefill();
      return;
    }

    // Queue empty or single leftover — generate one immediately
    setIsGenerating(true);
    try {
      const svc = serviceRef.current!;
      if (queue.length === 1) {
        // Consume the last one and immediately generate next to show
        const last = queue[0];
        setQueue([]);
        setCurrent(last);
        serviceRef.current?.saveQueue([]);
      }

      try {
        const one = await svc.generateOne();
        const newQueue = [one];
        setQueue(newQueue);
        setCurrent(one);
        svc.saveQueue(newQueue);
        // Background prefill to target
        ensureRefill();
      } catch (firstErr) {
        console.warn('Generate failed, auto-retrying once...', firstErr);
        // Toast responsibility is in component via error state; just try once more
        const one = await svc.generateOne();
        const newQueue = [one];
        setQueue(newQueue);
        setCurrent(one);
        svc.saveQueue(newQueue);
        ensureRefill();
      }
    } catch (e) {
      console.error('AskPurposely generation error', e);
      setError('Couldn\'t load a new scenario.');
    } finally {
      setIsGenerating(false);
    }
  }, [queue, ensureRefill]);

  const reload = useCallback(async (resetIndex = true, forceFresh = false) => {
    // Back-compat with previous callers
    setIsLoading(true);
    try {
      const svc = serviceRef.current!;
      const fresh = await svc.prefetch(TARGET_PREFETCH);
      const merged = fresh.slice(0, TARGET_PREFETCH);
      setQueue(merged);
      setCurrent(merged[0] ?? null);
      svc.saveQueue(merged);
    } catch (e) {
      console.warn('AskPurposely reload failed', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Public API
  const items: AskItem[] = queue.map((s) => ({ id: s.id, question: s.question, answer: s.perspective, tags: s.tags }));
  const currentItem: AskItem = current
    ? { id: current.id, question: current.question, answer: current.perspective, tags: current.tags }
    : items[0] || { question: '', answer: '' };

  return {
    items,
    current: currentItem,
    index: 0,
    setIndex: () => {},
    nextScenario,
    reload,
    isLoading,
    isGenerating,
    error,
  } as const;
};
