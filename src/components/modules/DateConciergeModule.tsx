import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Sparkles, Heart, Users, Coffee, Plus, ChevronDown, ChevronUp, Eye, EyeOff, ThumbsUp, ThumbsDown, HelpCircle, Trash2, Share } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import DatingPreferencesOnboarding, { DatingPreferences } from '@/components/DatingPreferencesOnboarding';

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
  
  // Dating Preferences state
  const [datingPreferences, setDatingPreferences] = useState<DatingPreferences | null>(null);
  const [showDatingOnboarding, setShowDatingOnboarding] = useState(false);
  const [favoriteDates, setFavoriteDates] = useState<any[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [visibleSuggestions, setVisibleSuggestions] = useState(3);
  
  // Dating Prospects state
  const [prospects, setProspects] = useState<DatingProspect[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProspectNickname, setNewProspectNickname] = useState('');
  const [newProspectRanking, setNewProspectRanking] = useState(1);
  const [showMoreMetrics, setShowMoreMetrics] = useState<{ [key: string]: boolean }>({});
  const [aiContext, setAiContext] = useState<{ [key: string]: string }>({});
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();

  // Load dating preferences and favorites from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('datingPreferences');
    if (savedPreferences) {
      setDatingPreferences(JSON.parse(savedPreferences));
    }
    
    const savedFavorites = localStorage.getItem('favoriteDates');
    if (savedFavorites) {
      setFavoriteDates(JSON.parse(savedFavorites));
    }
  }, []);

  // Check if user needs dating onboarding when switching to suggestions
  useEffect(() => {
    if (activeSection === 'suggestions' && !datingPreferences) {
      setShowDatingOnboarding(true);
    }
  }, [activeSection, datingPreferences]);
  
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

  // Dating Preferences handlers
  const handleDatingPreferencesComplete = (preferences: DatingPreferences) => {
    setDatingPreferences(preferences);
    localStorage.setItem('datingPreferences', JSON.stringify(preferences));
    setShowDatingOnboarding(false);
  };

  const handleSkipDatingOnboarding = () => {
    setShowDatingOnboarding(false);
  };

  // Favorites functionality
  const addToFavorites = (date: any) => {
    const newFavorites = [...favoriteDates, { ...date, id: Date.now() }];
    setFavoriteDates(newFavorites);
    localStorage.setItem('favoriteDates', JSON.stringify(newFavorites));
  };

  const removeFromFavorites = (dateId: number) => {
    const newFavorites = favoriteDates.filter(date => date.id !== dateId);
    setFavoriteDates(newFavorites);
    localStorage.setItem('favoriteDates', JSON.stringify(newFavorites));
  };

  const isDateFavorited = (dateName: string) => {
    return favoriteDates.some(favorite => favorite.name === dateName);
  };

  // Share functionality
  const shareDateIdea = async (date: any) => {
    const shareText = `${date.name} - ${date.description}\n\n-Let's try this soon, together. via Purposely App`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: date.name,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Date idea copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // AI-powered date suggestions based on user profile
  const getPersonalizedDates = () => {
    const allDateIdeas = [
      // Home & Relaxed Activities
      {
        name: "Netflix & Chill Night",
        description: "Create a cozy atmosphere at home with your favorite shows and snacks",
        budget: "Low",
        mood: ["Intimate", "Relaxed", "Home"],
        categories: ["netflix", "chill", "home", "movies", "tv", "cozy", "indoor"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Coffee
      },
      {
        name: "Movie Marathon Date",
        description: "Pick a movie series and binge-watch together with homemade popcorn",
        budget: "Low",
        mood: ["Relaxed", "Home", "Fun"],
        categories: ["movies", "home", "netflix", "indoor", "film", "cinema"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Heart
      },
      {
        name: "Gaming Night Together",
        description: "Play video games, board games, or card games for a fun competitive night",
        budget: "Low",
        mood: ["Fun", "Interactive", "Home"],
        categories: ["gaming", "games", "indoor", "home", "competitive", "video games"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Sparkles
      },
      
      // Nightlife & Party Activities
      {
        name: "Night Club Dancing",
        description: "Hit the dance floor at a popular club and dance the night away",
        budget: "High",
        mood: ["Energetic", "Social", "Party"],
        categories: ["nightclub", "night club", "dancing", "clubbing", "party", "drinks", "nightlife"],
        loveLanguageMatch: ["Physical Touch", "Quality Time"],
        icon: Heart
      },
      {
        name: "Rooftop Bar Night",
        description: "Enjoy cocktails and city views at a trendy rooftop bar",
        budget: "High",
        mood: ["Sophisticated", "Social", "Nightlife"],
        categories: ["bar", "drinks", "nightlife", "cocktails", "social", "rooftop"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Sparkles
      },
      {
        name: "Karaoke Night Out",
        description: "Sing your hearts out at a karaoke bar with drinks and laughter",
        budget: "Medium",
        mood: ["Fun", "Social", "Party"],
        categories: ["karaoke", "singing", "nightlife", "party", "fun", "social"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Coffee
      },
      
      // Active & Adventure
      {
        name: "Adventure Hike",
        description: "Explore a scenic trail and enjoy nature together",
        budget: "Low",
        mood: ["Outdoor", "Active", "Adventure"],
        categories: ["hiking", "outdoor", "nature", "adventure", "exercise", "walking"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Sparkles
      },
      {
        name: "Beach Day Escape",
        description: "Relax by the water with games, music, and good conversation",
        budget: "Low",
        mood: ["Relaxed", "Outdoor", "Fun"],
        categories: ["beach", "outdoor", "water", "swimming", "sun", "relaxing"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Heart
      },
      {
        name: "Mini Golf & Arcade",
        description: "Play mini golf and arcade games for a fun, competitive date",
        budget: "Medium",
        mood: ["Playful", "Fun", "Competitive"],
        categories: ["mini golf", "arcade", "games", "fun", "competitive", "indoor"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Coffee
      },
      
      // Food & Dining
      {
        name: "Fine Dining Experience",
        description: "Dress up for an elegant dinner at an upscale restaurant",
        budget: "High",
        mood: ["Sophisticated", "Romantic", "Elegant"],
        categories: ["dining", "restaurant", "food", "fancy", "elegant", "dinner"],
        loveLanguageMatch: ["Acts of Service", "Quality Time"],
        icon: Heart
      },
      {
        name: "Food Truck Adventure",
        description: "Try different cuisines from various food trucks around town",
        budget: "Medium",
        mood: ["Adventurous", "Casual", "Fun"],
        categories: ["food", "casual", "street food", "adventure", "variety"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Coffee
      },
      {
        name: "Cooking Class Together",
        description: "Learn to make a new cuisine side by side",
        budget: "Medium",
        mood: ["Interactive", "Fun", "Learning"],
        categories: ["cooking", "food", "learning", "hands-on", "class"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Sparkles
      },
      
      // Cultural & Arts
      {
        name: "Live Concert Experience",
        description: "See your favorite artist perform live or discover new music",
        budget: "High",
        mood: ["Energetic", "Musical", "Social"],
        categories: ["concert", "music", "live", "performance", "nightlife"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Heart
      },
      {
        name: "Art Gallery Stroll",
        description: "Explore creativity together and discuss what you see",
        budget: "Medium", 
        mood: ["Cultural", "Thoughtful", "Relaxed"],
        categories: ["art", "gallery", "culture", "museum", "creative"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Sparkles
      },
      {
        name: "Comedy Show Night",
        description: "Laugh together at a stand-up comedy show or improv night",
        budget: "Medium",
        mood: ["Fun", "Social", "Entertainment"],
        categories: ["comedy", "show", "entertainment", "laughs", "performance"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Coffee
      },
      
      // Romantic & Intimate
      {
        name: "Sunset Picnic Adventure", 
        description: "Pack favorite foods and watch the sunset together",
        budget: "Medium",
        mood: ["Romantic", "Outdoor", "Intimate"],
        categories: ["picnic", "outdoor", "romantic", "sunset", "nature"],
        loveLanguageMatch: ["Quality Time", "Acts of Service"],
        icon: Heart
      },
      {
        name: "Stargazing Night",
        description: "Find a quiet spot away from city lights to watch the stars",
        budget: "Low",
        mood: ["Romantic", "Peaceful", "Intimate"],
        categories: ["stargazing", "romantic", "outdoor", "peaceful", "night"],
        loveLanguageMatch: ["Quality Time", "Physical Touch"],
        icon: Heart
      },
      {
        name: "Wine Tasting Experience",
        description: "Sample different wines and learn about wine pairing",
        budget: "High",
        mood: ["Sophisticated", "Relaxed", "Romantic"],
        categories: ["wine", "tasting", "sophisticated", "drinks", "romantic"],
        loveLanguageMatch: ["Quality Time", "Words of Affirmation"],
        icon: Sparkles
      },
      
      // Coffee & Casual
      {
        name: "Cozy Coffee & Deep Conversation",
        description: "Find a quiet café with comfortable seating for meaningful talks",
        budget: "Low",
        mood: ["Intimate", "Relaxed", "Casual"],
        categories: ["coffee", "cafe", "conversation", "casual", "relaxed"],
        loveLanguageMatch: ["Words of Affirmation", "Quality Time"],
        icon: Coffee
      },
      {
        name: "Bookstore & Poetry Reading",
        description: "Browse books together and attend a literary event",
        budget: "Low",
        mood: ["Intellectual", "Intimate", "Cultural"],
        categories: ["books", "reading", "literature", "intellectual", "culture"],
        loveLanguageMatch: ["Words of Affirmation", "Quality Time"],
        icon: Sparkles
      }
    ];

    // Improved matching algorithm that prioritizes user preferences
    if (!datingPreferences) {
      return allDateIdeas.slice(0, visibleSuggestions);
    }

    const userLikes = [...datingPreferences.likedActivities, ...datingPreferences.customLikes];
    const userDislikes = [...datingPreferences.dislikedActivities, ...datingPreferences.customDislikes];
    
    // Score each date idea based on how well it matches user preferences
    const scoredIdeas = allDateIdeas.map(idea => {
      let score = 0;
      
      // High priority: Direct matches with user's liked activities
      userLikes.forEach(like => {
        const likeWords = like.toLowerCase().split(' ');
        likeWords.forEach(word => {
          // Check if any category contains the word
          if (idea.categories.some(cat => cat.includes(word) || word.includes(cat))) {
            score += 10; // High score for category matches
          }
          // Check name and description
          if (idea.name.toLowerCase().includes(word) || idea.description.toLowerCase().includes(word)) {
            score += 8;
          }
          // Check moods
          if (idea.mood.some(mood => mood.toLowerCase().includes(word) || word.includes(mood.toLowerCase()))) {
            score += 6;
          }
        });
      });
      
      // Penalty for conflicting with dislikes
      userDislikes.forEach(dislike => {
        const dislikeWords = dislike.toLowerCase().split(' ');
        dislikeWords.forEach(word => {
          if (idea.categories.some(cat => cat.includes(word) || word.includes(cat))) {
            score -= 15; // Heavy penalty for disliked activities
          }
          if (idea.name.toLowerCase().includes(word) || idea.description.toLowerCase().includes(word)) {
            score -= 10;
          }
        });
      });
      
      // Small bonus for love language match (but much less important than preferences)
      if (idea.loveLanguageMatch.includes(userProfile.loveLanguage)) {
        score += 2;
      }
      
      return { ...idea, score };
    });
    
    // Sort by score (highest first) and filter out negative scores
    const sortedIdeas = scoredIdeas
      .filter(idea => idea.score >= 0)
      .sort((a, b) => b.score - a.score);
    
    // If we don't have enough high-scoring matches, include some with score 0 but no conflicts
    let finalIdeas = sortedIdeas.filter(idea => idea.score > 0);
    if (finalIdeas.length < visibleSuggestions) {
      const neutralIdeas = sortedIdeas.filter(idea => idea.score === 0);
      finalIdeas = [...finalIdeas, ...neutralIdeas];
    }
    
    // Return the requested number of suggestions
    return finalIdeas.slice(0, visibleSuggestions);
  };

  // Reset preferences functionality
  const resetPreferences = () => {
    setDatingPreferences(null);
    setShowDatingOnboarding(true);
    setShowFavorites(false);
    setVisibleSuggestions(3);
    localStorage.removeItem('datingPreferences');
  };

  // Show more suggestions functionality
  const showMoreSuggestions = () => {
    setVisibleSuggestions(prev => prev + 3);
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
    { id: 'planning', label: 'Planning Board', icon: HeartIcon }
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

      {/* Dating Preferences Onboarding */}
      {showDatingOnboarding && (
        <DatingPreferencesOnboarding
          onComplete={handleDatingPreferencesComplete}
          onSkip={handleSkipDatingOnboarding}
        />
      )}

          {/* AI Date Suggestions */}
      {activeSection === 'suggestions' && !showDatingOnboarding && !showFavorites && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="text-center">
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <h2 className="text-xl font-semibold text-primary">Personalized Date Suggestions</h2>
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <InfoDialog
                    title="Personalized Date Suggestions"
                    description="Get personalized date ideas perfectly tailored to your preferences, love language, and personality."
                  />
                </div>
              </div>
              <Button 
                onClick={resetPreferences}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary text-sm"
              >
                Edit Preferences
              </Button>
              
              <div className="text-center">
                {/* Show user's liked preferences as bubbles */}
                {datingPreferences && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Your favorite activities:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {datingPreferences.likedActivities.map((activity) => (
                          <Badge key={activity} variant="default" className="text-xs">
                            {activity}
                          </Badge>
                        ))}
                        {datingPreferences.customLikes.map((activity) => (
                          <Badge key={activity} variant="default" className="text-xs">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Favorites Button - moved to be above date suggestions */}
          <div className="text-center">
            <Button 
              onClick={() => setShowFavorites(true)}
              variant="ghost"
              size="sm"
              className="text-primary hover:text-primary/80"
            >
              Favorites ({favoriteDates.length})
            </Button>
          </div>
          
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
                    <Button 
                      variant="romance" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => shareDateIdea(date)}
                    >
                      <Share className="w-4 h-4 mr-1" />
                      Send to A Friend
                    </Button>
                    <Button 
                      variant={isDateFavorited(date.name) ? "default" : "soft"}
                      size="sm"
                      onClick={() => {
                        if (isDateFavorited(date.name)) {
                          const favoriteDate = favoriteDates.find(fav => fav.name === date.name);
                          if (favoriteDate) removeFromFavorites(favoriteDate.id);
                        } else {
                          addToFavorites(date);
                        }
                      }}
                    >
                      <Heart className={`w-4 h-4 ${isDateFavorited(date.name) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* See More Button */}
          {(() => {
            const allFilteredDates = getPersonalizedDates();
            return visibleSuggestions < 15; // Show button until we've reached the max of our date ideas
          })() && (
            <div className="text-center">
              <Button 
                onClick={showMoreSuggestions}
                variant="outline"
                size="sm"
              >
                See More
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Favorites View */}
      {activeSection === 'suggestions' && showFavorites && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Favorites Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-primary">Favorites</h2>
              <Badge variant="secondary">{favoriteDates.length}</Badge>
            </div>
            <Button 
              onClick={() => setShowFavorites(false)}
              variant="ghost"
              size="sm"
            >
              Back to Suggestions
            </Button>
          </div>

          {favoriteDates.length === 0 ? (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 text-center">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No favorite dates yet!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Heart some date ideas to save them here for later.
                </p>
              </CardContent>
            </Card>
          ) : (
            favoriteDates.map((date) => {
              const IconComponent = date.icon;
              return (
                <Card key={date.id} className="shadow-soft border-primary/10 hover:shadow-romance transition-all duration-300">
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
                      {date.mood.map((mood: string) => (
                        <Badge key={mood} variant="outline" className="text-xs">
                          {mood}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="romance" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => shareDateIdea(date)}
                      >
                        <Share className="w-4 h-4 mr-1" />
                        Send to A Friend
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromFavorites(date.id)}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
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