import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Zap, Users } from 'lucide-react';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface FlirtFuelModuleProps {
  userProfile: OnboardingData;
}

const FlirtFuelModule: React.FC<FlirtFuelModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'challenges' | 'starters' | 'messages' | 'practice'>('challenges');
  
  const dailyChallenge = {
    type: "Compliment Challenge",
    text: userProfile.loveLanguage === "Words of Affirmation" 
      ? "Give a heartfelt compliment about someone's character, not just their appearance"
      : userProfile.loveLanguage === "Quality Time"
      ? "Ask someone about their favorite childhood memory and really listen"
      : "Leave a sweet note for someone special today",
    difficulty: "Gentle",
    points: 10
  };

  const conversationStarters = [
    {
      category: "First Date Fun",
      prompts: userProfile.personalityType.includes("Outgoing") 
        ? [
            "What's the most spontaneous thing you've ever done?",
            "If you could have dinner with anyone, who would it be?",
            "What's your favorite way to celebrate small wins?"
          ]
        : [
            "What book has influenced you the most?",
            "What's your ideal way to spend a quiet evening?",
            "What's something you're passionate about that might surprise me?"
          ]
    },
    {
      category: "Relationship Talk", 
      prompts: [
        `Since your love language is ${userProfile.loveLanguage}, what makes you feel most loved?`,
        "What's your favorite memory of us together?",
        "How do you prefer to handle disagreements?"
      ]
    }
  ];

  const textMessageIdeas = [
    {
      tone: "Sweet",
      messages: [
        "Just thinking about you and smiling 😊",
        "Hope your day is as amazing as you are!",
        "Can't wait to hear about your day tonight"
      ]
    },
    {
      tone: "Flirty",
      messages: [
        "You've been on my mind all day... 💕",
        "Missing that gorgeous smile of yours",
        "Planning something special for us 😉"
      ]
    }
  ];

  const sections = [
    { id: 'challenges', label: 'Daily Challenge', icon: Zap },
    { id: 'starters', label: 'Conversation', icon: MessageCircle },
    { id: 'messages', label: 'Text Ideas', icon: Heart },
    { id: 'practice', label: 'AI Practice', icon: Users }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          FlirtFuel ✨
        </h1>
        <p className="text-muted-foreground">Build confidence & spark connections</p>
      </div>

      {/* Section Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="whitespace-nowrap"
            >
              <IconComponent className="w-4 h-4 mr-1" />
              {section.label}
            </Button>
          );
        })}
      </div>

      {/* Daily Challenge */}
      {activeSection === 'challenges' && (
        <Card className="shadow-romance border-primary/20 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-primary animate-heart-pulse" />
              <span>Today's Challenge</span>
              <Badge variant="secondary">{dailyChallenge.difficulty}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
              <h3 className="font-medium text-primary mb-2">{dailyChallenge.type}</h3>
              <p className="text-foreground leading-relaxed">{dailyChallenge.text}</p>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">+{dailyChallenge.points} confidence points</span>
              <Button variant="romance" size="sm">
                Mark Complete 💕
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversation Starters */}
      {activeSection === 'starters' && (
        <div className="space-y-4 animate-fade-in-up">
          {conversationStarters.map((category, index) => (
            <Card key={index} className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle className="text-primary">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.prompts.map((prompt, promptIndex) => (
                  <div 
                    key={promptIndex}
                    className="p-3 bg-muted/50 rounded-lg hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{prompt}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Text Message Ideas */}
      {activeSection === 'messages' && (
        <div className="space-y-4 animate-fade-in-up">
          {textMessageIdeas.map((category, index) => (
            <Card key={index} className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-primary" />
                  <span>{category.tone} Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.messages.map((message, messageIndex) => (
                  <div 
                    key={messageIndex}
                    className="p-3 bg-gradient-soft rounded-lg border border-primary/10 hover:shadow-soft transition-all cursor-pointer"
                  >
                    <p className="text-sm text-foreground">{message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Practice */}
      {activeSection === 'practice' && (
        <Card className="shadow-romance border-primary/20 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary animate-heart-pulse" />
              <span>AI Practice Partner</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10 text-center">
              <p className="text-muted-foreground mb-4">
                Practice conversations with AI partners in a safe, judgment-free space
              </p>
              <Button variant="romance" className="w-full">
                Start Practice Session ✨
              </Button>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                AI feature requires backend integration
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlirtFuelModule;