import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [dailyQuote, setDailyQuote] = useState('');
  const [dailyScenario, setDailyScenario] = useState('');
  const [quoteVote, setQuoteVote] = useState<'agree' | 'disagree' | null>(null);
  const { toast } = useToast();

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

  // Affirming relationship quotes for women with boundaries and high standards
  const affirmingQuotes = [
    "You don't need someone to complete you. You are already whole. The right person will celebrate your completeness.",
    "Your standards aren't too high. You know your worth, and you refuse to settle for less than you deserve.",
    "A healthy relationship adds to your life, it doesn't consume it. You maintain your identity while building together.",
    "You deserve someone who chooses you every day, not someone who only shows up when it's convenient.",
    "Protecting your energy isn't selfish—it's necessary. You can love deeply while maintaining your boundaries.",
    "The right person will never make you feel like you're asking for too much when you ask for respect.",
    "You're not difficult for having needs. You're self-aware and deserve a partner who honors those needs.",
    "Your past taught you lessons, not limitations. You're allowed to want better because you've learned what you deserve.",
    "A real connection doesn't require you to shrink yourself to make someone else comfortable.",
    "You're not being picky—you're being selective. There's a difference between knowing what you want and settling."
  ];

  // Practice scenarios for "How would you reply?" section
  const practiceScenarios = [
    "Your new dating partner just texted you to see if you got home safely after a great first date. He follows up with, 'Btw...I'd love to come over if you're up for more company...'",
    "You've been on three dates and really like each other. They text: 'I know this might be forward, but I can't stop thinking about our conversation last night. Want to continue it over dinner at my place?'",
    "After a wonderful evening together, they text: 'I had such an amazing time with you. I'm already looking forward to seeing you again. How about we make this a regular thing?'",
    "You receive a text: 'Hey beautiful, I know we said we'd take things slow, but I'm really attracted to you. Would you be open to being more intimate next time we see each other?'",
    "They send: 'I've been thinking about what you said about wanting someone who truly understands you. I feel like we have that connection. What do you think?'",
    "You get a message: 'I love how comfortable I feel with you already. It's rare to find someone who gets my sense of humor. Are you free this weekend for something spontaneous?'",
    "They text: 'Last night was incredible. I hope I'm not being too eager, but I'd love to plan something special for our next date. Any hints on what would make you smile?'",
    "You receive: 'I know we're still getting to know each other, but I feel like there's real potential here. How are you feeling about us so far?'",
    "They send: 'Good morning! I couldn't sleep last night thinking about our conversation. You mentioned feeling unsure about relationships lately - want to talk about it over coffee?'",
    "You get a text: 'I really appreciate how honest you've been with me about what you're looking for. I feel the same way about wanting something real. Should we have that conversation?'"
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

    // Get or set daily affirming quote
    const savedQuote = localStorage.getItem(`dailyQuote_${today}`);
    if (savedQuote) {
      setDailyQuote(savedQuote);
    } else {
      const randomQuoteIndex = Math.floor(Math.random() * affirmingQuotes.length);
      const newQuote = affirmingQuotes[randomQuoteIndex];
      setDailyQuote(newQuote);
      localStorage.setItem(`dailyQuote_${today}`, newQuote);
    }

    // Get or set daily practice scenario
    const savedScenario = localStorage.getItem(`dailyScenario_${today}`);
    if (savedScenario) {
      setDailyScenario(savedScenario);
    } else {
      const randomScenarioIndex = Math.floor(Math.random() * practiceScenarios.length);
      const newScenario = practiceScenarios[randomScenarioIndex];
      setDailyScenario(newScenario);
      localStorage.setItem(`dailyScenario_${today}`, newScenario);
    }

    // Get saved vote for today's quote
    const savedVote = localStorage.getItem(`quoteVote_${today}`);
    if (savedVote) {
      setQuoteVote(savedVote as 'agree' | 'disagree');
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

  const handleQuoteVote = (vote: 'agree' | 'disagree') => {
    setQuoteVote(vote);
    const today = new Date().toDateString();
    localStorage.setItem(`quoteVote_${today}`, vote);
    
    toast({
      title: vote === 'agree' ? "Beautiful!" : "Noted!",
      description: vote === 'agree' ? "Thank you for affirming this truth!" : "We appreciate your perspective.",
    });
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
          <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
            <p className="text-foreground leading-relaxed">{dailyQuestion}</p>
          </div>
          <Button
            onClick={onNavigateToFlirtFuel}
            variant="romance"
            className="w-full"
          >
            See More Conversation Starters
          </Button>
        </CardContent>
      </Card>

      {/* How would you reply? Practice Section */}
      <Card className="shadow-romance border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>How would you reply?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
            <p className="text-foreground leading-relaxed">{dailyScenario}</p>
          </div>
          <Button
            onClick={() => onNavigateToAIPractice(dailyScenario)}
            variant="romance"
            className="w-full"
          >
            Reply
          </Button>
        </CardContent>
      </Card>

      {/* Invite a Friend */}
      <Card className="shadow-romance border-primary/20 bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-primary-foreground">
            <Share2 className="w-5 h-5 text-primary-foreground" />
            <span>Invite a Friend</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-primary-foreground/90 leading-relaxed">
            Know someone who'd love the Purposely Dating App? Invite them to join you!
          </p>
          <Button
            onClick={handleShare}
            variant="secondary"
            className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Purposely Dating
          </Button>
        </CardContent>
      </Card>

      {/* Gentle Reminder */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary" />
            <span>Gentle Reminder...</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
            <p className="text-foreground leading-relaxed italic">{dailyQuote}</p>
          </div>
          <div className="flex space-x-3 justify-center">
            <Button
              onClick={() => handleQuoteVote('agree')}
              variant={quoteVote === 'agree' ? "romance" : "soft"}
              size="sm"
              disabled={quoteVote !== null}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Agree
            </Button>
            <Button
              onClick={() => handleQuoteVote('disagree')}
              variant={quoteVote === 'disagree' ? "destructive" : "soft"}
              size="sm"
              disabled={quoteVote !== null}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Disagree
            </Button>
          </div>
          {quoteVote && (
            <p className="text-xs text-muted-foreground text-center">
              Thanks for your response!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;