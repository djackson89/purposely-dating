import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import QuickStartModule from '@/components/QuickStartModule';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface HomeProps {
  userProfile: OnboardingData;
  onNavigateToFlirtFuel: () => void;
  onNavigateToAIPractice: (scenario?: string) => void;
}

// Module navigation mapping
const moduleNavigationMap = {
  'flirtfuel': 'flirtfuel',
  'therapy': 'therapy',
  'concierge': 'concierge'
};

const Home: React.FC<HomeProps> = ({ userProfile, onNavigateToFlirtFuel, onNavigateToAIPractice }) => {
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [purposelyResponse, setPurposelyResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  
  // Touch/swipe handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();

  // Handle QuickStart module navigation
  const handleQuickStartNavigation = (module: string) => {
    switch (module) {
      case 'flirtfuel':
        onNavigateToFlirtFuel();
        break;
      case 'therapy':
        // For now, show a toast - proper navigation would need to be passed from Index
        toast({
          title: "Therapy Companion! 💝",
          description: "Navigate via the bottom menu to access this feature!",
        });
        break;
      case 'concierge':
        // For now, show a toast - proper navigation would need to be passed from Index
        toast({
          title: "Date Planner! 📅",
          description: "Navigate via the bottom menu to access this feature!",
        });
        break;
      default:
        onNavigateToFlirtFuel();
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
  const askPurposelyScenarios = [
    {
      question: "I just found out my man has been texting his ex wife about how I'm no good in bed. Although he's asking her how to 'train' me to be better, I feel completely humiliated and betrayed. Should I leave him?",
      answer: "The disrespect is so loud it's deafening, and yet you're asking if you should leave? Baby, he didn't just cross a line—he bulldozed through your dignity and made his ex-wife a consultant on your intimacy. This isn't about 'training' you; it's about him training you to accept disrespect as normal. A man who truly loves you doesn't outsource conversations about your most vulnerable moments to another woman, especially not his ex. He's not trying to help you get better; he's trying to make you feel smaller so you won't realize you deserve a man who would never speak about you like a project that needs fixing. You're not broken—your picker just needs recalibrating."
    },
    {
      question: "My boyfriend of 2 years still has photos with his ex all over his social media. When I bring it up, he says I'm being 'insecure.' Am I wrong for wanting them gone?",
      answer: "You're not insecure—you're intuitive. A man who's truly moved on doesn't need a digital shrine to his past. His refusal to remove them isn't about memory keeping; it's about keeping doors open. When he calls you insecure for having standards, he's using manipulation to avoid accountability. You deserve someone who closes chapters, not someone who keeps you competing with ghosts. Your discomfort isn't jealousy—it's your self-respect trying to save you."
    },
    {
      question: "He says he needs 'space to figure things out' after a year of dating. Should I wait for him or is this just a soft breakup?",
      answer: "When a man needs space to figure out if he wants you, he's already figured it out—he just doesn't want to be the bad guy who says it. Real love doesn't come with confusion periods. You're not a maybe, you're not a backup plan, and you're definitely not something that needs to be 'figured out.' Stop giving your energy to someone who's treating your heart like a trial subscription. His 'space' is just him keeping you on the hook while he explores other options."
    },
    {
      question: "My husband's female coworker keeps texting him late at night about 'work stuff' and when I ask to see the messages, he gets defensive and says I don't trust him. Am I being paranoid?",
      answer: "Trust your gut—it's not paranoid, it's protective. A transparent man with nothing to hide doesn't get defensive about showing messages, especially when his wife's comfort is at stake. Work conversations at 11 PM? Please. The only thing working overtime here is his audacity. His anger at your reasonable request is a deflection tactic. A faithful husband would either show you the messages or establish boundaries with this coworker himself. You're not asking too much—you're asking the bare minimum."
    },
    {
      question: "Found out my boyfriend has been on dating apps while we've been together for 6 months. He says he was just 'looking' and never met anyone. Should I give him another chance?",
      answer: "He wasn't 'just looking'—he was shopping. Being on dating apps while in a relationship isn't window shopping, it's actively hunting for your replacement. His defense is insulting your intelligence and minimizing his betrayal. The audacity to ask for another chance after showing you exactly how little he values what you already have together? No ma'am. A man who's happy with his woman doesn't need to see what else is out there. You deserve someone whose eyes never wander to other options."
    },
    {
      question: "My partner keeps bringing up my past relationships and using them against me in arguments. He says I have 'too much baggage' but won't stop bringing it up. How do I handle this?",
      answer: "He's weaponizing your past to control your present, and that's emotional terrorism. A man who truly loves you doesn't use your vulnerability as ammunition in fights. He's creating the very insecurity he claims you have by constantly reopening old wounds. This isn't about your baggage—it's about his inability to handle that you existed before him. Stop defending your past to someone who refuses to honor your present. You can't heal in the same environment that broke you."
    }
  ];

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
    setShowQuestionInput(true);
    setPurposelyResponse('');
    setUserQuestion('');
  };

  const handleSubmitQuestion = async () => {
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
    return askPurposelyScenarios[currentScenarioIndex];
  };

  const handleSeeMoreScenarios = () => {
    setCurrentScenarioIndex((prev) => (prev + 1) % askPurposelyScenarios.length);
  };

  // Initialize current scenario index on first load
  useEffect(() => {
    const today = new Date().toDateString();
    const savedScenarioIndex = localStorage.getItem(`dailyScenarioIndex_${today}`);
    
    if (savedScenarioIndex) {
      setCurrentScenarioIndex(parseInt(savedScenarioIndex));
    } else {
      const randomIndex = Math.floor(Math.random() * askPurposelyScenarios.length);
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

    // Right to left swipe navigates to Conversation Starters
    if (isLeftSwipe) {
      onNavigateToFlirtFuel();
      toast({
        title: "Swiped to Conversation Starters! 💬",
        description: "Enjoy exploring new conversation topics!",
      });
    }
  };

  return (
    <div 
      className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen safe-area-pt"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Welcome to Purposely 💕
        </h1>
        <p className="text-muted-foreground">Your daily dose of relationship growth</p>
      </div>

      {/* Daily Question of the Day */}
      <Card className="shadow-romance border-primary/20">
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
      <Card className="shadow-romance border-primary/20">
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
                  <p className="text-xs text-muted-foreground mt-2">- Anonymous</p>
                </div>
                
                <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm font-bold text-foreground mb-2">Purposely Says:</p>
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
                  placeholder="What's your relationship question? Be specific about your situation..."
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

      {/* Invite a Friend */}
      <div className="space-y-4">
        <Card className="w-full shadow-elegant border-primary/20 bg-gradient-burgundy">
          <CardContent className="p-8 flex flex-col justify-center items-center text-center">
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-xl font-bold text-white leading-relaxed">
                Side Note: Purposely App is better with friends!
              </p>
            </div>
          </CardContent>
        </Card>
        <Button
          onClick={handleShare}
          variant="romance"
          className="w-full"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Invite a Friend to Try Purposely
        </Button>
      </div>

      {/* Quick Start Module */}
      <QuickStartModule onNavigateToModule={handleQuickStartNavigation} />
    </div>
  );
};

export default Home;