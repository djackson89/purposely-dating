import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Heart, BookOpen, TrendingUp, Sparkles, Brain, MessageSquare, Loader2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { InfoDialog } from '@/components/ui/info-dialog';
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
  const [activeSection, setActiveSection] = useState<'reflection' | 'journal' | 'insights'>('reflection');
  const [journalEntry, setJournalEntry] = useState('');
  const [postTherapyInputs, setPostTherapyInputs] = useState<{[key: number]: string}>({});
  const [preTherapyInputs, setPreTherapyInputs] = useState<{[key: number]: string}>({});
  const [postTherapyAIResponses, setPostTherapyAIResponses] = useState<{[key: number]: string}>({});
  const [preTherapyAIResponses, setPreTherapyAIResponses] = useState<{[key: number]: string}>({});
  const [loadingPreTherapyAI, setLoadingPreTherapyAI] = useState<{[key: number]: boolean}>({});
  const [loadingPostTherapyAI, setLoadingPostTherapyAI] = useState<{[key: number]: boolean}>({});
  const [preTherapyPage, setPreTherapyPage] = useState(0);
  const [postTherapyPage, setPostTherapyPage] = useState(0);
  const [currentPreTherapyIndex, setCurrentPreTherapyIndex] = useState(0);
  const [currentPostTherapyIndex, setCurrentPostTherapyIndex] = useState(0);
  const [savedJournalEntries, setSavedJournalEntries] = useState<{[key: string]: string[]}>({});
  
  // Mental Health Check-In state
  const [stressLevel, setStressLevel] = useState([5]);
  const [energyLevel, setEnergyLevel] = useState([5]);
  const [mentalClarity, setMentalClarity] = useState([5]);
  const [anxiousThoughts, setAnxiousThoughts] = useState([5]);
  const [depressiveThoughts, setDepressiveThoughts] = useState([5]);
  const [checkInEntries, setCheckInEntries] = useState<Array<{
    date: string;
    stress: number;
    energy: number;
    clarity: number;
    anxiety: number;
    depression: number;
  }>>([]);
  const [recommendation, setRecommendation] = useState('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  
  const { getTherapyInsight, isLoading } = useRelationshipAI();
  const { toast } = useToast();
  
  // Personalized therapy prompts based on user profile
  const getPersonalizedPrompts = () => {
    const basePrompts = {
      pre: [
        "Can you help me identify unhealthy relationship patterns based on my past relationships?",
        "How can I improve my communication style to better connect with my partner?",
        "What tools can you teach me to better process difficult emotions in my relationship?",
        "Can we work through some specific conflicts I've been having with my partner?",
        "How is my attachment style affecting my current relationship, and what can I do about it?",
        "How can I better understand and meet my partner's emotional needs?",
        "What boundaries do I need to work on establishing in my relationship?",
        "Can you help me process feelings of jealousy or insecurity?",
        "How do I handle disagreements without escalating into arguments?",
        "What role does my family background play in my current relationship?",
        "How can I rebuild trust after it's been damaged in my relationship?",
        "What strategies can help me be more emotionally available to my partner?",
        "How do I balance independence and togetherness in my relationship?",
        "Can we explore how stress affects my relationship dynamics?",
        "What does healthy intimacy look like for me and my partner?",
        "How can I work on being more vulnerable in my relationship?",
        "What are some healthy ways to express anger in my relationship?",
        "How can I better support my partner during difficult times?",
        "What role does physical affection play in our relationship?",
        "How can we create more meaningful rituals and traditions together?"
      ],
      post: [
        "Share a key takeaway from your therapy session today",
        "What insight resonated most with you?",
        "Describe any 'aha' moments you experienced",
        "What homework or actions did your therapist suggest?",
        "What patterns did you become aware of during today's session?",
        "How did discussing your relationship make you feel?",
        "What challenged you most in today's conversation?",
        "What tools or strategies will you try this week?",
        "What emotions came up for you during therapy today?",
        "How has your perspective on your relationship shifted?",
        "What breakthrough moment did you experience?",
        "What commitment are you making to yourself moving forward?",
        "What surprised you most about today's session?",
        "How will you apply what you learned this week?",
        "What resistance came up during the session and why?",
        "What healing moment did you experience today?",
        "How has your understanding of love evolved?",
        "What self-compassion practice will you implement?",
        "What boundary will you set based on today's insights?",
        "How will you honor your growth moving forward?"
      ]
    };

    // Add personalized questions based on love language
    if (userProfile.loveLanguage === "Words of Affirmation") {
      basePrompts.pre.push("Can you help me learn how to better express my emotional needs verbally?");
    } else if (userProfile.loveLanguage === "Quality Time") {
      basePrompts.pre.push("How can my partner and I create more meaningful intimate moments together?");
    }

    return basePrompts;
  };

  const personalizedPrompts = getPersonalizedPrompts();
  
  // Get current prompts for pre-therapy (now swipeable like post-therapy)
  const getCurrentPrePrompt = () => {
    return personalizedPrompts.pre[currentPreTherapyIndex] || personalizedPrompts.pre[0];
  };

  const getCurrentPostPrompt = () => {
    return personalizedPrompts.post[currentPostTherapyIndex] || personalizedPrompts.post[0];
  };

  const getPostPromptExplanation = (prompt: string) => {
    const explanations: {[key: string]: string} = {
      "Can you help me identify unhealthy relationship patterns based on my past relationships?": "Understanding your relationship patterns is crucial for your self-love journey. This question helps you recognize cycles that may be holding you back from the love you deserve, empowering you to break free from limiting beliefs and create healthier connections.",
      "How can I improve my communication style to better connect with my partner?": "Communication is the bridge to deeper intimacy and self-understanding. Exploring your communication style helps you express your authentic self more clearly and creates space for genuine connection in your relationships.",
      "What tools can you teach me to better process difficult emotions in my relationship?": "Learning to process emotions healthily is an act of self-love. This question helps you develop emotional intelligence and resilience, allowing you to navigate relationship challenges while staying true to yourself."
    };
    
    // Default explanation for questions not in the map
    return explanations[prompt] || "This question helps you explore important aspects of your relationships and personal growth, supporting your journey toward greater self-awareness and love.";
  };

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
    { id: 'reflection', label: 'Therapy Companion', icon: Sparkles },
    { id: 'journal', label: 'Growth Journal', icon: BookOpen },
    { id: 'insights', label: 'Mental Health Check-In', icon: TrendingUp }
  ];

  // Handle mental health check-in completion
  const handleCompleteCheckIn = async () => {
    const today = new Date().toDateString();
    const newEntry = {
      date: today,
      stress: stressLevel[0],
      energy: energyLevel[0],
      clarity: mentalClarity[0],
      anxiety: anxiousThoughts[0],
      depression: depressiveThoughts[0]
    };

    // Save new entry
    const updatedEntries = [...checkInEntries, newEntry];
    setCheckInEntries(updatedEntries);
    localStorage.setItem('mentalHealthCheckIns', JSON.stringify(updatedEntries));

    // Generate recommendation based on current and previous entries
    setLoadingRecommendation(true);
    try {
      let prompt = `Based on today's mental health check-in: Stress Level: ${stressLevel[0]}/10, Energy Level: ${energyLevel[0]}/10, Mental Clarity: ${mentalClarity[0]}/10, Anxious Thoughts: ${anxiousThoughts[0]}/10, Depressive Thoughts: ${depressiveThoughts[0]}/10.`;
      
      if (checkInEntries.length > 0) {
        const lastEntry = checkInEntries[checkInEntries.length - 1];
        prompt += ` Previous entry: Stress: ${lastEntry.stress}/10, Energy: ${lastEntry.energy}/10, Clarity: ${lastEntry.clarity}/10, Anxiety: ${lastEntry.anxiety}/10, Depression: ${lastEntry.depression}/10.`;
      }

      prompt += ' Please provide a personalized recommendation for improving mental health or maintaining good progress, considering trends if there are previous entries. Keep it encouraging and actionable.';

      const response = await getTherapyInsight(prompt, userProfile);
      setRecommendation(response);

      toast({
        title: "Check-in Complete",
        description: "Your mental health check-in has been saved with a personalized recommendation.",
      });
    } catch (error) {
      console.error('Error generating recommendation:', error);
      toast({
        title: "Check-in Saved",
        description: "Your check-in was saved, but we couldn't generate a recommendation right now.",
        variant: "destructive",
      });
    } finally {
      setLoadingRecommendation(false);
    }
  };

  // Load saved check-ins on mount
  React.useEffect(() => {
    const saved = localStorage.getItem('mentalHealthCheckIns');
    if (saved) {
      setCheckInEntries(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Self-Love Journey 🌱
        </h1>
        <p className="text-muted-foreground">Grow together, reflect deeply</p>
      </div>

      {/* Section Tabs - Stacked and Visible */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="flex items-center justify-center p-3 h-12 w-full"
            >
              <IconComponent className="w-5 h-5" />
            </Button>
          );
        })}
      </div>

      {/* Therapy Reflection */}
      {activeSection === 'reflection' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Therapy Companion</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Therapy Companion"
                description="Prepare thoughtful questions for therapy and reflect on your insights to maximize your relationship growth."
              />
            </div>
          </div>
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
              
              {/* Single Pre-Therapy Question Display with Swipeable Navigation */}
              <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                <p className="text-sm text-foreground font-medium mb-3">{getCurrentPrePrompt()}</p>
                
                {/* Context explanation instead of input field */}
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                  <p className="text-xs font-medium text-primary mb-2">Why this helps your Self-Love Journey:</p>
                  <p className="text-sm text-muted-foreground">
                    {getPostPromptExplanation(getCurrentPrePrompt())}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => handleAskPurposely(currentPreTherapyIndex, getCurrentPrePrompt(), true)}
                    disabled={loadingPreTherapyAI[currentPreTherapyIndex]}
                    className="flex-1"
                  >
                    {loadingPreTherapyAI[currentPreTherapyIndex] ? (
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
                {preTherapyAIResponses[currentPreTherapyIndex] && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-medium text-primary mb-2">Purposely's Insight:</p>
                    <p className="text-sm text-muted-foreground">
                      {preTherapyAIResponses[currentPreTherapyIndex]}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Swipeable Navigation buttons for Pre-Therapy */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="soft"
                  onClick={() => setCurrentPreTherapyIndex(Math.max(0, currentPreTherapyIndex - 1))}
                  disabled={currentPreTherapyIndex === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="soft"
                  onClick={() => {
                    // Expand array if needed for unlimited questions
                    if (currentPreTherapyIndex >= personalizedPrompts.pre.length - 1) {
                      // For unlimited questions, we cycle back to beginning
                      setCurrentPreTherapyIndex((currentPreTherapyIndex + 1) % personalizedPrompts.pre.length);
                    } else {
                      setCurrentPreTherapyIndex(currentPreTherapyIndex + 1);
                    }
                  }}
                  className="flex items-center"
                >
                  Next
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
              
              {/* Single Post-Therapy Question Display */}
              <div className="p-4 bg-gradient-soft rounded-lg border border-primary/10">
                <p className="text-sm text-foreground mb-3 font-medium">{getCurrentPostPrompt()}:</p>
                <Textarea 
                  placeholder="Share your therapy takeaway..."
                  className="min-h-[80px] border-primary/20 focus:border-primary mb-3"
                  value={postTherapyInputs[currentPostTherapyIndex] || ''}
                  onChange={(e) => handlePostTherapyInput(currentPostTherapyIndex, e.target.value)}
                />
                <div className="flex space-x-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => handleAskPurposely(currentPostTherapyIndex, postTherapyInputs[currentPostTherapyIndex] || '', false)}
                    disabled={loadingPostTherapyAI[currentPostTherapyIndex]}
                    className="flex-1"
                  >
                    {loadingPostTherapyAI[currentPostTherapyIndex] ? (
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
                    onClick={() => addToJournal(currentPostTherapyIndex, postTherapyInputs[currentPostTherapyIndex] || '')}
                    disabled={!postTherapyInputs[currentPostTherapyIndex]?.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Journal
                  </Button>
                </div>
                {postTherapyAIResponses[currentPostTherapyIndex] && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-xs font-medium text-primary mb-2">Purposely's Response:</p>
                    <p className="text-sm text-muted-foreground">
                      {postTherapyAIResponses[currentPostTherapyIndex]}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Swipeable Navigation buttons - no "Set X of Y" text */}
              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="soft"
                  onClick={() => setCurrentPostTherapyIndex(Math.max(0, currentPostTherapyIndex - 1))}
                  disabled={currentPostTherapyIndex === 0}
                  className="flex items-center"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                
                <Button
                  variant="soft"
                  onClick={() => {
                    // Expand array if needed for unlimited questions
                    if (currentPostTherapyIndex >= personalizedPrompts.post.length - 1) {
                      // For unlimited questions, we cycle back to beginning or generate more
                      setCurrentPostTherapyIndex((currentPostTherapyIndex + 1) % personalizedPrompts.post.length);
                    } else {
                      setCurrentPostTherapyIndex(currentPostTherapyIndex + 1);
                    }
                  }}
                  className="flex items-center"
                >
                  Next
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
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Growth Journal</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Growth Journal"
                description="Document your relationship journey, capture breakthrough moments, and track your emotional growth over time."
              />
            </div>
          </div>
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

      {/* Mental Health Check-In */}
      {activeSection === 'insights' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Mental Health Check-In</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Mental Health Check-In"
                description="Track your daily mental health and receive personalized recommendations to support your emotional well-being."
              />
            </div>
          </div>
          
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Mental Health Check-In</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stress Level */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Stress Level</label>
                  <span className="text-xs text-muted-foreground">{stressLevel[0]}/10</span>
                </div>
                <Slider
                  value={stressLevel}
                  onValueChange={setStressLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Energy Levels */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Energy Levels</label>
                  <span className="text-xs text-muted-foreground">{energyLevel[0]}/10</span>
                </div>
                <Slider
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Mental Clarity */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Mental Clarity</label>
                  <span className="text-xs text-muted-foreground">{mentalClarity[0]}/10</span>
                </div>
                <Slider
                  value={mentalClarity}
                  onValueChange={setMentalClarity}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Anxious Thoughts */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Anxious Thoughts</label>
                  <span className="text-xs text-muted-foreground">{anxiousThoughts[0]}/10</span>
                </div>
                <Slider
                  value={anxiousThoughts}
                  onValueChange={setAnxiousThoughts}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Depressive Thoughts */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-foreground">Depressive Thoughts</label>
                  <span className="text-xs text-muted-foreground">{depressiveThoughts[0]}/10</span>
                </div>
                <Slider
                  value={depressiveThoughts}
                  onValueChange={setDepressiveThoughts}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>

              {/* Complete Check-in Button */}
              <Button 
                onClick={handleCompleteCheckIn}
                disabled={loadingRecommendation}
                variant="romance" 
                className="w-full"
              >
                {loadingRecommendation ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Recommendation...
                  </>
                ) : (
                  'Complete Check-in'
                )}
              </Button>

              {/* Purposely Recommendation */}
              {recommendation && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-xs font-medium text-primary mb-2">Purposely's Recommendation:</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {recommendation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Previous Check-ins */}
          {checkInEntries.length > 0 && (
            <Card className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle>Recent Check-ins</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {checkInEntries.slice(-3).reverse().map((entry, index) => (
                  <div key={index} className="p-3 bg-gradient-soft rounded-lg border border-primary/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-foreground">{entry.date}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Stress: {entry.stress}/10</div>
                      <div>Energy: {entry.energy}/10</div>
                      <div>Clarity: {entry.clarity}/10</div>
                      <div>Anxiety: {entry.anxiety}/10</div>
                      <div className="col-span-2">Depression: {entry.depression}/10</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TherapyCompanionModule;