import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Users, Share, Plus, ChevronDown, ChevronUp, Eye, EyeOff, ThumbsUp, ThumbsDown, HelpCircle, Trash2, Wand2 } from 'lucide-react';
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

interface DatingProspect {
  id: string;
  nickname: string;
  ranking: number;
  attractiveness: number[];
  flags: { [key: string]: 'green' | 'red' | 'unsure' };
  isExpanded: boolean;
}

const flagMetrics = [
  "Dating history",
  "Financial situation", 
  "Career choice",
  "Social media posts",
  "Hobbies",
  "Communication style",
  "Family relationships",
  "Life goals",
  "Values alignment",
  "Emotional maturity",
  "Conflict resolution",
  "Physical health",
  "Mental health awareness",
  "Educational background",
  "Travel interests",
  "Pet preferences",
  "Religious beliefs",
  "Political views",
  "Social circle",
  "Work-life balance",
  "Ambition level",
  "Sense of humor",
  "Generosity",
  "Reliability",
  "Independence",
  "Cooking skills",
  "Fitness habits",
  "Drinking habits",
  "Smoking habits",
  "Drug use",
  "Past relationships",
  "Trust issues",
  "Jealousy tendencies",
  "Future planning",
  "Lifestyle compatibility",
  "Intimacy comfort",
  "Personal hygiene",
  "Fashion sense",
  "Cultural interests",
  "Technology comfort"
];

