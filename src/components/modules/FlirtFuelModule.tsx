import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  const [activeSection, setActiveSection] = useState<'prospects' | 'starters' | 'messages' | 'practice'>('prospects');
  const [prospects, setProspects] = useState<DatingProspect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectNickname, setNewProspectNickname] = useState('');
  const [newProspectRanking, setNewProspectRanking] = useState(1);
  const [showMoreMetrics, setShowMoreMetrics] = useState<{ [key: string]: boolean }>({});
  const [aiContext, setAiContext] = useState<{ [key: string]: string }>({});
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

  const sections = [
    { id: 'prospects', label: 'Dating Prospects', icon: Users },
    { id: 'starters', label: 'Conversation', icon: MessageCircle },
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

      {/* Dating Prospects */}
      {activeSection === 'prospects' && (
        <div className="space-y-4 animate-fade-in-up">
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
          {conversationStarters.map((category, index) => (
            <Card key={index} className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle className="text-primary">{category.category}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {category.prompts.map((prompt, promptIndex) => (
                  <div 
                    key={promptIndex}
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
          ))}
        </div>
      )}

      {/* Flirty Texts */}
      {activeSection === 'messages' && (
        <div className="space-y-4 animate-fade-in-up">
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