import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Share2, ThumbsUp, ThumbsDown, MessageCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';

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

const Home: React.FC<HomeProps> = ({ userProfile, onNavigateToFlirtFuel, onNavigateToAIPractice }) => {
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [purposelyResponse, setPurposelyResponse] = useState('');
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();

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
      question: "Why does my husband feel the need to attend his ex-wife's funeral when he supposedly has been 'over' her for the past 5 years we've been together? Am I being insensitive for feeling uncomfortable with this?",
      answer: "Not only are you not being insensitive, you have every right to wonder why he needs 'closure' on a door that was supposedly closed before you came along. While it doesn't mean he's 'still in love', it definitely signals some loose ends that threaten to unwravel you if you're not careful. You have every right to desire the same emotional clean slate you gave him."
    },
    {
      question: "My boyfriend of 2 years still has photos with his ex all over his social media. When I bring it up, he says I'm being 'insecure.' Am I wrong for wanting them gone?",
      answer: "You're not insecure—you're intuitive. A man who's truly moved on doesn't need a digital shrine to his past. His refusal to remove them isn't about memory keeping; it's about keeping doors open. You deserve someone who closes chapters, not someone who keeps you competing with ghosts."
    },
    {
      question: "He says he needs 'space to figure things out' after a year of dating. Should I wait for him or is this just a soft breakup?",
      answer: "When a man needs space to figure out if he wants you, he's already figured it out—he just doesn't want to be the bad guy who says it. Real love doesn't come with confusion periods. You're not a maybe, you're not a backup plan, and you're definitely not something that needs to be 'figured out.'"
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

  const getDailyScenario = () => {
    const today = new Date().toDateString();
    const savedScenarioIndex = localStorage.getItem(`dailyScenarioIndex_${today}`);
    
    let scenarioIndex;
    if (savedScenarioIndex) {
      scenarioIndex = parseInt(savedScenarioIndex);
    } else {
      scenarioIndex = Math.floor(Math.random() * askPurposelyScenarios.length);
      localStorage.setItem(`dailyScenarioIndex_${today}`, scenarioIndex.toString());
    }
    
    return askPurposelyScenarios[scenarioIndex];
  };

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen safe-area-pt">
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
                <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-foreground leading-relaxed font-medium">
                    "{getDailyScenario().question}"
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">- Anonymous</p>
                </div>
                
                <div className="p-4 bg-gradient-romance rounded-lg border border-primary/20">
                  <p className="text-sm font-semibold text-white mb-2">Purposely Says:</p>
                  <p className="text-white leading-relaxed">
                    {getDailyScenario().answer}
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleAskYourQuestion}
                variant="romance"
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                Ask Your Question
              </Button>
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
                  <div className="p-4 bg-gradient-romance rounded-lg border border-primary/20">
                    <p className="text-sm font-semibold text-white mb-2">Purposely Perspective:</p>
                    <p className="text-white leading-relaxed">
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
      <Card className="shadow-romance border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>Invite a Friend</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="w-full shadow-elegant border-primary/20 bg-gradient-romance">
            <CardContent className="p-8 flex flex-col justify-center items-center text-center">
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-xl font-bold text-white leading-relaxed">
                  Know someone who'd love the Purposely Dating App? Invite them to join you!
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
            Share Purposely Dating
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;