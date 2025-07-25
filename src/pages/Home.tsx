import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Share2, ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
}

const Home: React.FC<HomeProps> = ({ userProfile, onNavigateToFlirtFuel }) => {
  const [dailyQuestion, setDailyQuestion] = useState('');
  const [funFact, setFunFact] = useState('');
  const [factVote, setFactVote] = useState<'up' | 'down' | null>(null);
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

  // Fun facts about dating and relationships
  const funFacts = [
    "Did you know? Couples who laugh together are 5 times more likely to have a successful relationship.",
    "Did you know? It takes an average of 7 minutes to decide if you're attracted to someone on a first date.",
    "Did you know? People who express gratitude to their partner are 25% more likely to stay together long-term.",
    "Did you know? Couples who share household chores are more satisfied in their relationships.",
    "Did you know? Holding hands can actually sync your heartbeats and reduce stress levels.",
    "Did you know? The average person falls in love 7 times before marriage.",
    "Did you know? Couples who have been together for 2+ years have similar brain chemistry to people on cocaine.",
    "Did you know? 40% of people have dated someone they met online.",
    "Did you know? It takes 4 minutes of eye contact to potentially fall in love with someone.",
    "Did you know? People are more attracted to others who have a positive outlook on life."
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

    // Get or set daily fun fact
    const savedFact = localStorage.getItem(`dailyFact_${today}`);
    if (savedFact) {
      setFunFact(savedFact);
    } else {
      const randomFactIndex = Math.floor(Math.random() * funFacts.length);
      const newFact = funFacts[randomFactIndex];
      setFunFact(newFact);
      localStorage.setItem(`dailyFact_${today}`, newFact);
    }

    // Get saved vote for today's fact
    const savedVote = localStorage.getItem(`factVote_${today}`);
    if (savedVote) {
      setFactVote(savedVote as 'up' | 'down');
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

  const handleFactVote = (vote: 'up' | 'down') => {
    setFactVote(vote);
    const today = new Date().toDateString();
    localStorage.setItem(`factVote_${today}`, vote);
    
    toast({
      title: vote === 'up' ? "Thanks!" : "Noted!",
      description: vote === 'up' ? "Glad you found that interesting!" : "We'll keep that in mind for future facts.",
    });
  };

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
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
            <span>Purposely Dating Question of the Day</span>
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

      {/* Invite a Friend */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5 text-primary" />
            <span>Invite a Friend</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground leading-relaxed">
            Know someone who'd love the Purposely Dating App? Invite them to join you!
          </p>
          <Button
            onClick={handleShare}
            variant="soft"
            className="w-full"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Purposely Dating
          </Button>
        </CardContent>
      </Card>

      {/* Did You Know Fun Fact */}
      <Card className="shadow-soft border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary" />
            <span>Did You Know?</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
            <p className="text-foreground leading-relaxed">{funFact}</p>
          </div>
          <div className="flex space-x-3 justify-center">
            <Button
              onClick={() => handleFactVote('up')}
              variant={factVote === 'up' ? "romance" : "soft"}
              size="sm"
              disabled={factVote !== null}
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              Interesting!
            </Button>
            <Button
              onClick={() => handleFactVote('down')}
              variant={factVote === 'down' ? "destructive" : "soft"}
              size="sm"
              disabled={factVote !== null}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              Not for me
            </Button>
          </div>
          {factVote && (
            <p className="text-xs text-muted-foreground text-center">
              Thanks for your feedback!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;