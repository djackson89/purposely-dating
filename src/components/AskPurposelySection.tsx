import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useAskPurposely, OnboardingData } from '@/hooks/useAskPurposely';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  userProfile: OnboardingData & { first_name?: string; full_name?: string };
  sneakPeekTracking?: any;
  onPaywallTrigger?: (trigger: 'ask_purposely') => void;
}

const AskPurposelySection: React.FC<Props> = ({ userProfile, sneakPeekTracking, onPaywallTrigger }) => {
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();
  const { current, nextScenario, isLoading, items } = useAskPurposely(userProfile);

  const [showInput, setShowInput] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

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
      const prompt = `Provide a short Purposely Perspective (2–3 sentences) to this first-person dilemma from a woman: "${question}"\n\nRules:\n- Validate her feelings, name the dynamic/red flag, suggest one clear boundary or next step.\n- Choose 1–2 angles: accountability, clarity, boundaries, reciprocity, consistency, honesty, empathy, conflict-resolution, alignment of values.\n- Avoid clichés; do NOT use the exact phrase "emotional maturity".\n- Loving, witty, direct tone. Strong opener, quote-worthy lines.`;
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
      <CardContent className="space-y-4">
        {!showInput ? (
          <>
            <div className="space-y-4">
              {isLoading && items.length === 0 ? (
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
                  <div className="p-4 bg-white rounded-lg border border-border">
                    <p className="text-foreground leading-relaxed font-medium">"{current.question}"</p>
                    <p className="text-xs text-muted-foreground mt-2">Submitted by: Anonymous</p>
                  </div>
                  <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                    <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                    <p className="text-foreground leading-relaxed font-bold">{current.answer}</p>
                  </div>
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <Button onClick={nextScenario} variant="romance" className="flex-1" disabled={isLoading || items.length === 0}>See More</Button>
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
