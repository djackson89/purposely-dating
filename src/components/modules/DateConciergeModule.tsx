import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, Sparkles, Heart, Users, Coffee, Plus, ChevronDown, ChevronUp, Eye, EyeOff, ThumbsUp, ThumbsDown, HelpCircle, Trash2, Share, Clock, User, CalendarPlus, Edit, Save, X } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import DatingPreferencesOnboarding, { DatingPreferences } from '@/components/DatingPreferencesOnboarding';
import CustomChecklistEditor from '@/components/CustomChecklistEditor';
import { getSafeProfile } from '@/utils/safeProfile';

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

interface UpcomingDate {
  id: string;
  prospect_id: string | null;
  location: string;
  date_time: string;
  checklist: { [key: string]: boolean };
  notes?: string;
  prospectNickname?: string;
}

interface CustomChecklistItem {
  id: string;
  item_name: string;
  is_default: boolean;
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
  sneakPeekTracking?: any;
  onPaywallTrigger?: (trigger: 'view_limit' | 'ask_purposely' | 'next_question') => void;
}

const DateConciergeModule: React.FC<DateConciergeModuleProps> = ({ userProfile, sneakPeekTracking, onPaywallTrigger }) => {
  const { user } = useAuth();
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
  const [aiResponses, setAiResponses] = useState<{ [key: string]: string }>({});
  const [loadingAI, setLoadingAI] = useState<{ [key: string]: boolean }>({});
  const { getFlirtSuggestion, isLoading } = useRelationshipAI();

  // Upcoming Dates state
  const [upcomingDates, setUpcomingDates] = useState<UpcomingDate[]>([]);
  const [showAddDateForm, setShowAddDateForm] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState({
    prospect_id: '',
    location: '',
    date_time: '',
    notes: ''
  });

  // Custom Checklist state
  const [customChecklistItems, setCustomChecklistItems] = useState<CustomChecklistItem[]>([]);
  const [showChecklistEditor, setShowChecklistEditor] = useState(false);

  // Local Events state
  const [searchLocation, setSearchLocation] = useState('');
  const [visibleLocalEvents, setVisibleLocalEvents] = useState(6);

  // Load dating preferences, favorites, and data from localStorage/database on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('datingPreferences');
    if (savedPreferences) {
      setDatingPreferences(JSON.parse(savedPreferences));
    }
    
    const savedFavorites = localStorage.getItem('favoriteDates');
    if (savedFavorites) {
      setFavoriteDates(JSON.parse(savedFavorites));
    }

    // Load prospects and upcoming dates from database
    if (user) {
      loadProspects();
      loadUpcomingDates();
      loadCustomChecklistItems();
    }
  }, [user]);

  // Check if user needs dating onboarding when switching to suggestions
  // Allow suggestions to work with profile data even without dating preferences
  useEffect(() => {
    // Only show onboarding if explicitly requesting preferences setup
    // Suggestions can work with profile data (age, personality, love language)
    if (activeSection === 'suggestions' && !datingPreferences && localStorage.getItem('forceShowDatingOnboarding') === 'true') {
      setShowDatingOnboarding(true);
      localStorage.removeItem('forceShowDatingOnboarding');
    }
  }, [activeSection, datingPreferences]);

  // Check for navigation from side menu
  useEffect(() => {
    const activeSection = localStorage.getItem('activeSection');
    
    if (activeSection) {
      switch (activeSection) {
        case 'prospects':
          setActiveSection('prospects');
          break;
        case 'calendar':
          setActiveSection('planning');
          break;
      }
      
      // Clear the stored section after using it
      localStorage.removeItem('activeSection');
    }
  }, []);
  
  // Dating Prospects functions
  const addNewProspect = async () => {
    if (!newProspectNickname.trim() || !user) {
      toast.error('Please enter a prospect name');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('dating_prospects')
        .insert({
          user_id: user.id,
          nickname: newProspectNickname,
          overall_ranking: newProspectRanking,
          attractiveness_rating: 5,
          flags: {},
          notes: ''
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Prospect added successfully!');
      setNewProspectNickname('');
      setNewProspectRanking(prospects.length + 1);
      setShowAddForm(false);
      loadProspects(); // Reload prospects from database
    } catch (error) {
      console.error('Error adding prospect:', error);
      toast.error('Failed to add prospect');
    }
  };

  const updateProspectFlag = async (prospectId: string, metric: string, value: 'green' | 'red' | 'unsure') => {
    if (!user) return;
    
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;
    
    const updatedFlags = { ...prospect.flags, [metric]: value };
    
    try {
      const { error } = await supabase
        .from('dating_prospects')
        .update({ flags: updatedFlags })
        .eq('id', prospectId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setProspects(prospects.map(p => 
        p.id === prospectId 
          ? { ...p, flags: updatedFlags }
          : p
      ));
    } catch (error) {
      console.error('Error updating prospect flag:', error);
      toast.error('Failed to update flag');
    }
  };

  const updateProspectAttractiveness = async (prospectId: string, value: number[]) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('dating_prospects')
        .update({ attractiveness_rating: value[0] })
        .eq('id', prospectId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setProspects(prospects.map(prospect => 
        prospect.id === prospectId 
          ? { ...prospect, attractiveness: value }
          : prospect
      ));
    } catch (error) {
      console.error('Error updating attractiveness:', error);
      toast.error('Failed to update attractiveness');
    }
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
    
    setLoadingAI({ ...loadingAI, [prospectId]: true });
    
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
      setAiResponses({ ...aiResponses, [prospectId]: response });
    } catch (error) {
      console.error('Error getting AI advice:', error);
      toast.error('Sorry, there was an error getting advice. Please try again.');
    } finally {
      setLoadingAI({ ...loadingAI, [prospectId]: false });
    }
  };

  const deleteProspect = async (prospectId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('dating_prospects')
        .delete()
        .eq('id', prospectId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Prospect deleted successfully');
      loadProspects(); // Reload prospects from database
    } catch (error) {
      console.error('Error deleting prospect:', error);
      toast.error('Failed to delete prospect');
    }
  };

  // Load prospects from database
  const loadProspects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('dating_prospects')
        .select('*')
        .eq('user_id', user.id)
        .order('overall_ranking');
      
      if (error) throw error;
      
      const formattedProspects = data.map(prospect => ({
        id: prospect.id,
        nickname: prospect.nickname,
        ranking: prospect.overall_ranking,
        attractiveness: [prospect.attractiveness_rating || 5],
        flags: (prospect.flags || {}) as { [key: string]: 'green' | 'red' | 'unsure' },
        isExpanded: false
      }));
      
      setProspects(formattedProspects);
    } catch (error) {
      console.error('Error loading prospects:', error);
    }
  };

  // Load upcoming dates from database
  const loadUpcomingDates = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('upcoming_dates')
        .select(`
          *,
          dating_prospects (
            nickname
          )
        `)
        .eq('user_id', user.id)
        .order('date_time');
      
      if (error) throw error;
      
      const formattedDates = data.map(date => ({
        id: date.id,
        prospect_id: date.prospect_id,
        location: date.location,
        date_time: date.date_time,
        checklist: date.checklist as UpcomingDate['checklist'],
        notes: date.notes,
        prospectNickname: date.dating_prospects?.nickname || 'Unknown'
      }));
      
      setUpcomingDates(formattedDates);
    } catch (error) {
      console.error('Error loading upcoming dates:', error);
    }
  };

  // Load custom checklist items from database
  const loadCustomChecklistItems = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('item_name');

      if (error) throw error;

      if (!data || data.length === 0) {
        // Initialize default items if none exist
        await initializeDefaultChecklistItems();
      } else {
        setCustomChecklistItems(data);
      }
    } catch (error) {
      console.error('Error loading custom checklist items:', error);
    }
  };

  // Initialize default checklist items for new users
  const initializeDefaultChecklistItems = async () => {
    if (!user) return;

    const defaultItems = [
      'babySitter',
      'outfit', 
      'hairStyling',
      'backgroundCheck',
      'emergencyCash',
      'weatherCheck'
    ];

    try {
      const { data, error } = await supabase
        .from('custom_checklist_items')
        .insert(
          defaultItems.map(item => ({
            user_id: user.id,
            item_name: item,
            is_default: true
          }))
        )
        .select();

      if (error) throw error;

      setCustomChecklistItems(data || []);
    } catch (error) {
      console.error('Error initializing default checklist items:', error);
    }
  };

  // Create default checklist for new dates
  const createDefaultChecklist = () => {
    const defaultChecklist: { [key: string]: boolean } = {};
    customChecklistItems.forEach(item => {
      defaultChecklist[item.item_name] = false;
    });
    return defaultChecklist;
  };

  // Format checklist item name for display
  const formatChecklistItemName = (itemName: string) => {
    const defaultLabels: { [key: string]: string } = {
      babySitter: 'Baby Sitter',
      outfit: 'Outfit',
      hairStyling: 'Hair Styling',
      backgroundCheck: 'Background Check',
      emergencyCash: 'Emergency Cash',
      weatherCheck: 'Weather Check'
    };
    
    return defaultLabels[itemName] || itemName.charAt(0).toUpperCase() + itemName.slice(1);
  };

  // Sync new checklist items to existing dates
  const syncChecklistItemsToExistingDates = async () => {
    if (!user || upcomingDates.length === 0) return;

    try {
      // Reload the latest custom checklist items
      const { data: latestItems, error: itemsError } = await supabase
        .from('custom_checklist_items')
        .select('*')
        .eq('user_id', user.id);

      if (itemsError) throw itemsError;

      // Update each date's checklist to include new items
      for (const date of upcomingDates) {
        const updatedChecklist = { ...date.checklist };
        
        // Add any new items that don't exist in this date's checklist
        latestItems?.forEach(item => {
          if (!(item.item_name in updatedChecklist)) {
            updatedChecklist[item.item_name] = false;
          }
        });

        // Remove items that no longer exist in custom checklist
        const validItemNames = latestItems?.map(item => item.item_name) || [];
        Object.keys(updatedChecklist).forEach(key => {
          if (!validItemNames.includes(key)) {
            delete updatedChecklist[key];
          }
        });

        // Update the date in the database if checklist changed
        if (JSON.stringify(updatedChecklist) !== JSON.stringify(date.checklist)) {
          const { error: updateError } = await supabase
            .from('upcoming_dates')
            .update({ checklist: updatedChecklist })
            .eq('id', date.id)
            .eq('user_id', user.id);

          if (updateError) throw updateError;
        }
      }

      // Reload dates to reflect changes
      loadUpcomingDates();
    } catch (error) {
      console.error('Error syncing checklist items:', error);
      toast.error('Failed to sync checklist items');
    }
  };

  // Add new upcoming date
  const addUpcomingDate = async () => {
    if (!user || !newDate.location || !newDate.date_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('upcoming_dates')
        .insert({
          user_id: user.id,
          prospect_id: newDate.prospect_id || null,
          location: newDate.location,
          date_time: newDate.date_time,
          notes: newDate.notes,
          checklist: createDefaultChecklist()
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success('Date added successfully!');
      setNewDate({ prospect_id: '', location: '', date_time: '', notes: '' });
      setShowAddDateForm(false);
      loadUpcomingDates();
    } catch (error) {
      console.error('Error adding date:', error);
      toast.error('Failed to add date');
    }
  };

  // Update checklist item
  const updateChecklistItem = async (dateId: string, item: string, checked: boolean) => {
    if (!user) return;
    
    const dateToUpdate = upcomingDates.find(d => d.id === dateId);
    if (!dateToUpdate) return;
    
    const updatedChecklist = {
      ...dateToUpdate.checklist,
      [item]: checked
    };
    
    try {
      const { error } = await supabase
        .from('upcoming_dates')
        .update({ checklist: updatedChecklist })
        .eq('id', dateId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setUpcomingDates(upcomingDates.map(date =>
        date.id === dateId
          ? { ...date, checklist: updatedChecklist }
          : date
      ));
    } catch (error) {
      console.error('Error updating checklist:', error);
      toast.error('Failed to update checklist');
    }
  };

  // Delete upcoming date
  const deleteUpcomingDate = async (dateId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('upcoming_dates')
        .delete()
        .eq('id', dateId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Date deleted successfully');
      loadUpcomingDates();
    } catch (error) {
      console.error('Error deleting date:', error);
      toast.error('Failed to delete date');
    }
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

    // Enhanced matching algorithm that works with or without dating preferences
    // If no dating preferences, use profile data (age, personality type, love language)
    if (!datingPreferences) {
      // Score date ideas based on profile data when no dating preferences exist
      const scoredIdeas = allDateIdeas.map(idea => {
        let score = 0;
        
        // Love language matching gets high priority
        if (idea.loveLanguageMatch.includes(userProfile.loveLanguage)) {
          score += 8;
        }
        
        // Age-appropriate suggestions (rough matching)
        const ageNum = parseInt(userProfile?.age || '25') || 25;
        if (ageNum < 25) {
          // Younger crowd - prefer social, fun, energetic activities
          if (idea.mood.some(mood => ['Energetic', 'Social', 'Fun', 'Interactive'].includes(mood))) {
            score += 5;
          }
          if (idea.categories.some(cat => ['concert', 'arcade', 'karaoke', 'dancing', 'party'].includes(cat))) {
            score += 4;
          }
        } else if (ageNum > 35) {
          // More mature - prefer sophisticated, cultural, relaxed activities
          if (idea.mood.some(mood => ['Sophisticated', 'Cultural', 'Romantic', 'Intimate'].includes(mood))) {
            score += 5;
          }
          if (idea.categories.some(cat => ['wine', 'art', 'culture', 'spa', 'cooking'].includes(cat))) {
            score += 4;
          }
        } else {
          // Mid-range - balanced preferences
          score += 2; // Small bonus for being in the middle range
        }
        
        // Personality type matching
        if (userProfile.personalityType) {
          const personality = userProfile.personalityType.toLowerCase();
          // Extrovert types prefer social activities
          if (personality.includes('e') && idea.mood.some(mood => ['Social', 'Energetic', 'Interactive'].includes(mood))) {
            score += 3;
          }
          // Introvert types prefer intimate, quiet activities
          if (personality.includes('i') && idea.mood.some(mood => ['Intimate', 'Peaceful', 'Relaxed'].includes(mood))) {
            score += 3;
          }
          // Thinking types might enjoy intellectual activities
          if (personality.includes('t') && idea.mood.some(mood => ['Intellectual', 'Learning'].includes(mood))) {
            score += 2;
          }
          // Feeling types might enjoy emotional/romantic activities
          if (personality.includes('f') && idea.mood.some(mood => ['Romantic', 'Intimate'].includes(mood))) {
            score += 2;
          }
        }
        
        return { ...idea, score };
      });
      
      // Sort by score and return top suggestions
      const sortedIdeas = scoredIdeas.sort((a, b) => b.score - a.score);
      return sortedIdeas.slice(0, visibleSuggestions);
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
    localStorage.setItem('forceShowDatingOnboarding', 'true');
    setShowDatingOnboarding(true);
    setShowFavorites(false);
    setVisibleSuggestions(3);
    localStorage.removeItem('datingPreferences');
  };

  // Show more suggestions functionality
  const showMoreSuggestions = () => {
    setVisibleSuggestions(prev => prev + 3);
  };

  // AI-powered local events based on user preferences
  const getPersonalizedLocalEvents = (count: number = 6) => {
    const locationPrefix = searchLocation.trim() 
      ? `${searchLocation} - ` 
      : (searchLocation === '' ? 'Local - ' : 'America - ');
    
    const allLocalEvents = [
      // Nightlife & Party Events
      {
        name: `${locationPrefix}Club Remix - EDM Night`,
        type: "Nightlife",
        distance: searchLocation ? "Various locations" : "0.7 miles",
        categories: ["nightclub", "night club", "dancing", "clubbing", "party", "drinks", "nightlife", "edm", "music"],
        mood: ["Energetic", "Social", "Party"]
      },
      {
        name: `${locationPrefix}Rooftop Cocktail Lounge`,
        type: "Nightlife",
        distance: searchLocation ? "Various locations" : "1.2 miles",
        categories: ["bar", "cocktails", "rooftop", "drinks", "nightlife", "upscale", "romantic"],
        mood: ["Romantic", "Upscale", "Social"]
      },
      {
        name: `${locationPrefix}Jazz & Wine Night`,
        type: "Nightlife",
        distance: searchLocation ? "Various locations" : "0.5 miles",
        categories: ["jazz", "wine", "music", "intimate", "nightlife", "sophisticated"],
        mood: ["Intimate", "Sophisticated", "Musical"]
      },
      
      // Cultural & Arts Events
      {
        name: `${locationPrefix}Art Gallery Opening`,
        type: "Cultural",
        distance: searchLocation ? "Various locations" : "1.8 miles",
        categories: ["art", "gallery", "culture", "sophisticated", "creative", "artistic"],
        mood: ["Creative", "Sophisticated", "Cultural"]
      },
      {
        name: `${locationPrefix}Local Theater Performance`,
        type: "Cultural",
        distance: searchLocation ? "Various locations" : "2.1 miles",
        categories: ["theater", "drama", "performance", "culture", "artistic", "entertainment"],
        mood: ["Cultural", "Artistic", "Entertainment"]
      },
      {
        name: `${locationPrefix}Poetry Reading & Coffee`,
        type: "Cultural",
        distance: searchLocation ? "Various locations" : "0.9 miles",
        categories: ["poetry", "literary", "coffee", "intimate", "intellectual", "creative"],
        mood: ["Intimate", "Intellectual", "Creative"]
      },
      
      // Outdoor & Adventure Events
      {
        name: `${locationPrefix}Sunset Hiking Trail`,
        type: "Outdoor",
        distance: searchLocation ? "Various locations" : "3.2 miles",
        categories: ["hiking", "outdoor", "nature", "sunset", "adventure", "active"],
        mood: ["Active", "Natural", "Romantic"]
      },
      {
        name: `${locationPrefix}Farmers Market Tour`,
        type: "Outdoor",
        distance: searchLocation ? "Various locations" : "1.4 miles",
        categories: ["farmers market", "food", "local", "outdoor", "fresh", "community"],
        mood: ["Community", "Fresh", "Local"]
      },
      {
        name: `${locationPrefix}Kayaking Adventure`,
        type: "Outdoor",
        distance: searchLocation ? "Various locations" : "4.7 miles",
        categories: ["kayaking", "water", "adventure", "outdoor", "active", "nature"],
        mood: ["Active", "Adventure", "Nature"]
      },
      
      // Food & Dining Events
      {
        name: `${locationPrefix}Wine Tasting Experience`,
        type: "Food & Drink",
        distance: searchLocation ? "Various locations" : "1.6 miles",
        categories: ["wine", "tasting", "sophisticated", "romantic", "upscale", "culinary"],
        mood: ["Sophisticated", "Romantic", "Culinary"]
      },
      {
        name: `${locationPrefix}Cooking Class for Couples`,
        type: "Food & Drink",
        distance: searchLocation ? "Various locations" : "2.3 miles",
        categories: ["cooking", "class", "food", "interactive", "fun", "skill-building"],
        mood: ["Interactive", "Fun", "Skill-building"]
      },
      {
        name: `${locationPrefix}Food Truck Festival`,
        type: "Food & Drink",
        distance: searchLocation ? "Various locations" : "1.9 miles",
        categories: ["food truck", "festival", "casual", "variety", "outdoor", "social"],
        mood: ["Casual", "Social", "Variety"]
      },
      
      // Entertainment & Gaming
      {
        name: `${locationPrefix}Arcade & Retro Gaming`,
        type: "Entertainment",
        distance: searchLocation ? "Various locations" : "1.1 miles",
        categories: ["arcade", "gaming", "fun", "nostalgic", "interactive", "playful"],
        mood: ["Playful", "Nostalgic", "Fun"]
      },
      {
        name: `${locationPrefix}Trivia Night Competition`,
        type: "Entertainment",
        distance: searchLocation ? "Various locations" : "0.8 miles",
        categories: ["trivia", "competition", "intellectual", "social", "fun", "bar"],
        mood: ["Intellectual", "Social", "Competitive"]
      },
      {
        name: `${locationPrefix}Comedy Show Night`,
        type: "Entertainment",
        distance: searchLocation ? "Various locations" : "1.7 miles",
        categories: ["comedy", "laughs", "entertainment", "fun", "social", "humor"],
        mood: ["Funny", "Entertainment", "Social"]
      },
      
      // Fitness & Wellness
      {
        name: `${locationPrefix}Couples Yoga Session`,
        type: "Wellness",
        distance: searchLocation ? "Various locations" : "1.3 miles",
        categories: ["yoga", "wellness", "couples", "relaxing", "mindful", "health"],
        mood: ["Relaxing", "Mindful", "Healthy"]
      },
      {
        name: `${locationPrefix}Dance Class Workshop`,
        type: "Wellness",
        distance: searchLocation ? "Various locations" : "2.0 miles",
        categories: ["dance", "class", "active", "fun", "social", "skill-building"],
        mood: ["Active", "Fun", "Social"]
      },
      {
        name: `${locationPrefix}Spa & Wellness Day`,
        type: "Wellness",
        distance: searchLocation ? "Various locations" : "2.8 miles",
        categories: ["spa", "wellness", "relaxing", "pampering", "romantic", "luxury"],
        mood: ["Relaxing", "Luxury", "Romantic"]
      },
      
      // Unique & Seasonal Events
      {
        name: `${locationPrefix}Night Market Adventure`,
        type: "Unique",
        distance: searchLocation ? "Various locations" : "1.5 miles",
        categories: ["night market", "food", "shopping", "cultural", "unique", "social"],
        mood: ["Cultural", "Unique", "Social"]
      },
      {
        name: `${locationPrefix}Rooftop Stargazing`,
        type: "Unique",
        distance: searchLocation ? "Various locations" : "2.4 miles",
        categories: ["stargazing", "romantic", "peaceful", "unique", "night", "astronomy"],
        mood: ["Romantic", "Peaceful", "Unique"]
      },
      {
        name: `${locationPrefix}Vintage Market Browsing`,
        type: "Unique",
        distance: searchLocation ? "Various locations" : "1.8 miles",
        categories: ["vintage", "shopping", "unique", "retro", "browsing", "creative"],
        mood: ["Unique", "Creative", "Browsing"]
      },
      
      // Music & Live Events
      {
        name: `${locationPrefix}Live Music at Local Venue`,
        type: "Music",
        distance: searchLocation ? "Various locations" : "1.0 miles",
        categories: ["live music", "concert", "local", "entertainment", "social", "acoustic"],
        mood: ["Musical", "Entertainment", "Local"]
      },
      {
        name: `${locationPrefix}Karaoke Night Challenge`,
        type: "Music",
        distance: searchLocation ? "Various locations" : "0.6 miles",
        categories: ["karaoke", "singing", "fun", "social", "entertainment", "interactive"],
        mood: ["Fun", "Social", "Interactive"]
      },
      {
        name: `${locationPrefix}Open Mic Coffee House`,
        type: "Music",
        distance: searchLocation ? "Various locations" : "1.2 miles",
        categories: ["open mic", "coffee", "intimate", "creative", "local", "acoustic"],
        mood: ["Intimate", "Creative", "Local"]
      },
      
      // Sports & Recreation
      {
        name: `${locationPrefix}Mini Golf Tournament`,
        type: "Recreation",
        distance: searchLocation ? "Various locations" : "2.5 miles",
        categories: ["mini golf", "fun", "competitive", "casual", "games", "interactive"],
        mood: ["Fun", "Competitive", "Casual"]
      },
      {
        name: `${locationPrefix}Bowling League Night`,
        type: "Recreation",
        distance: searchLocation ? "Various locations" : "1.9 miles",
        categories: ["bowling", "sports", "casual", "social", "competitive", "fun"],
        mood: ["Casual", "Social", "Competitive"]
      },
      {
        name: `${locationPrefix}Rock Climbing Experience`,
        type: "Recreation",
        distance: searchLocation ? "Various locations" : "3.8 miles",
        categories: ["rock climbing", "adventure", "active", "challenging", "outdoor", "fitness"],
        mood: ["Active", "Adventure", "Challenging"]
      },
      
      // Educational & Learning
      {
        name: `${locationPrefix}Museum Exhibition Tour`,
        type: "Educational",
        distance: searchLocation ? "Various locations" : "2.2 miles",
        categories: ["museum", "educational", "cultural", "learning", "sophisticated", "art"],
        mood: ["Educational", "Cultural", "Sophisticated"]
      },
      {
        name: `${locationPrefix}Language Exchange Meetup`,
        type: "Educational",
        distance: searchLocation ? "Various locations" : "1.4 miles",
        categories: ["language", "learning", "cultural", "social", "educational", "international"],
        mood: ["Educational", "Cultural", "Social"]
      },
      {
        name: `${locationPrefix}History Walking Tour`,
        type: "Educational",
        distance: searchLocation ? "Various locations" : "1.7 miles",
        categories: ["history", "walking", "educational", "local", "cultural", "guided"],
        mood: ["Educational", "Cultural", "Local"]
      }
    ];

    // Enhanced local events matching - works with or without dating preferences
    // Shows nationwide events by default when no preferences are set
    if (!datingPreferences) {
      // Score events based on profile data when no dating preferences exist
      const scoredEvents = allLocalEvents.map(event => {
        let score = 0;
        
        // Age-appropriate event matching
        const ageNum = parseInt(userProfile?.age || '25') || 25;
        if (ageNum < 25) {
          // Younger crowd - prefer nightlife, social, energetic
          if (event.mood.some(mood => ['Energetic', 'Social', 'Party', 'Fun'].includes(mood))) {
            score += 5;
          }
          if (event.categories.some(cat => ['nightclub', 'bar', 'music', 'arcade', 'karaoke'].includes(cat))) {
            score += 4;
          }
        } else if (ageNum > 35) {
          // More mature - prefer cultural, sophisticated, wellness
          if (event.mood.some(mood => ['Sophisticated', 'Cultural', 'Relaxing', 'Romantic'].includes(mood))) {
            score += 5;
          }
          if (event.categories.some(cat => ['wine', 'art', 'spa', 'culture', 'fine dining'].includes(cat))) {
            score += 4;
          }
        } else {
          // Mid-range - balanced mix
          score += 2;
        }
        
        // Personality type matching
        if (userProfile.personalityType) {
          const personality = userProfile.personalityType.toLowerCase();
          if (personality.includes('e') && event.mood.some(mood => ['Social', 'Energetic', 'Party'].includes(mood))) {
            score += 3;
          }
          if (personality.includes('i') && event.mood.some(mood => ['Intimate', 'Peaceful', 'Cultural'].includes(mood))) {
            score += 3;
          }
        }
        
        return { ...event, score };
      });
      
      // Sort by score and return top events
      const sortedEvents = scoredEvents.sort((a, b) => b.score - a.score);
      return sortedEvents.slice(0, count);
    }

    const scoredEvents = allLocalEvents.map(event => {
      let score = 0;
      
      // Check against liked activities
      if (datingPreferences.likedActivities) {
        datingPreferences.likedActivities.forEach(activity => {
          if (event.categories.some(cat => cat.toLowerCase().includes(activity.toLowerCase()))) {
            score += 3;
          }
        });
      }
      
      // Check against custom likes
      if (datingPreferences.customLikes) {
        datingPreferences.customLikes.forEach(activity => {
          if (event.categories.some(cat => cat.toLowerCase().includes(activity.toLowerCase()))) {
            score += 3;
          }
        });
      }
      
      // Check against disliked activities (negative score)
      if (datingPreferences.dislikedActivities) {
        datingPreferences.dislikedActivities.forEach(activity => {
          if (event.categories.some(cat => cat.toLowerCase().includes(activity.toLowerCase()))) {
            score -= 2;
          }
        });
      }
      
      // Check against custom dislikes (negative score)
      if (datingPreferences.customDislikes) {
        datingPreferences.customDislikes.forEach(activity => {
          if (event.categories.some(cat => cat.toLowerCase().includes(activity.toLowerCase()))) {
            score -= 2;
          }
        });
      }
      
      return { ...event, score };
    });

    // Sort by score and filter out negative scores
    const sortedEvents = scoredEvents
      .filter(event => event.score >= 0)
      .sort((a, b) => b.score - a.score);
    
    // Return requested number of events
    return sortedEvents.slice(0, count);
  };

  const localExperiences = getPersonalizedLocalEvents(visibleLocalEvents);
  const personalizedDates = getPersonalizedDates();

  // Show more local events functionality
  const showMoreLocalEvents = () => {
    setVisibleLocalEvents(prev => prev + 6);
  };

  const sections = [
    { id: 'prospects', label: 'Dating Prospects', icon: Users },
    { id: 'suggestions', label: 'Dating Planner', icon: Sparkles },
    { id: 'local', label: 'Local Experiences', icon: MapPin },
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
                          disabled={loadingAI[prospect.id]}
                          variant="romance"
                          className="w-full"
                        >
                          {loadingAI[prospect.id] ? 'Getting advice...' : 'Ask Purposely'}
                        </Button>
                        {aiResponses[prospect.id] && (
                          <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-xs font-medium text-primary mb-2">Purposely's Insight:</p>
                            <p className="text-sm text-muted-foreground">
                              {aiResponses[prospect.id]}
                            </p>
                          </div>
                        )}
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
                {datingPreferences ? 'Edit Preferences' : 'Set Date Preferences'}
              </Button>
              
              <div className="text-center">
                {/* Show user's preferences or profile-based matching info */}
                {datingPreferences ? (
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
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Suggestions based on your profile:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {userProfile.loveLanguage && (
                        <Badge variant="outline" className="text-xs">
                          Love Language: {userProfile.loveLanguage}
                        </Badge>
                      )}
                      {userProfile.age && (
                        <Badge variant="outline" className="text-xs">
                          Age: {userProfile.age}
                        </Badge>
                      )}
                      {userProfile.personalityType && (
                        <Badge variant="outline" className="text-xs">
                          {userProfile.personalityType}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Want more personalized suggestions? Set your date preferences above!
                    </p>
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
            <h2 className="text-xl font-semibold text-primary">Local Experiences</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Local Experiences"
                description="Discover exciting activities and hidden gems in your area to create unforgettable experiences together. Search by city or zip code to explore events anywhere."
              />
            </div>
          </div>

          {/* Location Search Input */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label htmlFor="location-search" className="text-sm font-medium">
                  Search Location (City or Zip Code)
                </Label>
                <Input
                  id="location-search"
                  value={searchLocation}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    setVisibleLocalEvents(6); // Reset visible events when location changes
                  }}
                  placeholder="Enter city name or zip code (e.g., New York, NY or 10001)"
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  {searchLocation.trim() 
                    ? `Showing events for: ${searchLocation}` 
                    : "Showing local events (or nationwide if location access not granted)"
                  }
                </p>
              </div>
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
                    {experience.mood && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {experience.mood.slice(0, 2).map((mood, moodIndex) => (
                          <Badge key={moodIndex} variant="outline" className="text-xs">
                            {mood}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* See More Button */}
          {visibleLocalEvents < 30 && ( // Limit to reasonable number
            <div className="text-center">
              <Button 
                onClick={showMoreLocalEvents}
                variant="outline"
                size="sm"
                className="w-full"
              >
                See More Events
              </Button>
            </div>
          )}

          <div className="text-center p-4">
            <p className="text-xs text-muted-foreground">
              {searchLocation.trim() 
                ? "Events shown are representative examples for the selected location" 
                : "Local experience matching requires location services & API integration"
              }
            </p>
          </div>
        </div>
      )}

      {/* Upcoming Dates Planning */}
      {activeSection === 'planning' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section Heading */}
          <div className="flex items-center justify-center space-x-2">
            <h2 className="text-xl font-semibold text-primary">Upcoming Dates</h2>
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
              <InfoDialog
                title="Upcoming Dates"
                description="Plan and track your upcoming dates. Choose who you're going with, set the location and time, and use the checklist to make sure you're prepared."
              />
            </div>
          </div>
          
          {/* Add New Date Button */}
          <Card className="shadow-soft border-primary/10">
            <CardContent className="pt-6">
              <Button 
                onClick={() => setShowAddDateForm(!showAddDateForm)}
                variant="romance" 
                className="w-full"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Add New Date
              </Button>
              
              {/* Add Date Form */}
              {showAddDateForm && (
                <div className="mt-4 space-y-4 p-4 bg-muted/50 rounded-lg">
                  {/* Who is it with */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Who is it with?</Label>
                    <Select value={newDate.prospect_id} onValueChange={(value) => setNewDate({...newDate, prospect_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={prospects.length === 0 ? "Add dating prospects first" : "Select a dating prospect"} />
                      </SelectTrigger>
                      <SelectContent>
                        {prospects.length === 0 ? (
                          <SelectItem value="" disabled>No dating prospects available</SelectItem>
                        ) : (
                          prospects.map((prospect) => (
                            <SelectItem key={prospect.id} value={prospect.id}>
                              {prospect.nickname}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Where */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Where</Label>
                    <Input
                      value={newDate.location}
                      onChange={(e) => setNewDate({...newDate, location: e.target.value})}
                      placeholder="Enter location"
                    />
                  </div>
                  
                  {/* What Time */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">What Time</Label>
                    <Input
                      type="datetime-local"
                      value={newDate.date_time}
                      onChange={(e) => setNewDate({...newDate, date_time: e.target.value})}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Notes (Optional)</Label>
                    <Textarea
                      value={newDate.notes}
                      onChange={(e) => setNewDate({...newDate, notes: e.target.value})}
                      placeholder="Any additional notes..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={addUpcomingDate} size="sm">
                      <Save className="w-4 h-4 mr-1" />
                      Add Date
                    </Button>
                    <Button onClick={() => setShowAddDateForm(false)} variant="outline" size="sm">
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Dates List */}
          {upcomingDates.length === 0 ? (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="pt-6 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No upcoming dates yet!</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add your first date to start planning.
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingDates.map((date) => (
              <Card key={date.id} className="shadow-soft border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-primary" />
                      <span className="text-lg">
                        Date with {date.prospectNickname}
                      </span>
                    </div>
                    <Button
                      onClick={() => deleteUpcomingDate(date.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{date.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(date.date_time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  {date.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">{date.notes}</p>
                    </div>
                  )}
                  
                  {/* Checklist */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">Preparation Checklist</h4>
                      <Button
                        onClick={() => setShowChecklistEditor(true)}
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80 text-xs p-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit Checklist
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(date.checklist).map(([key, checked]) => {
                        // Find the custom item for proper display name
                        const customItem = customChecklistItems.find(item => item.item_name === key);
                        const displayName = customItem ? formatChecklistItemName(customItem.item_name) : key;
                        
                        return (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${date.id}-${key}`}
                              checked={checked}
                              onCheckedChange={(checkedState) => 
                                updateChecklistItem(date.id, key, !!checkedState)
                              }
                            />
                            <Label 
                              htmlFor={`${date.id}-${key}`}
                              className="text-sm cursor-pointer"
                            >
                              {displayName}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Custom Checklist Editor */}
      <CustomChecklistEditor
        isOpen={showChecklistEditor}
        onClose={() => setShowChecklistEditor(false)}
        onUpdate={() => {
          loadCustomChecklistItems();
          syncChecklistItemsToExistingDates();
        }}
      />
    </div>
  );
};

export default DateConciergeModule;