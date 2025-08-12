import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AskService, type ServiceState } from './service';
import { generateScenarios as genScenarios, generatePerspectiveFor as genPerspective } from './gen';

export interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

// Public API mirrors previous hook to avoid UI changes
export function useAskPurposelyFeature(userProfile: OnboardingData) {
  const { user } = useAuth();
  const userId = user?.id || 'anon';

  const serviceRef = useRef<AskService | null>(null);
  const [state, setState] = useState<ServiceState>({ current: null, queue: [], status: 'loading', error: null });

  const audience: 'woman' | 'man' | 'unspecified' = (userProfile.gender === 'man' ? 'man' : userProfile.gender === 'woman' ? 'woman' : 'unspecified');
  const baseOpts = { audience, spice_level: 3, length: 'long' as const, topic_tags: [] as string[] };

  const gens = useMemo(() => ({
    generateScenarios: async (n: number) => {
      try {
        const items = await genScenarios(Math.max(1, n), baseOpts);
        return items;
      } catch {
        // Fallback: single perspective for a synthetic question
        const syntheticQ = "He cancels plans last-minute but keeps texting like nothing happened. I feel disrespected but don’t want drama. What should I say or do?";
        const one = await genPerspective(syntheticQ, { ...baseOpts, topic_tags: ['boundaries'] });
        return [{ question: one.question, perspective: one.perspective, tags: ['boundaries'] }];
      }
    },
    generatePerspectiveFor: async (question: string) => {
      const s = await genPerspective(question, baseOpts);
      return { question: s.question, perspective: s.perspective, tags: s.tags } as any;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [userId, userProfile.gender, userProfile.relationshipStatus]);

  // Initialize service
  useEffect(() => {
    const svc = new AskService(userId, gens);
    serviceRef.current = svc;

    const unsub = svc.subscribe((s) => setState(s));

    // Hydrate fast if possible; then load/ensure
    const had = svc.hydrateFromSession();
    svc.loadInitial(had ? 4 : 6);

    return () => {
      unsub();
      serviceRef.current = null;
    };
  }, [userId, gens]);

  const nextScenario = useCallback(async () => {
    await serviceRef.current?.advance();
  }, []);

  const refresh = useCallback(async () => {
    // Soft refresh: refill in background without flipping UI to loading
    await serviceRef.current?.ensure(6);
  }, []);

  const currentItem = useMemo(() => {
    const c = state.current;
    return c ? { id: c.id, question: c.question, answer: c.perspective, tags: c.tags } : { id: 'none', question: '', answer: '' } as any;
  }, [state.current]);

  return {
    current: currentItem,
    nextScenario,
    refresh,
    isLoading: state.status === 'loading' || !state.current,
    isSwapping: state.status === 'swapping',
    error: state.error,
  } as const;
}
