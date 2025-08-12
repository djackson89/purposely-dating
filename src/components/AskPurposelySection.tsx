import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useAskPurposelyFeature, OnboardingData } from '@/features/askPurposely/useAsk';
import { Skeleton } from '@/components/ui/skeleton';
import { truncate } from '@/lib/ask/utils';

interface Props {
  userProfile: OnboardingData & { first_name?: string; full_name?: string };
  sneakPeekTracking?: any;
  onPaywallTrigger?: (trigger: 'ask_purposely') => void;
}

const AskPurposelySection: React.FC<Props> = ({ userProfile, sneakPeekTracking, onPaywallTrigger }) => {
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();
  const { current, nextScenario, refresh, isLoading, isSwapping, error } = useAskPurposelyFeature(userProfile);

  const [showInput, setShowInput] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

// Force-refresh on first mount so the new tone is shown immediately
useEffect(() => {
  refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Surface generation errors with a retry toast
useEffect(() => {
  if (error) {
    toast({
      title: "Couldn't load a new scenario. Retrying…",
      description: 'We\'ll try once more automatically. If it fails, tap Try Again.',
      variant: 'destructive',
    });
  }
}, [error, toast]);

  const handleAskYourQuestion = () => {
    if (sneakPeekTracking?.shouldShowPaywallForAskPurposely()) {
      onPaywallTrigger?.('ask_purposely');
      return;
    }
    setShowInput(true);
    setAnswer('');
    setQuestion('');
  };

  const handleSubmit = async () => {
    if (sneakPeekTracking?.shouldShowPaywallForAskPurposely()) {
      onPaywallTrigger?.('ask_purposely');
      return;
    }

    if (!question.trim()) {
      toast({ title: 'Please enter a question', description: "We'd love to give you our Purposely Perspective!", variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const prompt = `Provide a Purposely Perspective (5–7 sentences) to this first-person dilemma from a woman: "${question}"\n\nRules:\n- Open with a sharp, declarative line that frames the real dynamic.\n- Validate her feelings, name the pattern/red flag, and offer one decisive boundary or next step.\n- Prioritize angles: accountability, clarity, boundaries, reciprocity, consistency, honesty, empathy, conflict-resolution, values alignment.\n- Keep it punchy, quotable, and assertive—similar in tone to the provided scripts (hooks, clean lines, zero hedging).\n- Avoid clichés; do NOT use the exact phrase "emotional maturity". No disclaimers or therapy-speak.`;
      const resp = await getAIResponse(prompt, userProfile, 'therapy');
      setAnswer(resp);
    } catch (e) {
      toast({ title: 'Oops!', description: "We couldn't get your Purposely Perspective right now. Please try again.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-romance border-primary/20" data-tour="ask-purposely">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5 text-primary animate-heart-pulse" />
          <span>Ask Purposely</span>
        </CardTitle>
      </CardHeader>
<CardContent className="space-y-4" aria-live="polite">
        {!showInput ? (
          <>
            <div className="space-y-4">
              {(isLoading || isSwapping) ? (
                <>
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Submitted by: Anonymous</p>
                  </div>
                  <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                    <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {String(current.question || '').trim() && String(current.answer || '').trim() ? (
                    <>
                      <div key={String(current.id || truncate(`${current.question}::${current.answer}`, 16))} className="p-4 bg-white rounded-lg border border-border">
                        <p className="text-foreground leading-relaxed font-medium">"{current.question}"</p>
                        <p className="text-xs text-muted-foreground mt-2">Submitted by: Anonymous</p>
                      </div>
                      <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                        <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                        <p className="text-foreground leading-relaxed font-bold">{current.answer}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-white rounded-lg border border-border">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-5/6" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Submitted by: Anonymous</p>
                      </div>
                      <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                        <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-4/5" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={nextScenario}
                onTouchEnd={(e) => { e.preventDefault(); nextScenario(); }}
                variant="romance"
                className="flex-1"
                disabled={isLoading || isSwapping}
                aria-label="See more Ask Purposely scenarios"
              >
                {isLoading || isSwapping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating…
                  </>
                ) : (
                  'See More'
                )}
              </Button>
              <Button onClick={handleAskYourQuestion} variant="romance" className="flex-1">
                <Send className="w-4 h-4 mr-2" />
                Ask Your Question
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe what's happening (what was said or done, why it felt triggering or offensive, and what outcome you want)."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-[100px]"
              />

              {answer && (
                <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                  <p className="text-foreground leading-relaxed font-bold">{answer}</p>
                </div>
              )}

              <div className="flex space-x-2">
                <Button onClick={handleSubmit} variant="romance" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting Perspective...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Get Purposely Perspective
                    </>
                  )}
                </Button>
                <Button onClick={() => setShowInput(false)} variant="soft">Back</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AskPurposelySection;
