import { useState, useEffect, useCallback } from 'react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';

export interface AskItem {
  question: string;
  answer: string;
}

export interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const CACHE_VERSION = 'v3';
const SCENARIO_TTL_HOURS = 6;

// Fallback scenarios in case AI fails
const fallbackScenarios: AskItem[] = [
  {
    question: `Two months ago, things felt easy. Now my boyfriend keeps working "late" and coming home showered, saying, "Don’t start, I’m exhausted." I brushed it off—until I recognized the cologne on his hoodie that isn’t his… it’s the one I bought for his best friend last Christmas. When I asked, he said they’ve been training together at the gym. Then I found a receipt for a fancy wine bar, two glasses. He swears it was a client. I want to believe him, but my stomach is in knots. Am I wrong for feeling like I’m being slowly gaslit?`,
    answer: 'Your body caught the truth before your brain did—listen to it. Ask for full transparency (receipts, calendars, a call with the “client”), and set a hard boundary: no more mystery nights. If he resists clarity, that’s your answer—protect your peace and leave.'
  },
  {
    question: `At brunch, my fiancé passed his phone to me to show a meme, and I accidentally saw a group chat with his groomsmen titled "Operation Upgrade." They were rating bridesmaids and joking about who he "could have pulled if he waited." My fiancé sent a laughing emoji and said, "Relax, it’s just guy stuff." But last night, he asked if we could make the wedding party "more balanced" and add one of his ex situationships. I feel humiliated. Should I call off the wedding or am I overreacting to dumb jokes?`,
    answer: 'He didn’t shut down the disrespect because, on some level, he enjoys it. Require a firm line: no objectifying chat, no ex in the bridal party, and accountability from him to clean up his circle. If he minimizes you again, this isn’t a wedding issue—it’s a values mismatch.'
  },
  {
    question: `I was folding laundry when I found a tiny velvet pouch in my boyfriend’s jacket—inside was a ring. My heart dropped… until I realized it was engraved with another woman’s initials. He admitted it was the ring he never got to propose with years ago and said he kept it "for closure." Last week he asked my ring size "for fun." Now I don’t know if I’m the real choice or just the second chance. How do I even begin to trust again?`,
    answer: 'You can’t build a new chapter while he’s still clutching a relic from the last one. Ask him to release the ring and discuss why he’s keeping doors cracked open. If he can’t choose you cleanly, you can choose yourself.'
  }
];

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const seedBank = `
The Wedding Photographer — My fiancé wants to hire his ex to shoot our wedding; says I’m insecure.
The Secret Family Trip — He took our kids on a trip with his sister while I was away; called it a ‘break for me.’
The Late-Night Messages — He texts his coworker goodnight nightly; says she needs support.
The Graduation Ultimatum — Stepdad won’t attend unless bio dad stays home.
The Surprise Baby — Boyfriend’s ex is pregnant; he wants me to stay and help raise the baby.
The Debt Collector — Wife used joint savings to pay brother’s gambling debts in secret.
The Bedroom Dealbreaker — Partner wants to open the relationship or he’s ‘not attracted.’
The Uninvited Ex — Boyfriend invited his ex to my birthday ‘to keep the peace.’
The Parenting Clash — I undermined a grounding; now trust is broken with my husband.
The Anniversary Gift — Wife reused a card she wrote to her ex.
The Name Tattoo — Girlfriend still has her ex’s name tattooed.
The Secret Guest Room — Husband secretly let coworker stay in our home.
The Forgotten Funeral — Boyfriend skipped my mom’s funeral for a festival.
The Engagement Switch — He proposed with the ring he once bought for his ex.
The Hospital Secret — He stayed at dinner with a female friend while I went into labor.
The Job Opportunity — Girlfriend wants a break to ‘fully experience’ an overseas job.
The Shared Account — He uses a profile with his ex’s name and fresh watch history.
The Bridal Party Snub — Fiancé refuses to include my brother in the wedding party.
The Secret Retirement Fund — Wife hid a six-figure fund ‘for security in case we divorce.’
The Jealous Best Friend — Husband says I must drop my male best friend.
The Pet Dilemma — Girlfriend wants to give away my dog.
The Password Change — Partner changed all passwords for ‘privacy.’
The Public Proposal — He proposed at a stadium knowing I hate attention.
The Silent Treatment — Wife hasn’t spoken to me for two weeks after a fight.
The Shared Grave Plot — Husband keeps a joint grave plot with his ex-wife.
`;

