import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Share, Wand2, Trash2, Users } from 'lucide-react';
import { FTUETooltip } from '@/components/ui/ftue-tooltip';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import TextGenie from '@/components/TextGenie';

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
  const [activeSection, setActiveSection] = useState<'starters' | 'practice' | 'textgenie'>('starters');
  const [selectedCategory, setSelectedCategory] = useState('Relationship Talk');
  const [customKeywords, setCustomKeywords] = useState('');
  const [currentStarters, setCurrentStarters] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customCategories, setCustomCategories] = useState<{[key: string]: string[]}>({});
  const [savedPacks, setSavedPacks] = useState<{[key: string]: boolean}>({});
  const [showRename, setShowRename] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [practicePartnerActive, setPracticePartnerActive] = useState(false);
  const [practiceMessages, setPracticeMessages] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [currentPracticeMessage, setCurrentPracticeMessage] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('first_date');
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();

  const handleShare = async (text: string) => {
    try {
      // Try Capacitor Share first (for mobile)
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter from Clarity Coach',
          text: text,
        });
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: 'Conversation Starter from Clarity Coach',
            text: text,
          });
        } else {
          // Fallback to clipboard
          await navigator.clipboard.writeText(text);
          alert('Copied to clipboard!');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Final fallback to clipboard
      try {
        await navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };
  
  const conversationStarters = [
    {
      category: "First Date Fun",
      prompts: userProfile.personalityType.includes("Outgoing") 
        ? [
            "What's the most spontaneous thing you've ever done?",
            "If you could have dinner with anyone, who would it be?",
            "What's your favorite way to celebrate small wins?",
            "What's the craziest adventure you've been on?",
            "If you could live anywhere in the world, where would it be?",
            "What's your go-to karaoke song?"
          ]
        : [
            "What book has influenced you the most?",
            "What's your ideal way to spend a quiet evening?",
            "What's something you're passionate about that might surprise me?",
            "What's the most interesting documentary you've watched?",
            "What's a skill you've always wanted to learn?",
            "What's your favorite way to unwind after a long day?"
          ]
    },
    {
      category: "Relationship Talk", 
      prompts: [
        `Since your love language is ${userProfile.loveLanguage}, what makes you feel most loved?`,
        "What's your favorite memory of us together?",
        "How do you prefer to handle disagreements?",
        "What's one thing you appreciate about our relationship?",
        "How do you like to be comforted when you're stressed?",
        "What does a perfect relationship look like to you?"
      ]
    },
    {
      category: "Intimacy",
      prompts: [
        "What do you find most attractive about sexual chemistry?",
        "How do you like to build physical tension and anticipation?",
        "What makes you feel most desired and wanted?",
        "What's your favorite way to express sexual intimacy?",
        "How do you communicate your desires and boundaries?",
        "What's something you've always wanted to explore sexually?"
      ]
    },
    {
      category: "Relationship Boundaries",
      prompts: [
        "What are your non-negotiables in a relationship?",
        "How do you handle time with friends versus partner time?",
        "What boundaries help you feel secure in relationships?",
        "How do you communicate when you need space?",
        "What's important to you about maintaining independence?",
        "How do you handle social media in relationships?"
      ]
    },
    {
      category: "Turn-Offs & Turn-Ons",
      prompts: [
        "What instantly makes you lose interest in someone?",
        "What qualities make someone irresistible to you?",
        "What's a green flag that not everyone appreciates?",
        "What's the most attractive thing someone can do?",
        "What's a deal-breaker that might surprise people?",
        "What kind of confidence do you find most appealing?"
      ]
    },
    {
      category: "Mental Health",
      prompts: [
        "How do you take care of your mental health?",
        "How would you support a partner going through a tough time?",
        "What's your relationship with therapy or self-improvement?",
        "How do you handle stress in relationships?",
        "What helps you feel emotionally safe?",
        "How do you practice self-compassion?"
      ]
    },
    {
      category: "Date Night Debates",
      prompts: [
        "Pineapple on pizza: yes or no?",
        "What's better: planning everything or being spontaneous?",
        "Would you rather travel to the past or the future?",
        "Cats or dogs, and why?",
        "What's the best movie genre for a date night?",
        "Morning person or night owl?"
      ]
    },
    {
      category: "Conflict Resolution",
      prompts: [
        "How can we better communicate when we're both upset?",
        "What's one thing we could improve about how we handle disagreements?",
        "How do you prefer to make up after an argument?",
        "What helps you feel heard during difficult conversations?",
        "How can we prevent this issue from happening again?",
        "What do you need from me when you're feeling hurt?"
      ]
    }
  ];


  // Initialize current starters with default category
  React.useEffect(() => {
    const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
    if (defaultCategory && !isCustom) {
      setCurrentStarters(defaultCategory.prompts);
      setCurrentQuestionIndex(0); // Reset to first question when category changes
    }
  }, [selectedCategory, isCustom]);

  const generateCustomStarters = async () => {
    if (!customKeywords.trim()) return;
    
    try {
      const prompt = `Generate 8 conversation starter questions based on these keywords: ${customKeywords}. The questions should be engaging, thoughtful, and incorporate the mood/themes of the keywords provided.`;
      const response = await getFlirtSuggestion(prompt, userProfile);
      
      // Parse the response into an array of questions
      const questions = response.split('\n').filter(line => 
        line.trim() && 
        (line.includes('?') || line.match(/^\d+\.?/))
      ).map(line => 
        line.replace(/^\d+\.?\s*/, '').trim()
      ).slice(0, 8);
      
      // Generate unique custom category name
      const customIndex = Object.keys(customCategories).length + 1;
      const categoryName = `Custom${customIndex}`;
      
      // Save to custom categories
      setCustomCategories(prev => ({
        ...prev,
        [categoryName]: questions
      }));
      
      setCurrentStarters(questions);
      setCurrentQuestionIndex(0);
      setIsCustom(true);
      setSelectedCategory(categoryName);
      setCustomKeywords(''); // Clear input after generating
    } catch (error) {
      console.error('Error generating custom starters:', error);
    }
  };

  const saveCurrentCustom = () => {
    if (!isCustom || currentStarters.length === 0) return;
    
    const customIndex = Object.keys(customCategories).length + 1;
    const categoryName = `Custom${customIndex}`;
    
    setCustomCategories(prev => ({
      ...prev,
      [categoryName]: currentStarters
    }));
    
    // Mark as saved pack
    setSavedPacks(prev => ({
      ...prev,
      [categoryName]: true
    }));
    
    setSelectedCategory(categoryName);
  };

  const deleteCustomCategory = (categoryName: string) => {
    if (!customCategories[categoryName]) return;
    
    // Remove from custom categories
    setCustomCategories(prev => {
      const newCategories = { ...prev };
      delete newCategories[categoryName];
      return newCategories;
    });
    
    // Remove from saved packs
    setSavedPacks(prev => {
      const newPacks = { ...prev };
      delete newPacks[categoryName];
      return newPacks;
    });
    
    // Reset to default if this was the selected category
    if (selectedCategory === categoryName) {
      setSelectedCategory('Relationship Talk');
      setIsCustom(false);
    }
    
    setShowManage(false);
  };

  const renameCustomCategory = () => {
    if (!newCategoryName.trim() || !isCustom) return;
    
    const oldName = selectedCategory;
    const questions = customCategories[oldName];
    
    if (questions) {
      setCustomCategories(prev => {
        const newCategories = { ...prev };
        delete newCategories[oldName];
        newCategories[newCategoryName.trim()] = questions;
        return newCategories;
      });
      
      // Update saved packs if it was saved
      if (savedPacks[oldName]) {
        setSavedPacks(prev => {
          const newPacks = { ...prev };
          delete newPacks[oldName];
          newPacks[newCategoryName.trim()] = true;
          return newPacks;
        });
      }
      
      setSelectedCategory(newCategoryName.trim());
    }
    
    setShowRename(false);
    setShowManage(false);
    setNewCategoryName('');
  };

  const loadMoreStarters = async () => {
    if (isCustom && customCategories[selectedCategory]) {
      // Generate more questions for custom category
      const existingQuestions = customCategories[selectedCategory];
      const prompt = `Generate 8 new conversation starter questions similar to these but completely different: ${existingQuestions.join(', ')}`;
      try {
        const response = await getFlirtSuggestion(prompt, userProfile);
        const questions = response.split('\n').filter(line => 
          line.trim() && 
          (line.includes('?') || line.match(/^\d+\.?/))
        ).map(line => 
          line.replace(/^\d+\.?\s*/, '').trim()
        ).slice(0, 8);
        
        setCurrentStarters(questions);
        setCurrentQuestionIndex(0);
      } catch (error) {
        console.error('Error loading more starters:', error);
      }
    } else {
      const category = conversationStarters.find(cat => cat.category === selectedCategory);
      if (category) {
        // Generate more questions for the same category
        const prompt = `Generate 8 new conversation starter questions in the style of "${selectedCategory}" category. They should be similar to these examples but completely different: ${category.prompts.join(', ')}`;
        try {
          const response = await getFlirtSuggestion(prompt, userProfile);
          const questions = response.split('\n').filter(line => 
            line.trim() && 
            (line.includes('?') || line.match(/^\d+\.?/))
          ).map(line => 
            line.replace(/^\d+\.?\s*/, '').trim()
          ).slice(0, 8);
          
          setCurrentStarters(questions);
          setCurrentQuestionIndex(0);
        } catch (error) {
          console.error('Error loading more starters:', error);
        }
      }
    }
  };

  const selectCategory = (categoryName: string) => {
    if (categoryName === 'Customize') {
      // Set to custom mode and clear current starters
      setSelectedCategory('Customize');
      setIsCustom(false); // Reset custom flag
      setCurrentStarters([]); // Clear current starters to show customize interface
      setCustomKeywords('');
      return;
    }
    
    setSelectedCategory(categoryName);
    
    // Check if it's a custom category
    if (customCategories[categoryName]) {
      setIsCustom(true);
      setCurrentStarters(customCategories[categoryName]);
      setCurrentQuestionIndex(0);
    } else {
      setIsCustom(false);
      const category = conversationStarters.find(cat => cat.category === categoryName);
      if (category) {
        setCurrentStarters(category.prompts);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < currentStarters.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Load more questions when reaching the end
      await loadMoreStarters();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleCardSwipe = (direction: 'left' | 'right') => {
    if (direction === 'left') {
      nextQuestion();
    } else {
      previousQuestion();
    }
  };

  // AI Practice Partner methods
  const practiceScenarios = [
    { id: 'first_date', name: 'First Date', description: 'Practice conversation for a first date scenario' },
    { id: 'relationship_talk', name: 'Relationship Talk', description: 'Practice discussing relationship topics' },
    { id: 'conflict_resolution', name: 'Conflict Resolution', description: 'Practice handling disagreements constructively' },
    { id: 'flirting', name: 'Flirting', description: 'Practice playful and romantic conversation' },
    { id: 'vulnerable_sharing', name: 'Vulnerable Sharing', description: 'Practice sharing deeper feelings and thoughts' }
  ];

  const startPracticeSession = async () => {
    setPracticePartnerActive(true);
    setPracticeMessages([]);
    
    const scenario = practiceScenarios.find(s => s.id === practiceScenario);
    const welcomeMessage = `Hi! I'm your AI practice partner. We're going to practice ${scenario?.name.toLowerCase()} conversation. I'll respond as someone you might be dating. Feel free to start the conversation naturally, and I'll help you practice! What would you like to say?`;
    
    setPracticeMessages([{ role: 'ai', message: welcomeMessage }]);
  };

  const sendPracticeMessage = async () => {
    if (!currentPracticeMessage.trim()) return;
    
    const userMessage = currentPracticeMessage.trim();
    const updatedMessages = [...practiceMessages, { role: 'user' as const, message: userMessage }];
    setPracticeMessages(updatedMessages);
    setCurrentPracticeMessage('');
    
    try {
      const scenario = practiceScenarios.find(s => s.id === practiceScenario);
      const conversationHistory = updatedMessages.map(m => 
        `${m.role === 'user' ? 'User' : 'Practice Partner'}: ${m.message}`
      ).join('\n');
      
      const prompt = `You are an AI practice partner helping someone improve their dating conversation skills. You're roleplaying as a potential romantic partner in a ${scenario?.name.toLowerCase()} scenario.

Context: ${scenario?.description}
User Profile: Love Language: ${userProfile.loveLanguage}, Personality: ${userProfile.personalityType}

Conversation so far:
${conversationHistory}

Respond naturally as someone they might be dating. Be engaging, realistic, and provide subtle feedback through your responses. Keep responses conversational and authentic. If they say something particularly good or something that needs improvement, respond naturally as a real person would.`;

      const response = await getFlirtSuggestion(prompt, userProfile);
      setPracticeMessages(prev => [...prev, { role: 'ai', message: response }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setPracticeMessages(prev => [...prev, { role: 'ai', message: "Sorry, I'm having trouble responding right now. Let's try again!" }]);
    }
  };

  const endPracticeSession = () => {
    setPracticePartnerActive(false);
    setPracticeMessages([]);
    setCurrentPracticeMessage('');
  };

  const sections = [
    { id: 'starters', label: 'Conversation Starters', icon: MessageCircle },
    { id: 'textgenie', label: 'Text Genie', icon: Wand2 },
    { id: 'practice', label: 'AI Practice', icon: Zap }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Clarity Coach ✨
        </h1>
        <p className="text-muted-foreground">No more second-guessing—just powerful connection</p>
      </div>

      {/* Section Tabs - Icons Only */}
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
              title={section.label}
            >
              <IconComponent className="w-5 h-5" />
            </Button>
          );
        })}
      </div>


      {/* Conversation Starters */}
      {activeSection === 'starters' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Conversation Starters</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <FTUETooltip
                id="conversation-starters"
                title="Conversation Starters"
                description="Discover engaging questions and topics that spark meaningful conversations. Swipe through cards or use our AI to generate custom questions based on your interests and dating style."
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Label htmlFor="category-select" className="text-sm font-medium">Choose Category:</Label>
                <Select value={selectedCategory} onValueChange={selectCategory}>
                  <SelectTrigger className="w-full bg-card z-50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg z-50">
                    <SelectItem 
                      value="Customize"
                      className="bg-card hover:bg-muted cursor-pointer font-medium text-primary"
                    >
                      ✨ Customize
                    </SelectItem>
                    {conversationStarters.map((category) => (
                      <SelectItem 
                        key={category.category} 
                        value={category.category}
                        className="bg-card hover:bg-muted cursor-pointer"
                      >
                        {category.category}
                      </SelectItem>
                    ))}
                    {Object.keys(customCategories).map((categoryName) => (
                      <SelectItem 
                        key={categoryName} 
                        value={categoryName}
                        className="bg-card hover:bg-muted cursor-pointer"
                      >
                        {categoryName} (Custom)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Save/Manage button for custom categories */}
                {isCustom && currentStarters.length > 0 && (
                  <div className="space-y-2">
                    {!savedPacks[selectedCategory] ? (
                      <Button
                        onClick={saveCurrentCustom}
                        variant="romance"
                        size="sm"
                        className="w-full"
                      >
                        Save This Pack
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setShowManage(true)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Manage this Category
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Input - Only show when Customize is selected */}
          {selectedCategory === 'Customize' && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 space-y-3">
               <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter keywords (e.g., sexy, deep, funny)"
                    value={customKeywords}
                    onChange={(e) => setCustomKeywords(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <Button
                    onClick={generateCustomStarters}
                    disabled={isLoading || !customKeywords.trim()}
                    variant="romance"
                    className="whitespace-nowrap"
                  >
                    {isLoading ? '...' : 'Generate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Management Dialog */}
          {showManage && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 space-y-3">
                <Label className="text-sm font-medium">Manage Category: {selectedCategory}</Label>
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      setShowManage(false);
                      setShowRename(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Rename Category
                  </Button>
                  <Button
                    onClick={() => deleteCustomCategory(selectedCategory)}
                    variant="destructive"
                    size="sm"
                    className="w-full flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Category
                  </Button>
                  <Button
                    onClick={() => setShowManage(false)}
                    variant="ghost"
                    size="sm"
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rename Dialog */}
          {showRename && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 space-y-3">
                <Label className="text-sm font-medium">Rename Category:</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Enter new name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="flex-1 min-w-0"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={renameCustomCategory}
                      disabled={!newCategoryName.trim()}
                      variant="romance"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setShowRename(false);
                        setNewCategoryName('');
                      }}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Card Game */}
          {currentStarters.length > 0 && (
            <div className="space-y-4">

              {/* Question Card */}
              <div className="relative min-h-[300px] flex items-center justify-center">
                <Card 
                  className="w-full max-w-md mx-auto shadow-elegant border-primary/20 bg-gradient-romance transform transition-all duration-300 hover:scale-105"
                  style={{ minHeight: '250px' }}
                >
                  <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full">
                    <div className="flex items-center justify-center h-full w-full">
                      <p className="text-2xl font-bold text-white leading-relaxed">
                        {currentStarters[currentQuestionIndex]}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Navigation Controls */}
              <div className="flex justify-between items-center px-2 sm:px-4">
                <Button
                  onClick={previousQuestion}
                  disabled={currentQuestionIndex === 0}
                  variant="soft"
                  size="lg"
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
                >
                  <span>←</span>
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex space-x-2">
                  {currentStarters.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentQuestionIndex 
                          ? 'bg-primary' 
                          : 'bg-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>

                <Button
                  onClick={nextQuestion}
                  disabled={isLoading}
                  variant="soft"
                  size="lg"
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4"
                >
                  <span>{isLoading ? '...' : 'Next'}</span>
                  <span>→</span>
                </Button>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={() => handleShare(currentStarters[currentQuestionIndex])}
                  variant="outline"
                  className="w-full"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Share This Question
                </Button>

              </div>
            </div>
          )}
        </div>
      )}


      {/* Text Genie */}
      {activeSection === 'textgenie' && (
        <div className="animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <h2 className="text-xl font-semibold text-primary">Text Genie</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <FTUETooltip
                id="text-genie"
                title="Text Genie"
                description="Get AI-powered help crafting the perfect text message replies. Share context through text, photos, or voice recordings, and receive personalized response suggestions with different tones and explanations."
              />
            </div>
          </div>
          <TextGenie userProfile={userProfile} />
        </div>
      )}

      {/* AI Practice */}
      {activeSection === 'practice' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">AI Practice</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <FTUETooltip
                id="ai-practice"
                title="AI Practice"
                description="Practice conversations with AI partners in a safe, judgment-free space. Build confidence and improve your communication skills before real dates."
              />
            </div>
          </div>
        {!practicePartnerActive ? (
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>AI Practice Partner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="scenario-select" className="text-sm font-medium">Choose Practice Scenario:</Label>
                <Select value={practiceScenario} onValueChange={setPracticeScenario}>
                  <SelectTrigger className="w-full bg-card">
                    <SelectValue placeholder="Select a scenario" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border border-border shadow-lg">
                    {practiceScenarios.map((scenario) => (
                      <SelectItem 
                        key={scenario.id} 
                        value={scenario.id}
                        className="bg-card hover:bg-muted cursor-pointer"
                      >
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {practiceScenarios.find(s => s.id === practiceScenario)?.description}
                </p>
              </div>
              
              <Button 
                onClick={startPracticeSession}
                disabled={isLoading}
                variant="romance" 
                className="w-full"
              >
                {isLoading ? 'Starting...' : 'Start Practice Session ✨'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-romance border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Practice Session</span>
              </CardTitle>
              <Button 
                onClick={endPracticeSession}
                variant="outline"
                size="sm"
              >
                End Session
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Chat Messages */}
              <div className="space-y-3 max-h-96 overflow-y-auto p-4 bg-muted/20 rounded-lg border">
                {practiceMessages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-card border border-border p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">Practice partner is typing...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  value={currentPracticeMessage}
                  onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendPracticeMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendPracticeMessage}
                  disabled={isLoading || !currentPracticeMessage.trim()}
                  variant="romance"
                  className="h-auto self-end"
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      )}
    </div>
  );
};

export default FlirtFuelModule;