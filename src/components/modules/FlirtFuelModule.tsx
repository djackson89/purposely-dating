import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Share, Wand2, Trash2, Users, X, ChevronLeft, ChevronRight, Expand } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import TextGenie from '@/components/TextGenie';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [showCategoryGrid, setShowCategoryGrid] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Relationship Talk');
  const [customKeywords, setCustomKeywords] = useState('');
  const [currentStarters, setCurrentStarters] = useState<(string | { statement: string; options: { key: string; text: string; }[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customCategories, setCustomCategories] = useState<{ [key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[] }>({});
  const [savedPacks, setSavedPacks] = useState<{ [key: string]: boolean }>({});
  const [showRename, setShowRename] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [practicePartnerActive, setPracticePartnerActive] = useState(false);
  const [practiceMessages, setPracticeMessages] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([]);
  const [currentPracticeMessage, setCurrentPracticeMessage] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('first_date');
  const [showPracticeInput, setShowPracticeInput] = useState(false);
  const [currentScenarioText, setCurrentScenarioText] = useState('');
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [depthLevel, setDepthLevel] = useState([1]); // 0=Light, 1=Casual, 2=Deep
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const { getFlirtSuggestion, getAIResponse, isLoading } = useRelationshipAI();

  // Helper function to check if current question is multiple choice
  const isMultipleChoice = (question: string | { statement: string; options: { key: string; text: string; }[] }): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  };

  // Helper function to get question text
  const getQuestionText = (question: string | { statement: string; options: { key: string; text: string; }[] }): string => {
    return isMultipleChoice(question) ? question.statement : question;
  };

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
      category: 'Trust & Transparency',
      questions: [
        'What does trust mean to you in a relationship, and how do you build it?',
        'Have you ever had your trust broken? How did you handle it?',
        'How do you prefer to handle disagreements or conflicts in relationships?',
        // ... more questions
      ]
    },
    {
      category: 'Boundaries & Values',
      questions: [
        'What are your non-negotiable values in a relationship?',
        'How do you communicate your boundaries to others?',
        'What role does family play in your life and relationships?',
        // ... more questions
      ]
    },
    {
      category: 'Communication & Conflict',
      questions: [
        'How do you prefer to communicate when you\'re upset about something?',
        'What\'s your approach to resolving disagreements?',
        'Do you think it\'s important to fight fair in relationships? What does that look like to you?',
        // ... more questions
      ]
    },
    {
      category: 'Red Flags & Green Flags',
      questions: [
        'What are some relationship red flags that you\'ve learned to recognize?',
        'What green flags do you look for in a potential partner?',
        'How do you handle it when you notice concerning behavior in someone you\'re dating?',
        // ... more questions
      ]
    },
    {
      category: 'Emotional Intelligence',
      questions: [
        'How do you typically process difficult emotions?',
        'What helps you feel emotionally supported in relationships?',
        'How do you show emotional support to others?',
        // ... more questions
      ]
    },
    {
      category: 'Values & Future Vision',
      questions: [
        'What does your ideal relationship dynamic look like?',
        'How important is it that a partner shares your life goals?',
        'What role do you want a romantic relationship to play in your life?',
        // ... more questions
      ]
    },
    {
      category: 'Self-Awareness & Growth',
      questions: [
        'What\'s something you\'ve learned about yourself through past relationships?',
        'How do you work on personal growth and self-improvement?',
        'What patterns have you noticed in your relationships that you want to change?',
        // ... more questions
      ]
    },
    {
      category: 'Intimacy & Connection',
      questions: [
        'What makes you feel most connected to someone?',
        'How do you like to show affection and receive it?',
        'What does emotional intimacy mean to you?',
        // ... more questions
      ]
    }
  ];

  const adjustQuestionDepth = async (originalQuestion: string, depth: number) => {
    try {
      const depthInstructions = {
        0: "Transform this into a sarcastic, witty question with dark humor. Make it snarky and playfully provocative - like asking someone 'At what point did you realize you were toxic and are you still a walking red flag or have you completed rehab?' Keep it edgy but still conversational.",
        1: "Keep this question as is - it's perfectly balanced for casual dating conversation.",
        2: "Make this question deeper and more introspective. Add layers that explore underlying motivations, childhood influences, or philosophical perspectives. Transform it into something that could spark a 2-hour conversation about life, relationships, and personal growth."
      };

      if (depth === 1) return originalQuestion; // No change needed for casual level

      const instruction = depthInstructions[depth as keyof typeof depthInstructions];
      const adjustedQuestion = await getFlirtSuggestion(`${instruction}\n\nOriginal question: "${originalQuestion}"`, userProfile);
      return adjustedQuestion;
    } catch (error) {
      console.error('Error adjusting question depth:', error);
      return originalQuestion;
    }
  };

  // Initialize current starters with default category and daily shuffling
  useEffect(() => {
    if (isCustom) return;
    const category = conversationStarters.find(cat => cat.category === selectedCategory);
    if (category) {
      setCurrentStarters(category.questions);
      const today = new Date().toDateString();
      const savedIndex = localStorage.getItem(`dailyQuestionIndex_${selectedCategory}_${today}`);
      if (savedIndex) {
        setCurrentQuestionIndex(parseInt(savedIndex, 10));
      } else {
        const randomIndex = Math.floor(Math.random() * category.questions.length);
        setCurrentQuestionIndex(randomIndex);
        localStorage.setItem(`dailyQuestionIndex_${selectedCategory}_${today}`, randomIndex.toString());
      }
    }
  }, [selectedCategory, isCustom]);

  // Adjust starters based on depth level
  useEffect(() => {
    const adjustStarters = async () => {
      if (!isCustom && currentStarters.length > 0) {
        const category = conversationStarters.find(cat => cat.category === selectedCategory);
        if (category) {
          if (depthLevel[0] !== 1) {
            const adjusted = await Promise.all(category.questions.map(q => adjustQuestionDepth(q, depthLevel[0])));
            setCurrentStarters(adjusted);
          } else {
            setCurrentStarters(category.questions);
          }
        }
      }
    };
    adjustStarters();
  }, [depthLevel, selectedCategory, isCustom]);

  // Category selection handler
  const handleCategorySelect = (categoryName: string) => {
    if (categoryName === 'Customize') {
      setSelectedCategory('Customize');
      setIsCustom(false);
      setCurrentStarters([]);
      setCustomKeywords('');
      setShowCategoryGrid(false);
      return;
    }
    setSelectedCategory(categoryName);
    setShowCategoryGrid(false);
    if (customCategories[categoryName]) {
      setIsCustom(true);
      setCurrentStarters(customCategories[categoryName]);
      setCurrentQuestionIndex(0);
    } else {
      setIsCustom(false);
      const category = conversationStarters.find(cat => cat.category === categoryName);
      if (category) {
        setCurrentStarters(category.questions);
        setCurrentQuestionIndex(0);
      }
    }
  };

  const goBackToCategoryGrid = () => {
    setShowCategoryGrid(true);
    setSelectedAnswer(null);
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < currentStarters.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      await loadMoreStarters();
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const loadMoreStarters = async () => {
    if (isCustom && customCategories[selectedCategory]) {
      const existingQuestions = customCategories[selectedCategory];
      const prompt = `Generate 8 new conversation starter questions similar to these but completely different: ${existingQuestions.join(', ')}`;
      try {
        const response = await getAIResponse(prompt, userProfile, 'flirt');
        const questions = response.split('\n').filter(line =>
          line.trim() &&
          (line.includes('?') || line.match(/^\d+\.?/))
        ).map(line =>
          line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
        ).slice(0, 8);
        if (questions.length > 0) {
          setCurrentStarters(questions);
          setCurrentQuestionIndex(0);
        }
      } catch (error) {
        console.error('Error loading more starters:', error);
        const shuffled = [...customCategories[selectedCategory]].sort(() => Math.random() - 0.5);
        setCurrentStarters(shuffled);
        setCurrentQuestionIndex(0);
      }
    } else {
      const category = conversationStarters.find(cat => cat.category === selectedCategory);
      if (category) {
        const prompt = `Generate 8 new conversation starter questions in the style of "${selectedCategory}" category that go beyond surface-level dating questions. Make them emotionally intelligent, boundary-aware, and specific enough that someone thinks "That's such a good question, I never thought about that." Focus on relationship dynamics, emotional maturity, and authentic connection. They should be similar to these examples but completely different: ${category.questions.slice(0, 5).join(', ')}. Make them engaging, thought-provoking, and perfect for sparking meaningful conversations about real relationship topics.`;
        try {
          const response = await getAIResponse(prompt, userProfile, 'flirt');
          const questions = response.split('\n').filter(line =>
            line.trim() &&
            (line.includes('?') || line.match(/^\d+\.?/))
          ).map(line =>
            line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
          ).slice(0, 8);
          if (questions.length > 0) {
            setCurrentStarters(questions);
            setCurrentQuestionIndex(0);
          } else {
            throw new Error('No valid questions generated');
          }
        } catch (error) {
          console.error('Error loading more starters:', error);
          const shuffled = [...category.questions].sort(() => Math.random() - 0.5);
          setCurrentStarters(shuffled);
          setCurrentQuestionIndex(0);
        }
      }
    }
  };

  const generateCustomStarters = async () => {
    if (!customKeywords.trim()) return;
    try {
      const prompt = `Generate 8 emotionally intelligent conversation starter questions based on these keywords: ${customKeywords}. The questions should go beyond surface-level topics and explore relationship boundaries, emotional dynamics, and authentic connection. Make them specific enough that someone thinks "Wow, I never thought to ask that before." Focus on topics that reveal character, values, and emotional maturity while incorporating the mood/themes of the keywords provided.`;
      const response = await getAIResponse(prompt, userProfile, 'flirt');
      const questions = response.split('\n').filter(line =>
        line.trim() &&
        (line.includes('?') || line.match(/^\d+\.?/))
      ).map(line =>
        line.replace(/^\d+\.?\s*/, '').replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()
      ).slice(0, 8);
      const customIndex = Object.keys(customCategories).length + 1;
      const categoryName = `Custom${customIndex}`;
      setCustomCategories(prev => ({
        ...prev,
        [categoryName]: questions
      }));
      setCurrentStarters(questions);
      setCurrentQuestionIndex(0);
      setIsCustom(true);
      setSelectedCategory(categoryName);
      setCustomKeywords('');
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
    setSavedPacks(prev => ({
      ...prev,
      [categoryName]: true
    }));
    setSelectedCategory(categoryName);
  };

  const deleteCustomCategory = (categoryName: string) => {
    if (!customCategories[categoryName]) return;
    setCustomCategories(prev => {
      const newCategories = { ...prev };
      delete newCategories[categoryName];
      return newCategories;
    });
    setSavedPacks(prev => {
      const newPacks = { ...prev };
      delete newPacks[categoryName];
      return newPacks;
    });
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

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    });
    const deltaX = touchStart.x - e.changedTouches[0].clientX;
    const deltaY = touchStart.y - e.changedTouches[0].clientY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        nextQuestion();
      } else {
        previousQuestion();
      }
    }
  };

  const openFullScreen = () => {
    setIsFullScreen(true);
  };

  const closeFullScreen = () => {
    setIsFullScreen(false);
  };

  // AI Practice Partner methods (simplified placeholder)
  // For brevity, practice partner UI is simplified here
  // You can expand this section with full practice partner logic as needed

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
          {showCategoryGrid ? (
            <div className="grid grid-cols-2 gap-3">
              {conversationStarters.map((category) => (
                <Button
                  key={category.category}
                  onClick={() => handleCategorySelect(category.category)}
                  variant="soft"
                  className="h-auto p-4 text-left flex flex-col items-start"
                >
                  <span className="font-medium text-sm">{category.category}</span>
                </Button>
              ))}

              {/* Custom category button */}
              <Button
                onClick={() => handleCategorySelect('Customize')}
                variant="outline"
                className="h-auto p-4 text-left flex flex-col items-start border-dashed"
              >
                <Wand2 className="w-4 h-4 mb-1" />
                <span className="font-medium text-sm">Customize</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Back button */}
              <Button
                onClick={goBackToCategoryGrid}
                variant="soft"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Categories</span>
              </Button>

              {/* Category Dropdown */}
              <Card className="shadow-soft border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-sm font-medium">Category: {selectedCategory}</Label>
                    {Object.keys(customCategories).length > 0 && (
                      <Button
                        onClick={() => setShowManage(true)}
                        variant="soft"
                        size="sm"
                        className="text-xs"
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Manage ({Object.keys(customCategories).length})
                      </Button>
                    )}
                  </div>

                  <Select value={selectedCategory} onValueChange={handleCategorySelect}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conversationStarters.map((category) => (
                        <SelectItem key={category.category} value={category.category}>
                          {category.category}
                        </SelectItem>
                      ))}
                      {Object.keys(customCategories).map((customCat) => (
                        <SelectItem key={customCat} value={customCat}>
                          {customCat} (Custom)
                        </SelectItem>
                      ))}
                      <SelectItem value="Customize">Customize ✨</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Save/Manage button for custom categories */}
                  {isCustom && currentStarters.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={saveCurrentCustom}
                        variant="romance"
                        size="sm"
                        className="flex-1"
                        disabled={!customKeywords.trim()}
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        Save Pack
                      </Button>
                      <Button
                        onClick={() => setShowRename(true)}
                        variant="soft"
                        size="sm"
                        disabled={!savedPacks[selectedCategory]}
                      >
                        Rename
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Custom Input - Only show when Customize is selected */}
              {selectedCategory === 'Customize' && (
                <Card className="shadow-soft border-primary/10">
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label htmlFor="custom-keywords" className="text-sm font-medium">
                        What topics interest you? 💭
                      </Label>
                      <Textarea
                        id="custom-keywords"
                        placeholder="e.g., career goals, travel dreams, family values, creative hobbies..."
                        value={customKeywords}
                        onChange={(e) => setCustomKeywords(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <Button
                      onClick={generateCustomStarters}
                      disabled={!customKeywords.trim() || isLoading}
                      variant="romance"
                      className="w-full"
                    >
                      {isLoading ? 'Creating...' : 'Generate Questions ✨'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Question Card Game */}
              {currentStarters.length > 0 && (
                <div className="space-y-4">
                  {/* Question Card */}
                  <div className="relative min-h-[300px] flex items-center justify-center">
                    <Card
                      className="w-full shadow-romance border-primary/20 bg-gradient-soft cursor-pointer transition-all duration-300 hover:shadow-lg"
                      onClick={openFullScreen}
                      onTouchStart={handleTouchStart}
                      onTouchEnd={handleTouchEnd}
                    >
                      <CardContent className="p-8 flex flex-col justify-center items-center text-center h-full relative">
                        {/* Expand icon */}
                        <div className="absolute top-3 right-3">
                          <Expand className="w-5 h-5 text-muted-foreground" />
                        </div>

                        {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                          <div className="w-full">
                            <p className="text-lg font-bold text-primary mb-6 leading-relaxed">
                              {currentStarters[currentQuestionIndex].statement}
                            </p>
                            <div className="space-y-3 text-left">
                              {currentStarters[currentQuestionIndex].options.map((option) => (
                                <div key={option.key} className="text-sm">
                                  <span className="font-bold text-primary mr-2">{option.key}.</span>
                                  <span className="text-muted-foreground">{option.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg font-bold text-primary leading-relaxed">
                            {getQuestionText(currentStarters[currentQuestionIndex])?.replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Depth Slider */}
                  <Card className="shadow-soft border-primary/10">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Conversation Depth</Label>
                          <Badge variant={depthLevel[0] === 0 ? "secondary" : depthLevel[0] === 1 ? "default" : "destructive"}>
                            {depthLevel[0] === 0 ? 'Playful' : depthLevel[0] === 1 ? 'Casual' : 'Deep'}
                          </Badge>
                        </div>
                        <Slider
                          value={depthLevel}
                          onValueChange={setDepthLevel}
                          max={2}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Playful & Light</span>
                          <span>Balanced</span>
                          <span>Deep & Meaningful</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation Controls */}
                  <div className="flex justify-between items-center px-2 sm:px-4">
                    <Button
                      onClick={previousQuestion}
                      disabled={currentQuestionIndex === 0}
                      variant="soft"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </Button>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {currentQuestionIndex + 1} of {currentStarters.length}
                      </span>
                    </div>

                    <Button
                      onClick={nextQuestion}
                      disabled={currentQuestionIndex === currentStarters.length - 1 || isLoading}
                      variant="soft"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <span className="hidden sm:inline">{isLoading ? '...' : 'Next'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
                      variant="romance"
                      className="w-full flex items-center justify-center space-x-2"
                    >
                      <Share className="w-4 h-4" />
                      <span>Share This Question</span>
                    </Button>

                    <Button
                      onClick={loadMoreStarters}
                      variant="soft"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Generating...' : 'Load More Questions'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Text Genie */}
      {activeSection === 'textgenie' && (
        <div className="animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Wand2 className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">Text Genie</h2>
          </div>

          {/* Text Genie Component */}
          <TextGenie userProfile={userProfile} />
        </div>
      )}

      {/* AI Practice Partner */}
      {activeSection === 'practice' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <Zap className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-primary">AI Practice Partner</h2>
          </div>

          <Card className="shadow-romance border-primary/20 bg-gradient-soft">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>Practice Real Conversations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Practice content would go here */}
              <div className="text-center py-8">
                <p className="text-muted-foreground">AI Practice Partner coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Screen Question Modal */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen m-0 p-0 rounded-none border-none bg-gradient-romance [&>button]:hidden">
          <div className="relative h-full flex flex-col">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <Button
                onClick={closeFullScreen}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-10 h-10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Navigation arrows */}
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                onClick={previousQuestion}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 opacity-80 hover:opacity-100 transition-opacity"
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            </div>

            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
              <Button
                onClick={nextQuestion}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full w-12 h-12 opacity-80 hover:opacity-100 transition-opacity"
                disabled={currentQuestionIndex === currentStarters.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            <div
              className="flex-1 flex items-center justify-center p-8 select-none cursor-pointer"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="text-center max-w-full px-4 sm:px-8">
                {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                  <div className="w-full">
                    <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight mb-6 sm:mb-8">
                      {currentStarters[currentQuestionIndex].statement}
                    </p>
                    <div className="space-y-3 sm:space-y-4 text-left max-w-4xl mx-auto">
                      {currentStarters[currentQuestionIndex].options.map((option) => (
                        <div key={option.key} className="text-white/90">
                          <span className="font-bold text-lg sm:text-xl mr-3">{option.key}.</span>
                          <span className="text-base sm:text-lg leading-relaxed break-words">
                            {option.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight px-2">
                    {getQuestionText(currentStarters[currentQuestionIndex])?.replace(/\*\*/g, '').replace(/[""'']/g, '"').replace(/[^\w\s\?\.\!\,\:\;\(\)\-\'\"]/g, '').trim()}
                  </p>
                )}
              </div>
            </div>

            {/* Navigation indicators */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-3">
                {currentStarters.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                      index === currentQuestionIndex
                        ? 'bg-white'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
                  />
                ))}
              </div>
            </div>

            {/* Swipe instructions */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
              <p className="text-white/70 text-sm">Swipe or tap arrows to navigate</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;
