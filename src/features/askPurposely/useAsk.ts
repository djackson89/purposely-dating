import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { AskService, type ServiceState } from './service';
import { normalizeScenario } from './types';

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
  const { getAIResponse, getPurposelyPerspective } = useRelationshipAI();
  const userId = user?.id || 'anon';

  const serviceRef = useRef<AskService | null>(null);
  const [state, setState] = useState<ServiceState>({ current: null, queue: [], status: 'loading', error: null });

  const gens = useMemo(() => ({
    generateScenarios: async (n: number) => {
      // Try to generate n scenarios; fallback to single if needed
      const items: any[] = [];
      for (let i = 0; i < Math.max(1, n); i++) {
        try {
          const prompt = `Create a JSON object with keys question, perspective, tags that reflects a realistic modern dating or relationship dilemma for a ${userProfile.gender || 'woman'} in ${userProfile.relationshipStatus || 'a relationship'}. Keep it concise but specific. Respond with JSON only.`;
          const raw = await getAIResponse(prompt, userProfile, 'therapy');
          const match = raw.match(/\{[\s\S]*\}/);
          const parsed = match ? JSON.parse(match[0]) : {};
          items.push(parsed);
        } catch {
          // Degrade: synthesize a question, then ask purposely generator
          const syntheticQ = `He cancels plans last-minute but keeps texting like nothing happened. I feel disrespected but don’t want drama. What should I say or do?`;
          const res = await getPurposelyPerspective(syntheticQ, userProfile, {
            audience: (userProfile.gender === 'man' ? 'man' : 'woman') as any,
            spice_level: 3,
            length: 'standard',
            topic_tags: ['boundaries']
          });
          items.push({ question: syntheticQ, perspective: res.rendered, tags: ['boundaries'] });
        }
      }
      return items;
    },
    generatePerspectiveFor: async (question: string) => {
      const res = await getPurposelyPerspective(question, userProfile, {
        audience: (userProfile.gender === 'man' ? 'man' : 'woman') as any,
        spice_level: 3,
        length: 'standard',
        topic_tags: []
      });
      return { question, perspective: res.rendered, tags: res.json?.actions || [] };
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
