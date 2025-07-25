import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Heart, BookOpen, TrendingUp, Calendar, Sparkles, Brain, MessageSquare, Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useToast } from '@/components/ui/use-toast';

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
  const [postTherapyInputs, setPostTherapyInputs] = useState<{[key: number]: string}>({});
  const [preTherapyInputs, setPreTherapyInputs] = useState<{[key: number]: string}>({});
  const [postTherapyAIResponses, setPostTherapyAIResponses] = useState<{[key: number]: string}>({});
  const [preTherapyAIResponses, setPreTherapyAIResponses] = useState<{[key: number]: string}>({});
  const [loadingPreTherapyAI, setLoadingPreTherapyAI] = useState<{[key: number]: boolean}>({});
  const [loadingPostTherapyAI, setLoadingPostTherapyAI] = useState<{[key: number]: boolean}>({});
  const [preTherapyPage, setPreTherapyPage] = useState(0);
  const [postTherapyPage, setPostTherapyPage] = useState(0);
  const [savedJournalEntries, setSavedJournalEntries] = useState<{[key: string]: string[]}>({});
  
  const { getTherapyInsight, isLoading } = useRelationshipAI();
  const { toast } = useToast();
  
  // Personalized therapy prompts based on user profile with multiple sets
  const getPersonalizedPrompts = () => {
    const allPrompts = {
      pre: [
        // Set 1
        [
          "Can you help me identify unhealthy relationship patterns based on my past relationships?",
          "How can I improve my communication style to better connect with my partner?",
          "What tools can you teach me to better process difficult emotions in my relationship?",
          "Can we work through some specific conflicts I've been having with my partner?",
          "How is my attachment style affecting my current relationship, and what can I do about it?"
        ],
        // Set 2
        [
          "How can I better understand and meet my partner's emotional needs?",
          "What boundaries do I need to work on establishing in my relationship?",
          "Can you help me process feelings of jealousy or insecurity?",
          "How do I handle disagreements without escalating into arguments?",
          "What role does my family background play in my current relationship?"
        ],
        // Set 3
        [
          "How can I rebuild trust after it's been damaged in my relationship?",
          "What strategies can help me be more emotionally available to my partner?",
          "How do I balance independence and togetherness in my relationship?",
          "Can we explore how stress affects my relationship dynamics?",
          "What does healthy intimacy look like for me and my partner?"
        ]
      ],
      post: [
        // Set 1
        [
          "Share a key takeaway from your therapy session today",
          "What insight resonated most with you?",
          "Describe any 'aha' moments you experienced",
          "What homework or actions did your therapist suggest?"
        ],
        // Set 2
        [
          "What patterns did you become aware of during today's session?",
          "How did discussing your relationship make you feel?",
          "What challenged you most in today's conversation?",
          "What tools or strategies will you try this week?"
        ],
        // Set 3
        [
          "What emotions came up for you during therapy today?",
          "How has your perspective on your relationship shifted?",
          "What breakthrough moment did you experience?",
          "What commitment are you making to yourself moving forward?"
        ]
      ]
    };

    // Add personalized questions based on love language
    if (userProfile.loveLanguage === "Words of Affirmation") {
      allPrompts.pre[0].push("Can you help me learn how to better express my emotional needs verbally?");
    } else if (userProfile.loveLanguage === "Quality Time") {
      allPrompts.pre[0].push("How can my partner and I create more meaningful intimate moments together?");
    }

    return allPrompts;
  };

  const personalizedPrompts = getPersonalizedPrompts();
  
  // Get current set of prompts based on page
  const currentPrePrompts = personalizedPrompts.pre[preTherapyPage] || [];
  const currentPostPrompts = personalizedPrompts.post[postTherapyPage] || [];

  const handlePreTherapyInput = (index: number, value: string) => {
    setPreTherapyInputs(prev => ({ ...prev, [index]: value }));
  };

  const handlePostTherapyInput = (index: number, value: string) => {
    setPostTherapyInputs(prev => ({ ...prev, [index]: value }));
  };

  const handleAskPurposely = async (index: number, input: string, isPreTherapy: boolean = true) => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your thoughts before asking Purposely for insight.",
        variant: "destructive",
      });
      return;
    }

    if (isPreTherapy) {
      setLoadingPreTherapyAI(prev => ({ ...prev, [index]: true }));
      try {
        const prompt = `User input about therapy question: "${input}". Please provide compassionate insight and guidance from Purposely Dating's AI perspective.`;
        const response = await getTherapyInsight(prompt, userProfile);
        setPreTherapyAIResponses(prev => ({ ...prev, [index]: response }));
      } catch (error) {
        console.error('Failed to get AI response:', error);
        toast({
          title: "AI Error",
          description: "Failed to generate AI response. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingPreTherapyAI(prev => ({ ...prev, [index]: false }));
      }
    } else {
      setLoadingPostTherapyAI(prev => ({ ...prev, [index]: true }));
      try {
        const response = await getTherapyInsight(
          `The user shared this therapy takeaway: "${input}". Please provide encouraging affirmation and practical next steps for implementing this insight in their relationship.`,
          userProfile
        );
        setPostTherapyAIResponses(prev => ({ ...prev, [index]: response }));
      } catch (error) {
        console.error('Failed to get AI response:', error);
        toast({
          title: "AI Error",
          description: "Failed to generate AI response. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingPostTherapyAI(prev => ({ ...prev, [index]: false }));
      }
    }
  };

  const addToJournal = (index: number, content: string) => {
    if (!content.trim()) {
      toast({
        title: "Nothing to Save",
        description: "Please enter a takeaway before saving to journal.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date().toDateString();
    setSavedJournalEntries(prev => ({
      ...prev,
      [today]: [...(prev[today] || []), content]
    }));

    toast({
      title: "Added to Journal",
      description: "Your takeaway has been saved to today's journal entry.",
    });
  };

  const dailyPrompt = userProfile.personalityType.includes("Introspective") 
    ? "What inner dialogue has been most prominent today, and how has it affected your relationships?"
    : "What moments of connection did you create or experience today?";

  // Update journal entries to include saved therapy takeaways
  const allJournalEntries = [
    { date: "Today", title: "Morning Reflection", preview: "Feeling grateful for the small moments..." },
    { date: "Yesterday", title: "Therapy Session Notes", preview: "Explored my attachment style and how it shows up..." },
    { date: "2 days ago", title: "Relationship Check-in", preview: "Had a really good conversation about..." },
    ...Object.entries(savedJournalEntries).map(([date, entries]) => ({
      date,
      title: "Therapy Takeaways",
      preview: `${entries.length} takeaway${entries.length > 1 ? 's' : ''} saved from therapy sessions...`
    }))
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
          Purposely Dating 💕
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
              {currentPrePrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm text-foreground font-medium mb-3">{prompt}</p>
                  <Textarea 
                    placeholder="Share your thoughts or context about this question..."
                    className="min-h-[80px] border-primary/20 focus:border-primary mb-3"
                    value={preTherapyInputs[index] || ''}
                    onChange={(e) => handlePreTherapyInput(index, e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => handleAskPurposely(index, preTherapyInputs[index] || '', true)}
                      disabled={loadingPreTherapyAI[index]}
                      className="flex-1"
                    >
                      {loadingPreTherapyAI[index] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Asking Purposely...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Ask Purposely
                        </>
                      )}
                    </Button>
                  </div>
                  {preTherapyAIResponses[index] && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-2">Purposely's Insight:</p>
                      <p className="text-sm text-muted-foreground">
                        {preTherapyAIResponses[index]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="soft"
                  onClick={() => setPreTherapyPage(Math.max(0, preTherapyPage - 1))}
                  disabled={preTherapyPage === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Set {preTherapyPage + 1} of {personalizedPrompts.pre.length}
                </span>
                
                <Button
                  variant="soft"
                  onClick={() => setPreTherapyPage(Math.min(personalizedPrompts.pre.length - 1, preTherapyPage + 1))}
                  disabled={preTherapyPage === personalizedPrompts.pre.length - 1}
                  className="flex items-center"
                >
                  See More
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
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
                Share what you learned in therapy so Purposely can offer affirmation and additional guidance:
              </p>
              {currentPostPrompts.map((prompt, index) => (
                <div key={index} className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                  <p className="text-sm text-foreground mb-3 font-medium">{prompt}:</p>
                  <Textarea 
                    placeholder="Share your therapy takeaway..."
                    className="min-h-[80px] border-primary/20 focus:border-primary mb-3"
                    value={postTherapyInputs[index] || ''}
                    onChange={(e) => handlePostTherapyInput(index, e.target.value)}
                  />
                  <div className="flex space-x-2">
                    <Button
                      variant="soft"
                      size="sm"
                      onClick={() => handleAskPurposely(index, postTherapyInputs[index] || '', false)}
                      disabled={loadingPostTherapyAI[index]}
                      className="flex-1"
                    >
                      {loadingPostTherapyAI[index] ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Asking Purposely...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Ask Purposely
                        </>
                      )}
                    </Button>
                    <Button
                      variant="romance"
                      size="sm"
                      onClick={() => addToJournal(index, postTherapyInputs[index] || '')}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Journal
                    </Button>
                  </div>
                  {postTherapyAIResponses[index] && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="text-xs font-medium text-primary mb-2">Purposely's Response:</p>
                      <p className="text-sm text-muted-foreground">
                        {postTherapyAIResponses[index]}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Navigation buttons */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="soft"
                  onClick={() => setPostTherapyPage(Math.max(0, postTherapyPage - 1))}
                  disabled={postTherapyPage === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Set {postTherapyPage + 1} of {personalizedPrompts.post.length}
                </span>
                
                <Button
                  variant="soft"
                  onClick={() => setPostTherapyPage(Math.min(personalizedPrompts.post.length - 1, postTherapyPage + 1))}
                  disabled={postTherapyPage === personalizedPrompts.post.length - 1}
                  className="flex items-center"
                >
                  See More
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
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
              {allJournalEntries.map((entry, index) => (
                <div key={index} className="p-3 bg-gradient-soft rounded-lg border border-primary/10 hover:shadow-soft transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-foreground">{entry.title}</h4>
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.preview}</p>
                  {entry.title === "Therapy Takeaways" && savedJournalEntries[entry.date] && (
                    <div className="mt-2 space-y-1">
                      {savedJournalEntries[entry.date].map((takeaway, takeawayIndex) => (
                        <div key={takeawayIndex} className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
                          {takeaway.substring(0, 50)}...
                        </div>
                      ))}
                    </div>
                  )}
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