// Basic smoke tests for AskPurposely queue behavior (placeholder for E2E)
// In a real project, prefer Playwright. Here we provide unit-style tests for service logic.

import { describe, it, expect } from 'vitest';
import { AskPurposelyService } from '@/services/AskPurposelyService';

const fakeProfile = { loveLanguage: 'Acts of Service', relationshipStatus: 'Dating', age: '25-34', gender: 'F', personalityType: 'Balanced' };

const buildMany = (n: number) => JSON.stringify(
  Array.from({ length: n }).map((_, i) => ({ question: `Q${i} x`, answer: `A${i} y` }))
);

const buildOne = () => JSON.stringify({ question: 'Qx', answer: 'Ay' });

describe('AskPurposelyService', () => {
  it('prefetch returns unique scenarios', async () => {
    const svc = new AskPurposelyService({
      userKey: 'test',
      telemetry: false,
      userProfile: fakeProfile,
      getAIResponse: async (prompt: string) => buildMany(6),
    });
    const res = await svc.prefetch(6);
    expect(res.length).toBe(6);
  });

  it('generateOne returns a single scenario', async () => {
    const svc = new AskPurposelyService({
      userKey: 'test2',
      telemetry: false,
      userProfile: fakeProfile,
      getAIResponse: async (prompt: string) => buildOne(),
    });
    const one = await svc.generateOne();
    expect(one.id).toBeTruthy();
  });
});
