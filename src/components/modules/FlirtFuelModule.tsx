import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Users, Share, Plus, ChevronDown, ChevronUp, Eye, EyeOff, ThumbsUp, ThumbsDown, HelpCircle, Trash2 } from 'lucide-react';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';

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
  const [activeSection, setActiveSection] = useState<'prospects' | 'starters' | 'messages' | 'practice'>('starters');
  const [prospects, setProspects] = useState<DatingProspect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectNickname, setNewProspectNickname] = useState('');
  const [newProspectRanking, setNewProspectRanking] = useState(1);
  const [showMoreMetrics, setShowMoreMetrics] = useState<{ [key: string]: boolean }>({});
  const [aiContext, setAiContext] = useState<{ [key: string]: string }>({});
  const [selectedCategory, setSelectedCategory] = useState('Relationship Talk');
  const [customKeywords, setCustomKeywords] = useState('');
  const [currentStarters, setCurrentStarters] = useState<string[]>([]);
  const [isCustom, setIsCustom] = useState(false);
  const [assertivenessLevel, setAssertivenessLevel] = useState([5]); // 1-10 scale, 5 is middle
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();

  const handleShare = async (text: string) => {
    try {
      // Try Capacitor Share first (for mobile)
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter from FlirtFuel',
          text: text,
        });
      } else {
        // Fallback to Web Share API
        if (navigator.share) {
          await navigator.share({
            title: 'Conversation Starter from FlirtFuel',
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
        "What does emotional intimacy mean to you?",
        "How do you like to show and receive affection?",
        "What makes you feel most connected to someone?",
        "What's your favorite way to be romantic?",
        "How do you express love without words?",
        "What makes you feel most vulnerable in a good way?"
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

  const getFlirtyMessages = () => {
    const level = assertivenessLevel[0];
    
    if (level <= 3) {
      // Passive (1-3)
      return [
        {
          text: "Hope you're having a good day 😊",
          explanation: "Gentle and sweet, shows care without being overwhelming.",
          goodFor: "Early stages when testing the waters or with shy personalities",
          avoidWhen: "When you want to escalate romantic tension quickly",
          familiarityLevel: "After a few conversations or early dating"
        },
        {
          text: "You crossed my mind today... 💭",
          explanation: "Subtle hint of interest that's easy to respond to without pressure.",
          goodFor: "Building gentle romantic awareness and creating soft connection",
          avoidWhen: "When they've shown they prefer more direct communication",
          familiarityLevel: "After establishing mutual interest"
        },
        {
          text: "That smile of yours is pretty special ☺️",
          explanation: "Complimentary but not overly intense, focuses on something sweet.",
          goodFor: "Making them feel good about themselves without overwhelming pressure",
          avoidWhen: "If they're uncomfortable with appearance-based compliments",
          familiarityLevel: "After you've seen them smile in person"
        }
      ];
    } else if (level <= 7) {
      // Moderate (4-7) 
      return [
        {
          text: "You've been on my mind all day... 💕",
          explanation: "Creates romantic tension and shows they're a priority in your thoughts.",
          goodFor: "Building romantic momentum and showing serious interest",
          avoidWhen: "Very early dating stages or if they're not ready for emotional intensity",
          familiarityLevel: "After physical chemistry is established and mutual interest is clear"
        },
        {
          text: "Missing that gorgeous smile of yours",
          explanation: "Combines physical compliment with emotional longing, creating connection.",
          goodFor: "When you haven't seen them recently and want to express attraction",
          avoidWhen: "If they're insecure about their appearance or prefer non-physical compliments",
          familiarityLevel: "After you've established physical attraction and comfort"
        },
        {
          text: "Planning something special for us 😉",
          explanation: "Creates anticipation and mystery while implying future together.",
          goodFor: "Building excitement before dates or special occasions",
          avoidWhen: "If they prefer direct communication or are anxious about surprises",
          familiarityLevel: "After establishing trust and knowing their preferences"
        }
      ];
    } else {
      // Assertive (8-10)
      return [
        {
          text: "Can't stop thinking about how amazing you looked last night 🔥",
          explanation: "Direct physical appreciation with intensity that shows strong attraction.",
          goodFor: "When there's established mutual attraction and you want to be bold",
          avoidWhen: "Early dating stages or if they prefer subtle compliments",
          familiarityLevel: "After physical intimacy or very strong mutual attraction is established"
        },
        {
          text: "You drive me absolutely crazy in the best way 😍",
          explanation: "Expresses intense attraction and desire in a playful but direct manner.",
          goodFor: "Escalating romantic tension and expressing passionate interest",
          avoidWhen: "If they prefer gentle romance or are overwhelmed by intensity",
          familiarityLevel: "In an established romantic relationship or very strong connection"
        },
        {
          text: "I want you. Can't wait to see you tonight 💋",
          explanation: "Very direct expression of desire that leaves no doubt about intentions.",
          goodFor: "When you have an established intimate relationship and strong chemistry",
          avoidWhen: "Early dating, uncertain relationships, or with reserved personalities",
          familiarityLevel: "In committed relationships or after establishing intimate boundaries"
        }
      ];
    }
  };

  const loadMoreFlirtyMessages = async () => {
    const level = assertivenessLevel[0];
    let styleDescription = '';
    
    if (level <= 3) {
      styleDescription = 'passive, gentle, and sweet. They should be perfect for early relationship stages and shy personalities.';
    } else if (level <= 7) {
      styleDescription = 'moderately flirty with romantic tension. They should build attraction while being confident but not overwhelming.';
    } else {
      styleDescription = 'assertive, bold, and direct. They should express strong desire and passion for established intimate relationships.';
    }
    
    const prompt = `Generate 3 new flirty text message suggestions that are ${styleDescription} Include the message text and brief explanations of why they work, when to use them, when to avoid them, and what level of familiarity is needed. Format each as a complete suggestion with explanations.`;
    
    try {
      const response = await getFlirtSuggestion(prompt, userProfile);
      
      // This would ideally parse the AI response and add to existing messages
      // For now, we'll show the response in an alert (you could enhance this with a modal)
      alert(`New flirty message suggestions:\n\n${response}`);
    } catch (error) {
      console.error('Error generating more flirty messages:', error);
    }
  };

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
    }
  }, [selectedCategory, isCustom]);

  const generateCustomStarters = async () => {
    if (!customKeywords.trim()) return;
    
    try {
      const prompt = `Generate 6 conversation starter questions based on these keywords: ${customKeywords}. The questions should be engaging, thoughtful, and incorporate the mood/themes of the keywords provided.`;
      const response = await getFlirtSuggestion(prompt, userProfile);
      
      // Parse the response into an array of questions
      const questions = response.split('\n').filter(line => 
        line.trim() && 
        (line.includes('?') || line.match(/^\d+\.?/))
      ).map(line => 
        line.replace(/^\d+\.?\s*/, '').trim()
      ).slice(0, 6);
      
      setCurrentStarters(questions);
      setIsCustom(true);
      setSelectedCategory('Custom');
    } catch (error) {
      console.error('Error generating custom starters:', error);
    }
  };

  const loadMoreStarters = async () => {
    if (isCustom) {
      await generateCustomStarters();
    } else {
      const category = conversationStarters.find(cat => cat.category === selectedCategory);
      if (category) {
        // Generate more questions for the same category
        const prompt = `Generate 6 new conversation starter questions in the style of "${selectedCategory}" category. They should be similar to these examples but completely different: ${category.prompts.join(', ')}`;
        try {
          const response = await getFlirtSuggestion(prompt, userProfile);
          const questions = response.split('\n').filter(line => 
            line.trim() && 
            (line.includes('?') || line.match(/^\d+\.?/))
          ).map(line => 
            line.replace(/^\d+\.?\s*/, '').trim()
          ).slice(0, 6);
          
          setCurrentStarters(questions);
        } catch (error) {
          console.error('Error loading more starters:', error);
        }
      }
    }
  };

  const selectCategory = (categoryName: string) => {
    setSelectedCategory(categoryName);
    setIsCustom(false);
    const category = conversationStarters.find(cat => cat.category === categoryName);
    if (category) {
      setCurrentStarters(category.prompts);
    }
  };

  const sections = [
    { id: 'starters', label: 'Conversation Starters', icon: MessageCircle },
    { id: 'prospects', label: 'Dating Prospects', icon: Users },
    { id: 'messages', label: 'Flirty Texts', icon: Heart },
    { id: 'practice', label: 'AI Practice', icon: Zap }
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

      {/* Section Tabs - Stacked and Visible */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={activeSection === section.id ? "romance" : "soft"}
              size="sm"
              className="flex flex-col items-center p-3 h-auto"
            >
              <IconComponent className="w-4 h-4 mb-1" />
              <span className="text-xs leading-tight text-center">{section.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Dating Prospects */}
      {activeSection === 'prospects' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Descriptive One-liner */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Whether building a roster or evaluating a potential soulmate, keep track of the red flags, green flags, and even let Purposely tell you the best way to move forward towards your Happily Ever After!
              </p>
            </CardContent>
          </Card>
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
          {/* Descriptive One-liner */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Break the ice and dive deep with thoughtfully curated questions for every stage of your relationship journey.
              </p>
            </CardContent>
          </Card>

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
                    {conversationStarters.map((category) => (
                      <SelectItem 
                        key={category.category} 
                        value={category.category}
                        className="bg-card hover:bg-muted cursor-pointer"
                      >
                        {category.category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Custom Input */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6 space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter keywords (e.g., sexy, deep, funny)"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={generateCustomStarters}
                  disabled={isLoading || !customKeywords.trim()}
                  variant="romance"
                >
                  {isLoading ? '...' : 'Customize'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current Category Name */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-primary">
              {isCustom ? 'Custom' : selectedCategory}
            </h3>
          </div>

          {/* Questions with Share Icons */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6 space-y-3">
              {currentStarters.map((prompt, index) => (
                <div 
                  key={index}
                  className="p-3 bg-muted/50 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="flex justify-between items-start space-x-3">
                    <p className="text-sm text-foreground flex-1">{prompt}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare(prompt)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Share className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* See More Button */}
          <div className="text-center">
            <Button
              onClick={loadMoreStarters}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'See More'}
            </Button>
          </div>
        </div>
      )}

      {/* Flirty Texts */}
      {activeSection === 'messages' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Descriptive One-liner */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Keep the spark alive with sweet messages and daily challenges that build deeper connection and confidence.
              </p>
            </CardContent>
          </Card>
          {/* Daily Challenge moved here */}
          <Card className="shadow-romance border-primary/20">
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
          
          {/* Text Message Ideas */}
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-primary" />
                <span>Flirty Messages</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Assertiveness Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Flirt Style</span>
                  <span className="text-sm text-muted-foreground">
                    {assertivenessLevel[0] <= 3 ? 'Passive' : 
                     assertivenessLevel[0] <= 7 ? 'Moderate' : 'Assertive'}
                  </span>
                </div>
                <Slider
                  value={assertivenessLevel}
                  onValueChange={setAssertivenessLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Passive</span>
                  <span>Assertive</span>
                </div>
              </div>

              {/* Messages based on assertiveness level */}
              {getFlirtyMessages().map((message, messageIndex) => (
                <div 
                  key={messageIndex}
                  className="p-4 bg-gradient-soft rounded-lg border border-primary/10 hover:shadow-soft transition-all"
                >
                  <div className="space-y-3">
                    <p className="text-sm text-foreground font-medium">{message.text}</p>
                    
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <span className="font-medium text-primary">Why it works: </span>
                        {message.explanation}
                      </div>
                      
                      <div>
                        <span className="font-medium text-green-600">Good for: </span>
                        {message.goodFor}
                      </div>
                      
                      <div>
                        <span className="font-medium text-red-600">Avoid when: </span>
                        {message.avoidWhen}
                      </div>
                      
                      <div>
                        <span className="font-medium text-blue-600">Familiarity needed: </span>
                        {message.familiarityLevel}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShare(message.text)}
                        className="p-1 h-auto"
                      >
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* See More Button */}
          <div className="text-center">
            <Button
              onClick={loadMoreFlirtyMessages}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'See More'}
            </Button>
          </div>
        </div>
      )}

      {/* AI Practice */}
      {activeSection === 'practice' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Descriptive One-liner */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                Practice conversations and build your confidence in a safe, judgment-free space before the real deal.
              </p>
            </CardContent>
          </Card>
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