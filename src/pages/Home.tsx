import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, MessageCircle, Send, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import QuickStartModule from '@/components/QuickStartModule';
import SideMenu from '@/components/SideMenu';
import WelcomeTour from '@/components/WelcomeTour';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface HomeProps {
  userProfile: OnboardingData & {
    first_name?: string;
    full_name?: string;
  };
  onNavigateToFlirtFuel: () => void;
  onNavigateToAIPractice: (scenario?: string) => void;
  onNavigateToModule?: (module: string) => void;
  sneakPeekTracking?: any;
  onPaywallTrigger?: (trigger: 'view_limit' | 'ask_purposely' | 'next_question') => void;
}

// Module navigation mapping
const moduleNavigationMap = {
  'flirtfuel': 'flirtfuel',
  'therapy': 'therapy',
  'concierge': 'concierge'
};

const Home: React.FC<HomeProps> = ({ userProfile, onNavigateToFlirtFuel, onNavigateToAIPractice, onNavigateToModule, sneakPeekTracking, onPaywallTrigger }) => {
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [purposelyResponse, setPurposelyResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [askScenarios, setAskScenarios] = useState<{ question: string; answer: string }[]>([]);
  
  // Touch/swipe handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();
  const { subscription } = useSubscription();
  const { user } = useAuth();

  // Handle QuickStart module navigation
  const handleQuickStartNavigation = (module: string) => {
    if (onNavigateToModule) {
      switch (module) {
        case 'flirtfuel':
          onNavigateToModule('flirtfuel');
          break;
        case 'therapy':
          onNavigateToModule('therapy');
          break;
        case 'concierge':
          onNavigateToModule('concierge');
          break;
        default:
          onNavigateToModule('flirtfuel');
      }
    } else {
      // Fallback to existing behavior
      switch (module) {
        case 'flirtfuel':
          onNavigateToFlirtFuel();
          break;
        case 'therapy':
          toast({
            title: "Therapy Companion! 💝",
            description: "Navigate via the bottom menu to access this feature!",
          });
          break;
        case 'concierge':
          toast({
            title: "Date Planner! 📅",
            description: "Navigate via the bottom menu to access this feature!",
          });
          break;
        default:
          onNavigateToFlirtFuel();
      }
    }
  };

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Relationship Talk conversation starters
  const relationshipTalkQuestions = [
    "What's something about your childhood that shaped who you are today?",
    "If you could change one thing about how you were raised, what would it be?",
    "What's your biggest fear when it comes to relationships?",
    "How do you handle conflict in relationships?",
    "What's the most important quality you look for in a long-term partner?",
    "What does emotional intimacy mean to you?",
    "How do you know when you're truly comfortable with someone?",
    "What's something you've learned about love from watching your parents?",
    "What role does vulnerability play in your relationships?",
    "How do you maintain your individuality while being in a relationship?",
    "What's your perspective on forgiveness in relationships?",
    "How do you handle jealousy or insecurity?",
    "What does 'being supportive' look like to you in a relationship?",
    "What's something you're still working on about yourself in relationships?",
    "How important is shared values versus shared interests in a partnership?"
  ];

  // Hypothetical Ask Purposely scenarios
  const defaultPurposelyScenarios = [
    {
      question: `Two months ago, things felt easy. Now my boyfriend keeps working "late" and coming home showered, saying, "Don’t start, I’m exhausted." I brushed it off—until I recognized the cologne on his hoodie that isn’t his… it’s the one I bought for his best friend last Christmas. When I asked, he said they’ve been training together at the gym. Then I found a receipt for a fancy wine bar, two glasses. He swears it was a client. I want to believe him, but my stomach is in knots. Am I wrong for feeling like I’m being slowly gaslit?`,
      answer: "Your body caught the truth before your brain did—listen to it. Ask for full transparency (receipts, calendars, a call with the ‘client’), and set a hard boundary: no more mystery nights. If he resists clarity, that’s your answer—protect your peace and leave." 
    },
    {
      question: `At brunch, my fiancé passed his phone to me to show a meme, and I accidentally saw a group chat with his groomsmen titled "Operation Upgrade." They were rating bridesmaids and joking about who he "could have pulled if he waited." My fiancé sent a laughing emoji and said, "Relax, it’s just guy stuff." But last night, he asked if we could make the wedding party "more balanced" and add one of his ex situationships. I feel humiliated. Should I call off the wedding or am I overreacting to dumb jokes?`,
      answer: "He didn’t shut down the disrespect because, on some level, he enjoys it. Require a firm line: no objectifying chat, no ex in the bridal party, and accountability from him to clean up his circle. If he minimizes you again, this isn’t a wedding issue—it’s a values mismatch." 
    },
    {
      question: `I was folding laundry when I found a tiny velvet pouch in my boyfriend’s jacket—inside was a ring. My heart dropped… until I realized it was engraved with another woman’s initials. He admitted it was the ring he never got to propose with years ago and said he kept it "for closure." Last week he asked my ring size "for fun." Now I don’t know if I’m the real choice or just the second chance. How do I even begin to trust again?`,
      answer: "You can’t build a new chapter while he’s still clutching a relic from the last one. Ask him to release the ring and discuss why he’s keeping doors cracked open. If he can’t choose you cleanly, you can choose yourself." 
    },
    {
      question: `My husband told me he was "helping a coworker through a hard time." I met her at a company event—she hugged him a beat too long and called him her "rock." I tried to let it go… until I found a blanket and toiletries in our trunk because he’s been letting her nap on our couch "between shifts." He says I’m heartless for not wanting her around. Am I wrong for drawing a hard boundary?`,
      answer: "Compassion doesn’t require access to your home or husband. Your boundary is reasonable: no private support without your consent. If he prioritizes her comfort over your safety and trust, that’s not kindness—it’s a breach." 
    },
    {
      question: `We’ve been trying to save for a house, but the numbers never add up. Last night, I checked our joint account and found monthly transfers labeled "Family Help." Turns out, my wife has been secretly paying her brother’s gambling debt for a year because she didn’t want me to "judge him." I’m crushed—not just about the money, but the secrecy. Should I leave or try to fix this?`,
      answer: "The betrayal isn’t the dollars—it’s the deception. You need full financial transparency, a repayment plan, and a shared rule: no secret commitments with joint funds. If she can’t practice honesty, a house isn’t the only thing you won’t be able to build." 
    },
    {
      question: `On our anniversary, my boyfriend booked "our spot"—the little Italian place with the twinkle lights. Halfway through dinner, the hostess waved at him: "Good to see you again! The usual table?" He said it was a mix-up, but later I saw his name on a Polaroid behind the bar… with another woman, dated last month. He swears it was a business dinner and she was "just a friend." I feel sick. Am I wrong for not buying it?`,
      answer: "Patterns don’t lie—people do. Ask for receipts and specifics; if his story keeps changing, so should your plans with him. Your trust isn’t dramatic—it’s data-informed." 
    }
  ];

  // Daily "Ask Purposely" scenarios — regenerate at local midnight (user's local time)
  const getTodayKey = React.useCallback(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const msUntilNextMidnight = React.useCallback(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    return next.getTime() - now.getTime();
  }, []);

  const generateDailyScenarios = React.useCallback(async (resetIndex: boolean) => {
    const todayKey = getTodayKey();

    // Use cache if available
    const cached = localStorage.getItem(`askPurposelyScenarios_${todayKey}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAskScenarios(parsed);
        if (resetIndex) {
          setCurrentScenarioIndex(0);
          localStorage.setItem(`dailyScenarioIndex_${new Date().toDateString()}`, '0');
        }
        return;
      } catch {}
    }

    try {
      const prompt = `You are writing fictional, anonymous, user-submitted relationship and dating dilemmas for a section called "Ask Purposely." Your goal is to produce emotionally gripping, debate-inducing scenarios that feel plausibly real.

Return a STRICT JSON array with exactly 6 objects, each exactly: {"question": "...", "answer": "..."}. No markdown, no backticks, no labels, no extra commentary.

QUESTION rules:
- First-person confessional voice from a woman.
- Start with a short context sentence.
- Unfold with vivid, specific details, emotional beats, and occasional dialogue using quotes.
- Include at least one surprising gut-punch reveal that reframes the situation.
- Mix light drama with high-stakes themes (betrayal, secrecy, intimacy, family interference, money, trust, jealousy, boundaries, emotional labor, mismatched values, or life decisions).
- Avoid clichés; create moral ambiguity where readers could reasonably side with either person.
- End with a short, raw question to the audience (e.g., "Am I wrong for feeling this way?", "Should I leave or try to fix this?", "How do I even begin to trust again?").

ANSWER (Purposely Perspective) rules:
- 2–3 sentences only.
- Validate feelings, name the dynamic/red flag, and suggest one clear boundary or next step.
- Choose 1–2 angles from: accountability, communication clarity, boundary respect, reciprocity/effort, consistency/reliability, honesty/transparency, empathy/perspective-taking, conflict-resolution habits, alignment of values.
- Avoid clichés; do NOT use the exact phrase "emotional maturity."
- Loving, witty, direct tone.

Use the following seed scenarios ONLY as inspiration so outputs stay fresh and varied. Do not reuse wording:
The Wedding Photographer — "My fiancé wants to hire his ex to shoot our wedding; says I’m insecure."
The Secret Family Trip — "He took our kids on a trip with his sister while I was away; called it a ‘break for me.’"
The Late-Night Messages — "He texts his coworker goodnight nightly; says she needs support."
The Graduation Ultimatum — "Stepdad won’t attend unless bio dad stays home."
The Surprise Baby — "Boyfriend’s ex is pregnant; he wants me to stay and help raise the baby."
The Debt Collector — "Wife used joint savings to pay brother’s gambling debts in secret."
The Bedroom Dealbreaker — "Partner wants to open the relationship or he’s ‘not attracted.’"
The Uninvited Ex — "Boyfriend invited his ex to my birthday ‘to keep the peace.’"
The Parenting Clash — "I undermined a grounding; now trust is broken with my husband."
The Anniversary Gift — "Wife reused a card she wrote to her ex."
The Name Tattoo — "Girlfriend still has her ex’s name tattooed."
The Secret Guest Room — "Husband secretly let coworker stay in our home."
The Forgotten Funeral — "Boyfriend skipped my mom’s funeral for a festival."
The Engagement Switch — "He proposed with the ring he once bought for his ex."
The Hospital Secret — "He stayed at dinner with a female friend while I went into labor."
The Job Opportunity — "Girlfriend wants a break to ‘fully experience’ an overseas job."
The Shared Account — "He uses a profile with his ex’s name and fresh watch history."
The Bridal Party Snub — "Fiancé refuses to include my brother in the wedding party."
The Secret Retirement Fund — "Wife hid a six-figure fund ‘for security in case we divorce.’"
The Jealous Best Friend — "Husband says I must drop my male best friend."
The Pet Dilemma — "Girlfriend wants to give away my dog."
The Password Change — "Partner changed all passwords for ‘privacy.’"
The Public Proposal — "He proposed at a stadium knowing I hate attention."
The Silent Treatment — "Wife hasn’t spoken to me for two weeks after a fight."
The Shared Grave Plot — "Husband keeps a joint grave plot with his ex-wife."
`;
      const result = await getAIResponse(prompt, userProfile, 'therapy');
      let parsed: any[] | null = null;
      try {
        parsed = JSON.parse(result);
      } catch {
        const match = result?.match(/\[[\s\S]*\]/);
        if (match) {
          try { parsed = JSON.parse(match[0]); } catch {}
        }
      }

      const cleaned = (Array.isArray(parsed) ? parsed : defaultPurposelyScenarios)
        .map((item: any) => ({
          question: String(item?.question || '').trim().replace(/^["']|["']$/g, ''),
          answer: String(item?.answer || '').trim().replace(/^["']|["']$/g, '')
        }))
        .filter((i: any) => i.question && i.answer)
        .slice(0, 6);

      const finalList = cleaned.length >= 3 ? cleaned : defaultPurposelyScenarios;

      setAskScenarios(finalList);
      localStorage.setItem(`askPurposelyScenarios_${todayKey}`, JSON.stringify(finalList));
      if (resetIndex) {
        setCurrentScenarioIndex(0);
        localStorage.setItem(`dailyScenarioIndex_${new Date().toDateString()}`, '0');
      }
    } catch (e) {
      console.error('Error generating daily Ask Purposely scenarios:', e);
      setAskScenarios(defaultPurposelyScenarios);
    }
  }, [getAIResponse, userProfile, getTodayKey]);

  useEffect(() => {
    generateDailyScenarios(false);
    const t = setTimeout(() => {
      generateDailyScenarios(true);
    }, msUntilNextMidnight());
    return () => clearTimeout(t);
  }, [generateDailyScenarios, msUntilNextMidnight]);

  // Get or set daily question (changes at midnight)
  useEffect(() => {
    const today = new Date().toDateString();
    const savedQuestion = localStorage.getItem(`dailyQuestion_${today}`);
    
    if (savedQuestion) {
      setDailyQuestion(savedQuestion);
    } else {
      // Generate new question for today
      const randomIndex = Math.floor(Math.random() * relationshipTalkQuestions.length);
      const newQuestion = relationshipTalkQuestions[randomIndex];
      setDailyQuestion(newQuestion);
      localStorage.setItem(`dailyQuestion_${today}`, newQuestion);
    }
  }, []);

  // Check if user is first-time and show welcome tour
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) return;

      try {
        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking user settings:', error);
          return;
        }

        // If no settings exist or onboarding not completed, show welcome tour
        const shouldShowTour = !settings || !settings.onboarding_completed;
        setIsFirstTimeUser(shouldShowTour);
        setShowWelcomeTour(shouldShowTour);
      } catch (error) {
        console.error('Error checking first time user:', error);
      }
    };

    checkFirstTimeUser();
  }, [user]);

  const handleTourComplete = async () => {
    setShowWelcomeTour(false);
    
    if (!user) return;

    try {
      // Mark onboarding as completed
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const handleTourSkip = async () => {
    setShowWelcomeTour(false);
    
    if (!user) return;

    try {
      // Mark onboarding as completed even if skipped
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const getUserFirstName = () => {
    if (userProfile.first_name) return userProfile.first_name;
    if (userProfile.full_name) {
      const parts = userProfile.full_name.split(' ');
      return parts[0];
    }
    return '';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Purposely Dating App',
          text: 'Know someone who\'d love the Purposely Dating App? Invite them to join you!',
          url: window.location.origin,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link Copied!",
        description: "Share this link with your friends to invite them to Purposely Dating!",
      });
    }
  };

  const handleAskYourQuestion = () => {
    // Check if sneak peek user should see paywall
    if (sneakPeekTracking?.shouldShowPaywallForAskPurposely()) {
      onPaywallTrigger?.('ask_purposely');
      return;
    }
    
    setShowQuestionInput(true);
    setPurposelyResponse('');
    setUserQuestion('');
  };

  const handleSubmitQuestion = async () => {
    // Check if sneak peek user should see paywall
    if (sneakPeekTracking?.shouldShowPaywallForAskPurposely()) {
      onPaywallTrigger?.('ask_purposely');
      return;
    }

    if (!userQuestion.trim()) {
      toast({
        title: "Please enter a question",
        description: "We'd love to give you our Purposely Perspective!",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingResponse(true);
    try {
      const prompt = `Please provide a "Purposely Perspective" response to this question from a woman: "${userQuestion}". 

      Respond in the style of a loving, witty, and straight-to-the-point dating coach. The advice should be raw and uncut, not cliche and fluffy. Make it short and concise, but ensure every insightful statement hits hard and is worded with such wit, it could be its own viral quote.

      The tone should have a strong opener, validation for the woman's feelings, and quote-worthy insights. Be direct about red flags and encourage high standards. The response should empower the woman and help her recognize her worth.`;

      const response = await getAIResponse(prompt, userProfile, 'therapy');
      setPurposelyResponse(response);
    } catch (error) {
      toast({
        title: "Oops!",
        description: "We couldn't get your Purposely Perspective right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const getCurrentScenario = () => {
    return askScenarios[currentScenarioIndex] || defaultPurposelyScenarios[0];
  };

  const handleSeeMoreScenarios = () => {
    setCurrentScenarioIndex((prev) => (askScenarios.length ? (prev + 1) % askScenarios.length : 0));
  };

  // Initialize current scenario index on first load
  useEffect(() => {
    const today = new Date().toDateString();
    const savedScenarioIndex = localStorage.getItem(`dailyScenarioIndex_${today}`);
    
    if (savedScenarioIndex) {
      setCurrentScenarioIndex(parseInt(savedScenarioIndex));
    } else {
      const randomIndex = Math.floor(Math.random() * defaultPurposelyScenarios.length);
      setCurrentScenarioIndex(randomIndex);
      localStorage.setItem(`dailyScenarioIndex_${today}`, randomIndex.toString());
    }
  }, []);

  // Touch event handlers for swipe detection
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Left to right swipe opens side menu (only if swipe starts from left edge)
    if (isRightSwipe && touchStart < 50) {
      setIsSideMenuOpen(true);
      toast({
        title: "Menu Opened! 📱",
        description: "Navigate to different features from here!",
      });
    }
    // Right to left swipe navigates to Conversation Starters
    else if (isLeftSwipe) {
      onNavigateToFlirtFuel();
      toast({
        title: "Swiped to Conversation Starters! 💬",
        description: "Enjoy exploring new conversation topics!",
      });
    }
  };

  const isPremiumUser = subscription?.subscription_tier === 'Premium' || subscription?.subscribed;

  return (
    <div 
      className="pb-8 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen safe-area-pt"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            data-tour="side-menu"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
            Purposely 💕
          </h1>
          <div className="w-10 h-10" /> {/* Spacer for center alignment */}
        </div>
        
        {/* Invite Partner Banner */}
        <div className="w-screen bg-gradient-to-r from-burgundy to-primary -mx-4 relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw]">
          <div className="p-3 px-4 max-w-full mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            <div className="text-base font-bold text-white leading-relaxed text-left">
              Know someone else who's dating with
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">a purpose?</span>
              <Button
                onClick={handleShare}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-semibold whitespace-nowrap py-1 px-3 h-auto"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Invite a Friend
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Question of the Day */}
      <Card className="shadow-romance border-primary/20" data-tour="conversation-starters">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>Question of the Day</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="w-full shadow-elegant border-primary/20 bg-gradient-romance">
            <CardContent className="p-8 flex flex-col justify-center items-center text-center">
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-xl font-bold text-white leading-relaxed">
                  {dailyQuestion}
                </p>
              </div>
            </CardContent>
          </Card>
          <Button
            onClick={onNavigateToFlirtFuel}
            variant="romance"
            className="w-full"
          >
            See More Conversation Starters
          </Button>
        </CardContent>
      </Card>

      {/* Ask Purposely Section */}
      <Card className="shadow-romance border-primary/20" data-tour="ask-purposely">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>Ask Purposely</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showQuestionInput ? (
            <>
              {/* Daily Hypothetical Q&A */}
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-border">
                  <p className="text-foreground leading-relaxed font-medium">
                    "{getCurrentScenario().question}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Submitted by: Anonymous</p>
                </div>
                
                <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                  <p className="text-foreground leading-relaxed font-bold">
                    {getCurrentScenario().answer}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={handleSeeMoreScenarios}
                  variant="romance"
                  className="flex-1"
                >
                  See More
                </Button>
                <Button
                  onClick={handleAskYourQuestion}
                  variant="romance"
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Ask Your Question
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* User Question Input */}
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe what's happening (what was said or done, why it felt triggering or offensive, and what outcome you want)."
                  value={userQuestion}
                  onChange={(e) => setUserQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                
                {purposelyResponse && (
                  <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                    <p className="text-sm font-bold text-foreground mb-2">Purposely Perspective:</p>
                    <p className="text-foreground leading-relaxed font-bold">
                      {purposelyResponse}
                    </p>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button
                    onClick={handleSubmitQuestion}
                    variant="romance"
                    className="flex-1"
                    disabled={isLoadingResponse}
                  >
                    {isLoadingResponse ? (
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
                  
                  <Button
                    onClick={() => setShowQuestionInput(false)}
                    variant="soft"
                  >
                    Back
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Start Module */}
      <div data-tour="quick-start-modules">
        <QuickStartModule onNavigateToModule={handleQuickStartNavigation} />
      </div>

      {/* Side Menu */}
      <SideMenu 
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onNavigateToModule={onNavigateToModule}
      />

      {/* Welcome Tour */}
      {showWelcomeTour && (
        <WelcomeTour
          userFirstName={getUserFirstName()}
          isPremium={isPremiumUser}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
};

export default Home;