import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Sparkles, Heart, Users, Coffee, Plus, ChevronDown, ChevronUp, Eye, EyeOff, ThumbsUp, ThumbsDown, HelpCircle, Trash2 } from 'lucide-react';
import { InfoDialog } from '@/components/ui/info-dialog';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
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

interface DateConciergeModuleProps {
  userProfile: OnboardingData;
}

const DateConciergeModule: React.FC<DateConciergeModuleProps> = ({ userProfile }) => {
  const [activeSection, setActiveSection] = useState<'prospects' | 'suggestions' | 'local' | 'planning'>('prospects');
  
  // Dating Prospects state
  const [prospects, setProspects] = useState<DatingProspect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectNickname, setNewProspectNickname] = useState('');
  const [newProspectRanking, setNewProspectRanking] = useState(1);
  const [showMoreMetrics, setShowMoreMetrics] = useState<{ [key: string]: boolean }>({});
  const [aiContext, setAiContext] = useState<{ [key: string]: string }>({});
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();
  
  // Dating Prospects functions
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

  // AI-powered date suggestions based on user profile
  const getPersonalizedDates = () => {
    const baseIdeas = [
      {
        name: "Cozy Coffee & Deep Conversation",
        description: "Find a quiet café with comfortable seating for meaningful talks",
        budget: "Low",
        mood: ["Intimate", "Relaxed"],
        loveLanguageMatch: ["Words of Affirmation", "Quality Time"],
        icon: Coffee
      },
      {
        name: "Sunset Picnic Adventure", 
        description: "Pack favorite foods and watch the sunset together",
        budget: "Medium",
        mood: ["Romantic", "Outdoor"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Heart
      },
      {
        name: "Local Art Gallery Stroll",
        description: "Explore creativity together and discuss what you see",
        budget: "Medium", 
        mood: ["Cultural", "Thoughtful"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Sparkles
      }
    ];

    // Filter based on personality and love language
    return baseIdeas.filter(idea => {
      if (userProfile.personalityType.includes("Introspective") && idea.mood.includes("Intimate")) return true;
      if (userProfile.personalityType.includes("Adventurous") && idea.mood.includes("Outdoor")) return true;
      if (idea.loveLanguageMatch.includes(userProfile.loveLanguage)) return true;
      return false;
    }).slice(0, 3);
  };

  const personalizedDates = getPersonalizedDates();

  const localExperiences = [
    { name: "Jazz Night at The Blue Note", type: "Music", distance: "0.8 miles" },
    { name: "Weekend Farmer's Market", type: "Food & Culture", distance: "1.2 miles" },
    { name: "Wine Tasting Class", type: "Learning", distance: "2.1 miles" }
  ];

  const planningBoard = [
    { task: "Choose restaurant", assigned: "Me", completed: false },
    { task: "Make reservation", assigned: "Partner", completed: true },
    { task: "Plan conversation topics", assigned: "Me", completed: false }
  ];

  const sections = [
    { id: 'prospects', label: 'Dating Prospects', icon: Users },
    { id: 'suggestions', label: 'Dating Planner', icon: Sparkles },
    { id: 'local', label: 'Local Events', icon: MapPin },
    { id: 'planning', label: 'Planning Board', icon: Heart }
  ];

  return (
    <div className="pb-20 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
          Date Concierge 🌟
        </h1>
        <p className="text-muted-foreground">Never lose the spark</p>
      </div>

      {/* Section Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-6">
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

      {/* Dating Prospects */}
      {activeSection === 'prospects' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Dating Prospects</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
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
                      <label className="text-sm font-medium mb-1 block">Prospect Name</label>
                      <Input
                        value={newProspectNickname}
                        onChange={(e) => setNewProspectNickname(e.target.value)}
                        placeholder="Enter name"
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

      {/* AI Date Suggestions */}
      {activeSection === 'suggestions' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Dating Planner</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Dating Planner"
                description="Get personalized date ideas perfectly tailored to your love language, personality, and relationship goals."
              />
            </div>
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Perfect for {userProfile.loveLanguage} lovers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These dates are personalized based on your love language and personality
              </p>
            </CardContent>
          </Card>

          {personalizedDates.map((date, index) => {
            const IconComponent = date.icon;
            return (
              <Card key={index} className="shadow-soft border-primary/10 hover:shadow-romance transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <IconComponent className="w-5 h-5 text-primary" />
                    <span className="text-lg">{date.name}</span>
                    <Badge variant="secondary">{date.budget}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{date.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {date.mood.map((mood) => (
                      <Badge key={mood} variant="outline" className="text-xs">
                        {mood}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="romance" size="sm" className="flex-1">
                      Plan This Date 💕
                    </Button>
                    <Button variant="soft" size="sm">
                      Save for Later
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Local Experiences */}
      {activeSection === 'local' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Local Events</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Local Events"
                description="Discover exciting activities and hidden gems in your area to create unforgettable experiences together."
              />
            </div>
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Local Experiences</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Discover exciting activities near you
              </p>
            </CardContent>
          </Card>

          {localExperiences.map((experience, index) => (
            <Card key={index} className="shadow-soft border-primary/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-foreground">{experience.name}</h3>
                    <p className="text-sm text-muted-foreground">{experience.type}</p>
                    <p className="text-xs text-accent flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {experience.distance}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground">
              Local experience matching requires location services & API integration
            </p>
          </div>
        </div>
      )}

      {/* Shared Planning Board */}
      {activeSection === 'planning' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Planning Board</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Planning Board"
                description="Collaborate with your partner to plan the perfect date night and keep track of who's doing what."
              />
            </div>
          </div>
          <Card className="shadow-romance border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary animate-heart-pulse" />
                <span>Shared Planning Board</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Collaborate with your partner to plan the perfect date
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="text-lg">Next Date Night</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planningBoard.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gradient-soft rounded-lg">
                  <input 
                    type="checkbox" 
                    checked={item.completed}
                    className="rounded border-primary"
                    readOnly
                  />
                  <div className="flex-1">
                    <p className={`text-sm ${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.task}
                    </p>
                    <p className="text-xs text-muted-foreground">Assigned to: {item.assigned}</p>
                  </div>
                </div>
              ))}
              <Button variant="romance" className="w-full mt-4">
                Add New Task ✨
              </Button>
            </CardContent>
          </Card>

          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground">
              Real-time collaboration requires backend integration
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateConciergeModule;