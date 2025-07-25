import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, BookOpen, TrendingUp, Calendar, Sparkles, Brain, MessageSquare } from 'lucide-react';

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
  const [showAIInsight, setShowAIInsight] = useState<{[key: number]: boolean}>({});
  const [postTherapyInputs, setPostTherapyInputs] = useState<{[key: number]: string}>({});
  
  // Personalized therapy prompts based on user profile
  const getPersonalizedPrompts = () => {
    const basePrompts = {
      pre: [
        "What relationship patterns would you like to explore in today's session?",
        "How do you feel your communication style is working in your relationship?",
        "What emotions have been challenging for you to process this week?",
        "Are there any specific conflicts or concerns you'd like to discuss?",
        "How has your attachment style been showing up in your relationship lately?"
      ],
      post: [
        "Share a key takeaway from your therapy session today",
        "What insight resonated most with you?",
        "Describe any 'aha' moments you experienced",
        "What homework or actions did your therapist suggest?"
      ]
    };

    if (userProfile.loveLanguage === "Words of Affirmation") {
      basePrompts.pre.push("How comfortable are you with expressing your emotional needs verbally?");
    } else if (userProfile.loveLanguage === "Quality Time") {
      basePrompts.pre.push("How connected do you feel during intimate moments with your partner?");
    }

    return basePrompts;
  };

  const personalizedPrompts = getPersonalizedPrompts();

  const getAIInsight = (prompt: string, isPreTherapy: boolean = true) => {
    if (isPreTherapy) {
      // AI therapist perspective for pre-therapy questions
      const insights = {
        "What relationship patterns would you like to explore in today's session?": "Consider exploring recurring conflicts, communication breakdowns, or emotional triggers. These patterns often reveal deeper attachment styles and unmet needs.",
        "How do you feel your communication style is working in your relationship?": "Reflect on whether you tend to be direct/indirect, defensive/open, or if you struggle with timing. Healthy communication involves both speaking your truth and creating space for your partner.",
        "What emotions have been challenging for you to process this week?": "Difficult emotions often carry important information about our needs and boundaries. Consider what these emotions might be trying to tell you about your relationship dynamics."
      };
      return insights[prompt] || "This is a valuable question to explore in therapy. Consider what emotions or experiences come up for you when you think about this topic.";
    } else {
      // AI affirmation and guidance for post-therapy
      return "Your commitment to growth and self-reflection is commendable. Implementing therapeutic insights takes time and practice. Be patient with yourself as you integrate these new understandings into your relationship.";
    }
  };

  const handlePostTherapyInput = (index: number, value: string) => {
    setPostTherapyInputs(prev => ({ ...prev, [index]: value }));
  };

  const toggleAIInsight = (index: number) => {
    setShowAIInsight(prev => ({ ...prev, [index]: !prev[index] }));
  };

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
                <MessageSquare className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Pre-Therapy: Questions for Your Therapist</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                These are suggested questions you can ask your therapist during your session:
              </p>
              {personalizedPrompts.pre.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm text-foreground font-medium flex-1">{prompt}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAIInsight(index)}
                      className="ml-2 p-1 h-auto"
                    >
                      <Brain className="w-4 h-4" />
                    </Button>
                  </div>
                  {showAIInsight[index] && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-2">AI Relationship Therapist's Perspective:</p>
                      <p className="text-sm text-muted-foreground">
                        {getAIInsight(prompt, true)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              <Button variant="romance" className="w-full">
                Save Questions 💕
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Post-Therapy: Share Your Takeaways</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Share what you learned in therapy so our AI can offer affirmation and additional guidance:
              </p>
              {personalizedPrompts.post.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm text-foreground mb-3 font-medium">{prompt}:</p>
                  <Textarea 
                    placeholder="Share your therapy takeaway..."
                    className="min-h-[80px] border-primary/20 focus:border-primary mb-3"
                    value={postTherapyInputs[index] || ''}
                    onChange={(e) => handlePostTherapyInput(index, e.target.value)}
                  />
                  {postTherapyInputs[index] && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-2">AI Relationship Therapist's Response:</p>
                      <p className="text-sm text-muted-foreground">
                        {getAIInsight(postTherapyInputs[index], false)} Here are some ways to implement this insight: Practice this awareness daily, discuss it with your partner when appropriate, and celebrate small progress steps.
                      </p>
                    </div>
                  )}
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