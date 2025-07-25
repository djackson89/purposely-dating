import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, BookOpen, TrendingUp, Calendar, Sparkles } from 'lucide-react';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface TherapyCompanionModuleProps {
  userProfile: OnboardingData;
}

const TherapyCompanionModule: React.FC<TherapyCompanionModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'reflection' | 'journal' | 'insights' | 'prompts'>('reflection');
  const [journalEntry, setJournalEntry] = useState('');
  
  // Personalized therapy prompts based on user profile
  const getPersonalizedPrompts = () => {
    const basePrompts = {
      pre: [
        "What relationship patterns would you like to explore in today's session?",
        "How are you feeling about your communication with your partner lately?",
        "What emotions have been most present for you this week?"
      ],
      post: [
        "What was the most meaningful insight from today's session?",
        "How can you apply what you learned to your relationship this week?",
        "What would you like to remember from today's conversation?"
      ]
    };

    if (userProfile.loveLanguage === "Words of Affirmation") {
      basePrompts.pre.push("How comfortable do you feel expressing your needs verbally?");
      basePrompts.post.push("What affirmations resonate most with you right now?");
    } else if (userProfile.loveLanguage === "Quality Time") {
      basePrompts.pre.push("How present do you feel in your relationships lately?");
      basePrompts.post.push("What did you learn about creating meaningful moments together?");
    }

    return basePrompts;
  };

  const personalizedPrompts = getPersonalizedPrompts();

  const dailyPrompt = userProfile.personalityType.includes("Introspective") 
    ? "What inner dialogue has been most prominent today, and how has it affected your relationships?"
    : "What moments of connection did you create or experience today?";

  const journalEntries = [
    { date: "Today", title: "Morning Reflection", preview: "Feeling grateful for the small moments..." },
    { date: "Yesterday", title: "Therapy Session Notes", preview: "Explored my attachment style and how it shows up..." },
    { date: "2 days ago", title: "Relationship Check-in", preview: "Had a really good conversation about..." }
  ];

  const intimacyInsights = [
    { metric: "Emotional Connection", trend: "up", value: "Strong this week" },
    { metric: "Communication Quality", trend: "stable", value: "Consistent improvement" },
    { metric: "Stress Level", trend: "down", value: "Lower than last month" }
  ];

  const sections = [
    { id: 'reflection', label: 'Therapy Reflection', icon: Sparkles },
    { id: 'journal', label: 'Growth Journal', icon: BookOpen },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'prompts', label: 'Daily Prompts', icon: Calendar }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Therapy Companion 🌱
        </h1>
        <p className="text-muted-foreground">Grow together, reflect deeply</p>
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

      {/* Therapy Reflection */}
      {activeSection === 'reflection' && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Pre-Therapy Reflection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalizedPrompts.pre.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm text-foreground mb-3">{prompt}</p>
                  <Textarea 
                    placeholder="Write your thoughts..."
                    className="min-h-[80px] border-primary/20 focus:border-primary"
                  />
                </div>
              ))}
              <Button variant="romance" className="w-full">
                Save Reflections 💕
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Post-Therapy Integration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {personalizedPrompts.post.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm text-foreground mb-3">{prompt}</p>
                  <Textarea 
                    placeholder="Reflect on your session..."
                    className="min-h-[80px] border-primary/20 focus:border-primary"
                  />
                </div>
              ))}
              <Button variant="romance" className="w-full">
                Save Integration Notes ✨
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Growth Journal */}
      {activeSection === 'journal' && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>New Journal Entry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="What's on your heart today? Write about your growth, relationships, or any insights you've gained..."
                className="min-h-[120px] border-primary/20 focus:border-primary"
              />
              <div className="flex space-x-2">
                <Button variant="romance" className="flex-1">
                  Save Entry 💕
                </Button>
                <Button variant="soft">
                  Add Photo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {journalEntries.map((entry, index) => (
                <div key={index} className="p-3 bg-gradient-soft rounded-lg border border-primary/10 hover:shadow-soft transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{entry.title}</h4>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.preview}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Insights & Tracking */}
      {activeSection === 'insights' && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Relationship Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {intimacyInsights.map((insight, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gradient-soft rounded-lg">
                  <div>
                    <h4 className="font-medium text-foreground">{insight.metric}</h4>
                    <p className="text-sm text-muted-foreground">{insight.value}</p>
                  </div>
                  <Badge variant={insight.trend === 'up' ? 'default' : insight.trend === 'down' ? 'secondary' : 'outline'}>
                    {insight.trend === 'up' ? '↗️' : insight.trend === 'down' ? '↘️' : '→'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle>Weekly Check-in</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Track your emotional patterns and relationship satisfaction
                </p>
                <Button variant="romance" className="w-full">
                  Complete Check-in ✨
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Advanced tracking features require backend integration
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Daily Prompts */}
      {activeSection === 'prompts' && (
        <div className="space-y-4 animate-fade-in-up">
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Today's Reflection</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                <p className="text-foreground leading-relaxed mb-4">{dailyPrompt}</p>
                <Textarea 
                  placeholder="Take a moment to reflect..."
                  className="min-h-[100px] border-primary/20 focus:border-primary"
                />
              </div>
              <Button variant="romance" className="w-full">
                Save Reflection 💕
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle>Gratitude Practice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                What are three things in your relationship that you're grateful for today?
              </p>
              {[1, 2, 3].map((num) => (
                <Textarea 
                  key={num}
                  placeholder={`Gratitude ${num}...`}
                  className="min-h-[60px] border-primary/20 focus:border-primary"
                />
              ))}
              <Button variant="romance" className="w-full mt-4">
                Save Gratitudes ✨
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TherapyCompanionModule;