const buildScenarioPrompt = () => `You are writing fictional, anonymous, user-submitted relationship and dating dilemmas for a section called "Ask Purposely".
Your goal is to produce endless, emotionally gripping, debate-inducing scenarios that feel real enough for readers to believe someone actually submitted them for advice.

Return a STRICT JSON array with exactly 6 objects, each exactly: {"question": "...", "answer": "..."}.
No markdown, no backticks, no labels, no extra commentary.

Tone & Style Rules:
- Every scenario must feel like a mini soap opera—messy, human, and layered with conflicting emotions.
- Avoid generic or cliché setups. Add vivid, specific details that make the situation feel authentic.
- Some scenarios should be rage-baiting—designed to spark outrage or heated debates in the comments.
- Others should feel morally ambiguous, where the audience could reasonably side with either person involved.
- The narrator should speak in a first-person, confessional tone, as if venting to a trusted friend or anonymous advice column.
- End with a direct question to the audience, showing vulnerability, frustration, or confusion.

Content Variety & Emotional Hooks:
- Mix light drama with high-stakes situations.
- Include twists or reveals that change the context halfway through.
- Use real-life relationship triggers: betrayal, secrecy, intimacy issues, family interference, money problems, trust, jealousy, boundaries, emotional labor, mismatched values, and life-changing decisions.
- Avoid anything that would immediately make one side obviously “evil”—the best posts make the reader think.

Formatting Requirements for question:
- Start with a short context sentence setting the stage.
- Unfold the situation with emotional beats and occasional dialogue using quotes.
- Include at least one gut-punch reveal or surprising fact.
- End with a short, raw, emotional question such as: "Am I wrong for feeling this way?", "Should I leave or try to fix this?", or "How do I even begin to trust again?"

Answer (Purposely Perspective) rules:
- 5–7 sentences only.
- Start with a sharp, declarative line that frames the real dynamic; then validate her feelings, name the pattern/red flag, and offer one decisive boundary or next step.
- Prioritize angles like accountability, clarity, boundaries, reciprocity, consistency, honesty, empathy, conflict-resolution, and values alignment.
- Keep it punchy, cinematic, and quotable—use vivid, memorable phrasing and avoid clichés. Do NOT use the exact phrase "emotional maturity".
- Voice: compassionate but uncompromising; direct, assertive, and practical—similar in tone to the provided scripts (hooks, clean lines, zero hedging).

Use the following seed scenarios ONLY as inspiration so outputs stay fresh and varied. Do not reuse wording:
${seedBank}`;

export const useAskPurposely = (userProfile: OnboardingData) => {
  const { getAIResponse } = useRelationshipAI();
  const [items, setItems] = useState<AskItem[]>([]);
  const [index, setIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const todayKey = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const loadOrGenerate = useCallback(async (resetIndex: boolean, forceFresh = false) => {
    setIsLoading(true);
    const key = todayKey();
    const storageKey = `askPurposelyScenarios_${key}_${CACHE_VERSION}`;
    const tsKey = `askPurposelyGeneratedAt_${key}_${CACHE_VERSION}`;

    if (!forceFresh) {
      const cached = localStorage.getItem(storageKey);
      const ts = Number(localStorage.getItem(tsKey) || '0');
      const ageMs = Date.now() - ts;
      const ttlMs = SCENARIO_TTL_HOURS * 60 * 60 * 1000;
      if (cached && ts && ageMs < ttlMs) {
        try {
          const parsed = JSON.parse(cached) as AskItem[];
          setItems(parsed);
          if (resetIndex) setIndex(0);
          setIsLoading(false);
          return;
        } catch {}
      }
    }

    try {
      const prompt = buildScenarioPrompt();
      const raw = await getAIResponse(prompt, userProfile, 'therapy');
      let parsed: any = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw?.match(/\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      const cleaned: AskItem[] = (Array.isArray(parsed) ? parsed : fallbackScenarios)
        .map((i: any) => ({
          question: String(i?.question || '').trim().replace(/^[["']|["']]$/g, ''),
          answer: String(i?.answer || '').trim().replace(/^[["']|["']]$/g, ''),
        }))
        .filter((i) => i.question && i.answer)
        .slice(0, 6);

      const finalList = cleaned.length >= 3 ? cleaned : shuffle(fallbackScenarios);
      setItems(finalList);
      localStorage.setItem(storageKey, JSON.stringify(finalList));
      localStorage.setItem(tsKey, String(Date.now()));
      if (resetIndex) setIndex(0);
    } catch (e) {
      console.error('AskPurposely generation failed:', e);
      setItems(shuffle(fallbackScenarios));
      if (resetIndex) setIndex(0);
    } finally {
      setIsLoading(false);
    }
  }, [getAIResponse, userProfile]);

  useEffect(() => {
    loadOrGenerate(false);
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const timer = setTimeout(() => loadOrGenerate(true), next.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [loadOrGenerate]);

  const nextScenario = useCallback(() => {
    if (items.length) {
      const nextIdx = (index + 1) % items.length;
      if (nextIdx === 0) {
        // Reached the end — generate a fresh new set so it feels endless
        loadOrGenerate(true, true);
        return;
      }
      setIndex(nextIdx);
      const today = new Date().toDateString();
      localStorage.setItem(`dailyScenarioIndex_${today}`, String(nextIdx));
    } else {
      // No items yet — generate immediately
      loadOrGenerate(true, true);
    }
  }, [items.length, index, loadOrGenerate]);

  const current = items[index] || fallbackScenarios[0];

  return { items, current, index, setIndex, nextScenario, reload: loadOrGenerate, isLoading };
};