const FlirtFuelModule: React.FC<FlirtFuelModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'prospects' | 'starters' | 'practice' | 'textgenie'>('starters');
  const [prospects, setProspects] = useState<DatingProspect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectNickname, setNewProspectNickname] = useState('');
  const [newProspectRanking, setNewProspectRanking] = useState(1);
  const [showMoreMetrics, setShowMoreMetrics] = useState<{ [key: string]: boolean }>({});
  const [aiContext, setAiContext] = useState<{ [key: string]: string }>({});
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


  const addNewProspect = () => {
    if (!newProspectNickname.trim()) return;
    
    const newProspect: DatingProspect = {
      id: Date.now().toString(),
      nickname: newProspectNickname,
      ranking: newProspectRanking,
      attractiveness: [5],
      flags: {},
      isExpanded: false
    };
    
    setProspects([...prospects, newProspect]);
    setNewProspectNickname('');
    setNewProspectRanking(prospects.length + 1);
    setShowAddForm(false);
  };

  const updateProspectFlag = (prospectId: string, metric: string, value: 'green' | 'red' | 'unsure') => {
    setProspects(prospects.map(prospect => 
      prospect.id === prospectId 
        ? { ...prospect, flags: { ...prospect.flags, [metric]: value } }
        : prospect
    ));
  };

  const updateProspectAttractiveness = (prospectId: string, value: number[]) => {
    setProspects(prospects.map(prospect => 
      prospect.id === prospectId 
        ? { ...prospect, attractiveness: value }
        : prospect
    ));
  };

  const toggleProspectExpansion = (prospectId: string) => {
    setProspects(prospects.map(prospect => 
      prospect.id === prospectId 
        ? { ...prospect, isExpanded: !prospect.isExpanded }
        : prospect
    ));
  };

  const calculateGrade = (prospect: DatingProspect) => {
    const flags = Object.values(prospect.flags);
    if (flags.length === 0) return { numeric: 70, letter: 'C' };
    
    const greenFlags = flags.filter(flag => flag === 'green').length;
    const redFlags = flags.filter(flag => flag === 'red').length;
    const unsureFlags = flags.filter(flag => flag === 'unsure').length;
    
    // Base score of 70 (C), +5 for green, -10 for red, +0 for unsure
    let score = 70 + (greenFlags * 5) - (redFlags * 10);
    score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
    
    let letter = 'F';
    if (score >= 97) letter = 'A+';
    else if (score >= 93) letter = 'A';
    else if (score >= 90) letter = 'A-';
    else if (score >= 87) letter = 'B+';
    else if (score >= 83) letter = 'B';
    else if (score >= 80) letter = 'B-';
    else if (score >= 77) letter = 'C+';
    else if (score >= 73) letter = 'C';
    else if (score >= 70) letter = 'C-';
    else if (score >= 67) letter = 'D+';
    else if (score >= 63) letter = 'D';
    else if (score >= 60) letter = 'D-';
    
    return { numeric: score, letter };
  };

  const handleAskPurposely = async (prospectId: string) => {
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    const context = aiContext[prospectId] || '';
    const grade = calculateGrade(prospect);
    
    const prompt = `I need advice about my dating prospect "${prospect.nickname}". 
    Their overall grade is ${grade.letter} (${grade.numeric}/100).
    Attractiveness level: ${prospect.attractiveness[0]}/10.
    Green flags: ${Object.entries(prospect.flags).filter(([_, flag]) => flag === 'green').map(([metric]) => metric).join(', ')}
    Red flags: ${Object.entries(prospect.flags).filter(([_, flag]) => flag === 'red').map(([metric]) => metric).join(', ')}
    Unsure about: ${Object.entries(prospect.flags).filter(([_, flag]) => flag === 'unsure').map(([metric]) => metric).join(', ')}
    Additional context: ${context}
    
    Please provide insights on how to proceed, conversation pacing, and whether I should reconsider dating them.`;
    
    try {
      const response = await getFlirtSuggestion(prompt, userProfile);
      alert(response); // You might want to replace this with a proper modal/dialog
    } catch (error) {
      console.error('Error getting AI advice:', error);
      alert('Sorry, there was an error getting advice. Please try again.');
    }
  };

  const deleteProspect = (prospectId: string) => {
    setProspects(prospects.filter(p => p.id !== prospectId));
    // Clean up related state
    const newShowMoreMetrics = { ...showMoreMetrics };
    delete newShowMoreMetrics[prospectId];
    setShowMoreMetrics(newShowMoreMetrics);
    
    const newAiContext = { ...aiContext };
    delete newAiContext[prospectId];
    setAiContext(newAiContext);
  };

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

  const sections = [
    { id: 'starters', label: 'Conversation Starters', icon: MessageCircle },
    { id: 'textgenie', label: 'Text Genie', icon: Wand2 },
    { id: 'prospects', label: 'Dating Prospects', icon: Users },
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
      <div className="grid grid-cols-4 gap-2 mb-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="flex items-center justify-center p-3 h-12 w-12 mx-auto"
              title={section.label}
            >
              <IconComponent className="w-5 h-5" />
            </Button>
          );
        })}
      </div>

      {/* Dating Prospects */}
      {activeSection === 'prospects' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Dating Prospects</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <FTUETooltip
                id="dating-prospects"
                title="Dating Prospects"
                description="Organize and track the people you're interested in dating. Rate their compatibility, flag important qualities, and get AI insights to help you make better dating decisions."
              />
            </div>
          </div>
          {/* Add New Prospect Button */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <Button 
                onClick={() => setShowAddForm(!showAddForm)}
                variant="romance" 
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Prospect
              </Button>
              
              {showAddForm && (
                <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium mb-1 block">Prospect Nickname</label>
                      <Input
                        value={newProspectNickname}
                        onChange={(e) => setNewProspectNickname(e.target.value)}
                        placeholder="Enter nickname"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-sm font-medium mb-1 block">Ranking</label>
                      <Select value={newProspectRanking.toString()} onValueChange={(value) => setNewProspectRanking(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: prospects.length + 1 }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={addNewProspect} size="sm">Add</Button>
                    <Button onClick={() => setShowAddForm(false)} variant="outline" size="sm">Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Prospects List */}
          {prospects.map((prospect) => {
            const grade = calculateGrade(prospect);
            const visibleMetrics = showMoreMetrics[prospect.id] ? flagMetrics : flagMetrics.slice(0, 8);
            
            return (
              <Card key={prospect.id} className="shadow-soft border-primary/10">
                <CardContent className="pt-6">
                  {/* Collapsed View */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium text-lg">{prospect.nickname}</h3>
                      <Badge variant="secondary">Rank #{prospect.ranking}</Badge>
                    </div>
                    <Button
                      onClick={() => toggleProspectExpansion(prospect.id)}
                      variant="ghost"
                      size="sm"
                    >
                      {prospect.isExpanded ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-1" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-1" />
                          Show Scorecard
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Expanded View */}
                  {prospect.isExpanded && (
                    <div className="space-y-6">
                      {/* Attractiveness Slider */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Attractiveness Level: {prospect.attractiveness[0]}/10
                        </label>
                        <Slider
                          value={prospect.attractiveness}
                          onValueChange={(value) => updateProspectAttractiveness(prospect.id, value)}
                          max={10}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      {/* Flag Metrics */}
                      <div>
                        <h4 className="font-medium mb-3">Assessment Metrics</h4>
                        <div className="space-y-3">
                          {visibleMetrics.map((metric) => (
                            <div key={metric} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <span className="text-sm font-medium">{prospect.nickname}'s {metric.toLowerCase()}:</span>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant={prospect.flags[metric] === 'green' ? "default" : "outline"}
                                  onClick={() => updateProspectFlag(prospect.id, metric, 'green')}
                                  className={`${
                                    prospect.flags[metric] === 'green' 
                                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                                      : 'bg-transparent text-foreground hover:bg-green-50'
                                  }`}
                                >
                                  <ThumbsUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={prospect.flags[metric] === 'red' ? "default" : "outline"}
                                  onClick={() => updateProspectFlag(prospect.id, metric, 'red')}
                                  className={`${
                                    prospect.flags[metric] === 'red' 
                                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                                      : 'bg-transparent text-foreground hover:bg-red-50'
                                  }`}
                                >
                                  <ThumbsDown className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant={prospect.flags[metric] === 'unsure' ? "default" : "outline"}
                                  onClick={() => updateProspectFlag(prospect.id, metric, 'unsure')}
                                  className={`${
                                    prospect.flags[metric] === 'unsure' 
                                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                                      : 'bg-transparent text-foreground hover:bg-yellow-50'
                                  }`}
                                >
                                  <HelpCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                          
                          {flagMetrics.length > 8 && (
                            <Button
                              onClick={() => setShowMoreMetrics({
                                ...showMoreMetrics,
                                [prospect.id]: !showMoreMetrics[prospect.id]
                              })}
                              variant="ghost"
                              size="sm"
                              className="w-full"
                            >
                              {showMoreMetrics[prospect.id] ? (
                                <>
                                  <ChevronUp className="w-4 h-4 mr-1" />
                                  Show Less
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-4 h-4 mr-1" />
                                  See More ({flagMetrics.length - 8} more metrics)
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Overall Grade */}
                      <div className="text-center p-4 bg-gradient-soft rounded-lg border border-primary/10">
                        <h4 className="font-medium mb-2">Overall Grade</h4>
                        <div className="text-3xl font-bold text-primary">
                          {grade.letter} ({grade.numeric}/100)
                        </div>
                      </div>

                      {/* Ask Purposely Section */}
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add context for more tailored advice..."
                          value={aiContext[prospect.id] || ''}
                          onChange={(e) => setAiContext({
                            ...aiContext,
                            [prospect.id]: e.target.value
                          })}
                        />
                        <Button
                          onClick={() => handleAskPurposely(prospect.id)}
                          disabled={isLoading}
                          variant="romance"
                          className="w-full"
                        >
                          {isLoading ? 'Getting advice...' : 'Ask Purposely'}
                        </Button>
                      </div>

                      {/* Delete Prospect Button */}
                      <div className="pt-4 border-t border-border">
                        <Button
                          onClick={() => deleteProspect(prospect.id)}
                          variant="destructive"
                          size="sm"
                          className="w-full"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Prospect
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {prospects.length === 0 && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">No dating prospects yet. Add your first one above!</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
        <Card className="shadow-romance border-primary/20">
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
        </div>
      )}
    </div>
  );
};

export default FlirtFuelModule;