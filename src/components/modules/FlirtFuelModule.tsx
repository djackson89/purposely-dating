import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ConversationStartersSection from '../ConversationStartersSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Zap, Share, Send, Wand2, Trash2, Users, X, ChevronLeft, ChevronRight, Expand, Target, Star, TrendingUp, Clock, BarChart3, Play, Pause, RotateCcw, Mic, MicOff } from 'lucide-react';
import { HeartIcon } from '@/components/ui/heart-icon';
import { InfoDialog } from '@/components/ui/info-dialog';
import { Share as CapacitorShare } from '@capacitor/share';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import TextGenie from '@/components/TextGenie';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

// Static conversation starters data
const conversationStartersData = [
  {
    category: "First Date Deep Dive",
    masterCategory: "Date Night",
    prompts: [
      "What belief you held strongly in your twenties has completely shifted as you've grown?",
      "What's something you're working on healing within yourself right now?",
      "How do you know when someone truly sees and appreciates the real you?",
      "What pattern do you notice in the type of people you're drawn to?",
      "What does emotional maturity look like to you in a relationship?",
      "What's a conversation topic that instantly reveals someone's character to you?"
    ]
  },
  {
    category: "Relationship Clarity",
    masterCategory: "Date Night", 
    prompts: [
      "Since your love language is {loveLanguage}, how do you communicate when you're not feeling loved in that way?",
      "What's the difference between how you show love when you feel secure versus when you feel anxious?",
      "How do you handle it when your partner processes emotions differently than you do?",
      "What helps you feel emotionally safe enough to be completely vulnerable?",
      "How do you distinguish between a partner having a bad day and a pattern of treating you poorly?",
      "What does it look like when someone truly prioritizes you versus just fitting you into their schedule?"
    ]
  },
  {
    category: "Boundaries & Values",
    masterCategory: "Date Night",
    prompts: [
      "How do you feel about maintaining friendships with people of the opposite sex while in a relationship?",
      "What are your thoughts on partner transparency with social media interactions and online activities?",
      "How comfortable are you with the idea of girls' trips or guys' outings without your partner?",
      "What boundaries should couples have regarding communication with ex-partners?",
      "How do you define emotional cheating, and where do you draw those lines?",
      "What are your views on sharing passwords or access to personal devices in a relationship?"
    ]
  },
  {
    category: "Trust & Transparency",
    masterCategory: "Date Night",
    prompts: [
      "True or False: Complete transparency about daily interactions should be standard in healthy relationships.",
      "True or False: A partner's reluctance to share phone passwords indicates they have something to hide.",
      "True or False: Emotional cheating is more damaging to a relationship than physical infidelity.",
      "True or False: Someone who maintains close friendships with exes lacks respect for relationship boundaries.",
      "True or False: Jealousy is always a sign of personal insecurity rather than legitimate concerns.",
      "True or False: Partners should inform each other about all interactions with people of the opposite sex."
    ]
  },
  {
    category: "Intimacy & Connection",
    masterCategory: "Date Night",
    prompts: [
      "What does intimacy beyond physical connection look like to you?",
      "How do you prefer to reconnect after an argument or disagreement?",
      "What makes you feel most emotionally connected to someone?",
      "How do you express love when words don't feel like enough?",
      "What's your ideal way to spend quality time together?",
      "How do you maintain passion in a long-term relationship?"
    ]
  },
  {
    category: "Pillow Talk & Tea",
    masterCategory: "Girl's Night",
    prompts: [
      "What's the most ridiculous thing you've done to get someone's attention?",
      "Spill: What's your most embarrassing dating app conversation?",
      "What's the pettiest reason you've ended things with someone?",
      "What's your biggest dating red flag that you choose to ignore?",
      "What's the most dramatic way someone has tried to win you back?",
      "What's your most controversial dating opinion that your friends disagree with?"
    ]
  },
  {
    category: "Retrograde & Regrets",
    masterCategory: "Girl's Night",
    prompts: [
      "Which zodiac sign do you attract but should probably avoid?",
      "What's your most Mercury retrograde dating disaster story?",
      "If your love life was a reality TV show, what would it be called?",
      "What dating mistake do you keep making despite knowing better?",
      "Which ex do you blame on your 'villain era' and why?",
      "What's your most unhinged dating app bio you actually used?"
    ]
  },
  {
    category: "Vulnerable & Valid",
    masterCategory: "Girl's Night",
    prompts: [
      "When did you realize you deserved better than what you were accepting?",
      "What's something about relationships you wish someone had told you sooner?",
      "How do you handle the fear of being 'too much' for someone?",
      "What's your biggest relationship insecurity and how do you work through it?",
      "When have you had to choose yourself over keeping the peace?",
      "What's the hardest lesson you've learned about love and dating?"
    ]
  },
  {
    category: "Hot Mess Express",
    masterCategory: "Girl's Night",
    prompts: [
      "What's the most chaotic thing you've done in the name of love?",
      "Rate your dating life on a scale of 1-10 hot mess and explain.",
      "What's your most 'I can't believe I just said that' dating moment?",
      "Which dating phase of yours do you cringe at the most?",
      "What's the most dramatic group chat analysis you've done over a text?",
      "What's your most questionable dating decision that actually worked out?"
    ]
  }
];

const FlirtFuelModule: React.FC<FlirtFuelModuleProps> = ({ userProfile }) => {
  // Main navigation state
  const [activeSection, setActiveSection] = useState<'starters' | 'practice' | 'textgenie'>('starters');
  
  // Conversation starters state
  const [masterCategory, setMasterCategory] = useState('Date Night');
  const [showCategorySelection, setShowCategorySelection] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Relationship Clarity');
  const [customKeywords, setCustomKeywords] = useState('');
  const [currentStarters, setCurrentStarters] = useState<(string | { statement: string; options: { key: string; text: string; }[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCustom, setIsCustom] = useState(false);
  const [customCategories, setCustomCategories] = useState<{[key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[]}>({});
  const [savedPacks, setSavedPacks] = useState<{[key: string]: boolean}>({});
  const [showRename, setShowRename] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [depthLevel, setDepthLevel] = useState([1]); // 0=Light, 1=Casual, 2=Deep
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  
  // Loading states
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isTransformingDepth, setIsTransformingDepth] = useState(false);
  
  // Practice state
  const [practiceMessages, setPracticeMessages] = useState<Array<{ role: 'user' | 'ai'; message: string; timestamp?: Date; rating?: number }>>([]);
  const [currentPracticeMessage, setCurrentPracticeMessage] = useState('');
  const [practiceScenario, setPracticeScenario] = useState('first_date');
  const [showPracticeInput, setShowPracticeInput] = useState(false);
  const [sessionFeedback, setSessionFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [practiceStats, setPracticeStats] = useState({ sessionsCompleted: 0, averageRating: 0, improvementAreas: [] as string[] });
  const [activePracticeMode, setActivePracticeMode] = useState<'conversation' | 'roleplay' | 'coaching'>('conversation');
  const [roleplayCharacter, setRoleplayCharacter] = useState('');
  const [coachingFocus, setCoachingFocus] = useState('confidence');
  const [practiceGoals, setPracticeGoals] = useState<string[]>([]);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [practiceHistory, setPracticeHistory] = useState<Array<{ date: Date; scenario: string; score: number; feedback: string }>>([]);
  
  // Caching
  const questionCacheRef = useRef(new Map<string, string>());
  
  const { getAIResponse, isLoading } = useRelationshipAI();

  // Memoized conversation starters with user profile substitution
  const conversationStarters = useMemo(() => {
    return conversationStartersData.map(starter => ({
      ...starter,
      prompts: starter.prompts.map(prompt => {
        if (typeof prompt === 'string') {
          return prompt.replace('{loveLanguage}', userProfile.loveLanguage);
        }
        return prompt;
      })
    }));
  }, [userProfile.loveLanguage]);

  // Helper functions
  const isMultipleChoice = useCallback((question: string | { statement: string; options: { key: string; text: string; }[] }): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  }, []);

  const getQuestionText = useCallback((question: string | { statement: string; options: { key: string; text: string; }[] }): string => {
    return isMultipleChoice(question) ? question.statement : question;
  }, [isMultipleChoice]);

  // Share functionality
  const handleShare = useCallback(async (text: string) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let appStoreLink = 'https://purposely.app';
    if (isIOS) {
      appStoreLink = 'https://apps.apple.com/app/purposely-dating';
    } else if (isAndroid) {
      appStoreLink = 'https://play.google.com/store/apps/details?id=com.purposely.dating';
    }
    
    const shareText = `${text}\n\nSent with Purposely App\n${appStoreLink}`;
    
    try {
      if ((window as any).Capacitor) {
        await CapacitorShare.share({
          title: 'Conversation Starter',
          text: shareText,
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Conversation Starter',
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Copied to clipboard!');
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  }, []);

  // Question depth adjustment
  const adjustQuestionDepth = useCallback(async (originalQuestion: string, depth: number): Promise<string> => {
    const cacheKey = `${originalQuestion}_${depth}`;
    
    if (questionCacheRef.current.has(cacheKey)) {
      return questionCacheRef.current.get(cacheKey)!;
    }

    try {
      const depthInstructions = {
        0: "Make this light and playful (80 chars max). ONLY return the question.",
        1: "Keep this balanced and engaging (80 chars max). ONLY return the question.", 
        2: "Make this deep and introspective (80 chars max). ONLY return the question."
      };

      const prompt = `Transform: "${originalQuestion}"\n\n${depthInstructions[depth as keyof typeof depthInstructions]}`;
      
      const response = await getAIResponse(prompt, userProfile, 'general');
      const result = response.trim().replace(/^[\"']|[\"']$/g, '').split('\n')[0].substring(0, 120);
      
      questionCacheRef.current.set(cacheKey, result);
      return result || originalQuestion;
      
    } catch (error) {
      console.error('Error adjusting question depth:', error);
      return originalQuestion;
    }
  }, [userProfile, getAIResponse]);

  // Transform questions for depth
  const transformQuestionsForDepth = useCallback(async (
    questions: (string | { statement: string; options: { key: string; text: string; }[] })[], 
    depth: number
  ) => {
    if (depth === 1) {
      setCurrentStarters(questions);
      return;
    }

    setIsTransformingDepth(true);
    
    try {
      const transformedQuestions = [...questions];
      
      for (let i = 0; i < questions.length; i++) {
        try {
          const question = questions[i];
          
          if (typeof question === 'string') {
            const transformed = await adjustQuestionDepth(question, depth);
            transformedQuestions[i] = transformed;
          } else {
            const transformedStatement = await adjustQuestionDepth(question.statement, depth);
            transformedQuestions[i] = { statement: transformedStatement, options: question.options };
          }
          
          // Update UI progressively
          setCurrentStarters([...transformedQuestions]);
          
          // Small delay to prevent API overload
          if (i < questions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          console.error(`Error transforming question ${i}:`, error);
          // Keep original question if transformation fails
          transformedQuestions[i] = questions[i];
        }
      }
    } catch (error) {
      console.error('Error transforming questions:', error);
      setCurrentStarters(questions); // Fallback to original questions
    } finally {
      setIsTransformingDepth(false);
    }
  }, [adjustQuestionDepth]);

  // Category selection
  const selectCategory = useCallback((category: string) => {
    if (category === "Customize") {
      setSelectedCategory(category);
      setShowCategorySelection(true);
      return;
    }

    const categoryData = conversationStarters.find(cat => cat.category === category) || 
                         { prompts: customCategories[category] || [] };
    
    setSelectedCategory(category);
    setIsCustom(category in customCategories);
    setCurrentStarters(categoryData.prompts);
    
    // Set random starting question
    if (categoryData.prompts.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryData.prompts.length);
      setCurrentQuestionIndex(randomIndex);
    }
    
    setShowCategorySelection(false);
  }, [conversationStarters, customCategories]);

  // Generate custom starters
  const generateCustomStarters = useCallback(async () => {
    if (!customKeywords.trim()) return;

    try {
      setIsGeneratingQuestions(true);
      
      const prompt = `Generate 8 engaging conversation starters for dating/relationships based on these keywords: "${customKeywords}". Make them personal, thought-provoking questions that spark meaningful dialogue. Each should be 1-2 sentences maximum. Only return the questions, numbered 1-8.`;
      
      const response = await getAIResponse(prompt, userProfile, 'general');
      const questions = response.split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);

      if (questions.length > 0) {
        setCurrentStarters(questions);
        setIsCustom(true);
        setSelectedCategory(`Custom: ${customKeywords}`);
        setCurrentQuestionIndex(0);
        setShowCategorySelection(false);
      }
    } catch (error) {
      console.error('Error generating custom starters:', error);
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, [customKeywords, userProfile, getAIResponse]);

  // Navigation functions
  const nextQuestion = useCallback(async () => {
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex >= currentStarters.length) {
      if (isCustom || selectedCategory === "Customize") {
        setCurrentQuestionIndex(0);
      } else {
        // Generate new questions
        const categoryData = conversationStarters.find(cat => cat.category === selectedCategory);
        if (categoryData && categoryData.prompts.length > 0) {
          setIsGeneratingQuestions(true);
          try {
            const prompt = `Based on these ${selectedCategory.toLowerCase()} conversation starters: "${categoryData.prompts.slice(0, 3).join('"; "')}", create 6 new similar questions that maintain the same style and depth but offer fresh perspectives. Make them engaging and thought-provoking for ${userProfile.relationshipStatus.toLowerCase()} individuals. Return only the questions, numbered 1-6.`;
            
            const response = await getAIResponse(prompt, userProfile, 'general');
            const newQuestions = response.split('\n')
              .filter(line => line.trim())
              .map(line => line.replace(/^\d+\.\s*/, '').trim())
              .filter(line => line.length > 20);

            if (newQuestions.length > 0) {
              let questionsToAdd = newQuestions;
              
              // Apply depth transformation if needed
              if (masterCategory !== "Girl's Night" && depthLevel[0] !== 1) {
                const transformedQuestions = [];
                for (const question of newQuestions) {
                  try {
                    const transformed = await adjustQuestionDepth(question, depthLevel[0]);
                    transformedQuestions.push(transformed);
                  } catch (error) {
                    transformedQuestions.push(question);
                  }
                }
                questionsToAdd = transformedQuestions;
              }
              
              setCurrentStarters(prev => [...prev, ...questionsToAdd]);
              setCurrentQuestionIndex(currentStarters.length);
            } else {
              setCurrentQuestionIndex(0);
            }
          } catch (error) {
            console.error('Error generating new questions:', error);
            setCurrentQuestionIndex(0);
          } finally {
            setIsGeneratingQuestions(false);
          }
        } else {
          setCurrentQuestionIndex(0);
        }
      }
    } else {
      setCurrentQuestionIndex(nextIndex);
    }
  }, [currentQuestionIndex, currentStarters.length, isCustom, selectedCategory, conversationStarters, userProfile, getAIResponse, masterCategory, depthLevel, adjustQuestionDepth]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => prev === 0 ? currentStarters.length - 1 : prev - 1);
  }, [currentStarters.length]);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    setTouchEnd({ x: touchEndX, y: touchEndY });

    const deltaX = touchStart.x - touchEndX;
    const deltaY = Math.abs(touchStart.y - touchEndY);

    if (deltaY < 50) {
      if (deltaX > 50) nextQuestion();
      else if (deltaX < -50) previousQuestion();
    }
  }, [touchStart, nextQuestion, previousQuestion]);

  // Custom category management
  const saveCurrentCustom = useCallback(() => {
    if (isCustom && currentStarters.length > 0) {
      const categoryName = selectedCategory.startsWith('Custom:') 
        ? selectedCategory.substring(8).trim() 
        : selectedCategory;
      setCustomCategories(prev => ({ ...prev, [categoryName]: currentStarters }));
      setSavedPacks(prev => ({ ...prev, [categoryName]: true }));
    }
  }, [isCustom, currentStarters, selectedCategory]);

  const deleteCustomCategory = useCallback((category: string) => {
    setCustomCategories(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
    setSavedPacks(prev => {
      const updated = { ...prev };
      delete updated[category];
      return updated;
    });
  }, []);

  const renameCustomCategory = useCallback(() => {
    if (newCategoryName.trim() && isCustom) {
      const oldName = selectedCategory.startsWith('Custom:') 
        ? selectedCategory.substring(8).trim() 
        : selectedCategory;
      
      setCustomCategories(prev => {
        const updated = { ...prev };
        updated[newCategoryName.trim()] = updated[oldName];
        delete updated[oldName];
        return updated;
      });
      
      setSelectedCategory(`Custom: ${newCategoryName.trim()}`);
      setNewCategoryName('');
      setShowRename(false);
    }
  }, [newCategoryName, isCustom, selectedCategory]);

  // Enhanced Practice Partner functions
  const startPracticeSession = useCallback(() => {
    setIsSessionActive(true);
    setSessionTimer(0);
    setPracticeMessages([]);
    const timer = setInterval(() => {
      setSessionTimer(prev => prev + 1);
    }, 1000);
    // Store timer ID to clear later
    (window as any).practiceTimer = timer;
  }, []);

  const endPracticeSession = useCallback(() => {
    setIsSessionActive(false);
    if ((window as any).practiceTimer) {
      clearInterval((window as any).practiceTimer);
    }
  }, []);

  const resetPracticeSession = useCallback(() => {
    setPracticeMessages([]);
    setSessionFeedback('');
    setSessionTimer(0);
    setIsSessionActive(false);
    if ((window as any).practiceTimer) {
      clearInterval((window as any).practiceTimer);
    }
  }, []);

  const sendPracticeMessage = useCallback(async () => {
    if (!currentPracticeMessage.trim()) return;

    const userMessage = currentPracticeMessage.trim();
    const timestamp = new Date();
    setPracticeMessages(prev => [...prev, { role: 'user', message: userMessage, timestamp }]);
    setCurrentPracticeMessage('');

    try {
      let scenarioContext = '';
      let aiType: 'therapy' | 'flirt' | 'general' = 'general';

      switch (activePracticeMode) {
        case 'conversation':
          const conversationContexts = {
            first_date: "You're on a first date at a coffee shop. Keep responses flirty but appropriate, showing genuine interest.",
            relationship_talk: "You're in a relationship having a deeper conversation. Be supportive, understanding, and emotionally intelligent.",
            conflict_resolution: "You're working through a disagreement. Focus on understanding, compromise, and healthy communication.",
            workplace_chat: "You're having a casual conversation with a colleague. Keep it professional but friendly.",
            party_networking: "You're at a social event meeting new people. Be engaging and show interest in others."
          };
          scenarioContext = conversationContexts[practiceScenario as keyof typeof conversationContexts] || conversationContexts.first_date;
          aiType = practiceScenario === 'conflict_resolution' ? 'therapy' : 'flirt';
          break;

        case 'roleplay':
          scenarioContext = `You are playing the role of: ${roleplayCharacter}. Stay in character and respond authentically based on this persona.`;
          aiType = 'general';
          break;

        case 'coaching':
          const coachingContexts = {
            confidence: "You're a supportive coach helping build dating confidence. Provide encouraging, actionable advice.",
            communication: "You're a communication coach. Help improve conversational skills and emotional expression.",
            boundaries: "You're a relationship coach focused on healthy boundaries. Guide toward assertive, respectful communication.",
            vulnerability: "You're a coach helping with emotional openness. Encourage authentic, vulnerable sharing."
          };
          scenarioContext = coachingContexts[coachingFocus as keyof typeof coachingContexts] || coachingContexts.confidence;
          aiType = 'therapy';
          break;
      }

      const prompt = `Context: ${scenarioContext}
      
User said: "${userMessage}"

Respond as someone would in this scenario. Keep it natural, engaging, and realistic. 1-2 sentences max.`;

      const response = await getAIResponse(prompt, userProfile, aiType);
      
      setTimeout(() => {
        setPracticeMessages(prev => [...prev, { role: 'ai', message: response.trim(), timestamp: new Date() }]);
      }, 1000);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  }, [currentPracticeMessage, practiceScenario, activePracticeMode, roleplayCharacter, coachingFocus, userProfile, getAIResponse]);

  const generateSessionFeedback = useCallback(async () => {
    if (practiceMessages.length === 0) return;

    try {
      const conversationText = practiceMessages
        .map(msg => `${msg.role}: ${msg.message}`)
        .join('\n');

      let feedbackPrompt = '';
      
      switch (activePracticeMode) {
        case 'conversation':
          feedbackPrompt = `Analyze this practice conversation and provide constructive feedback:\n\n${conversationText}\n\nProvide 2-3 specific insights about communication strengths and areas for improvement. Keep it encouraging and actionable.`;
          break;
        case 'roleplay':
          feedbackPrompt = `Analyze this roleplay practice session:\n\n${conversationText}\n\nProvide feedback on authenticity, engagement, and character consistency. Suggest improvements for future roleplay scenarios.`;
          break;
        case 'coaching':
          feedbackPrompt = `Review this coaching practice session:\n\n${conversationText}\n\nProvide insights on personal growth, communication skills, and progress toward the goal of improved ${coachingFocus}. Be supportive and specific.`;
          break;
      }

      const feedback = await getAIResponse(feedbackPrompt, userProfile, 'therapy');
      setSessionFeedback(feedback.trim());
      setShowFeedback(true);

      // Calculate session score based on message count and timer
      const score = Math.min(100, Math.floor((practiceMessages.length * 10) + (sessionTimer / 60) * 5));
      
      // Update practice stats
      setPracticeStats(prev => ({
        sessionsCompleted: prev.sessionsCompleted + 1,
        averageRating: Math.floor((prev.averageRating * prev.sessionsCompleted + score) / (prev.sessionsCompleted + 1)),
        improvementAreas: [...prev.improvementAreas]
      }));

      // Add to practice history
      setPracticeHistory(prev => [...prev, {
        date: new Date(),
        scenario: `${activePracticeMode}: ${practiceScenario}`,
        score,
        feedback: feedback.substring(0, 100) + '...'
      }]);

    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  }, [practiceMessages, userProfile, getAIResponse, activePracticeMode, practiceScenario, coachingFocus, sessionTimer]);

  const addPracticeGoal = useCallback((goal: string) => {
    if (goal.trim() && !practiceGoals.includes(goal.trim())) {
      setPracticeGoals(prev => [...prev, goal.trim()]);
    }
  }, [practiceGoals]);

  const removePracticeGoal = useCallback((goalToRemove: string) => {
    setPracticeGoals(prev => prev.filter(goal => goal !== goalToRemove));
  }, []);

  const formatTimer = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const openFullScreen = useCallback(() => {
    setIsFullScreen(true);
  }, []);

  // Initialize with default category
  useEffect(() => {
    const defaultCategory = conversationStarters.find(cat => cat.category === selectedCategory);
    if (defaultCategory && !isCustom && currentStarters.length === 0) {
      setCurrentStarters(defaultCategory.prompts);
      const randomIndex = Math.floor(Math.random() * defaultCategory.prompts.length);
      setCurrentQuestionIndex(randomIndex);
    }
  }, [conversationStarters, selectedCategory, isCustom, currentStarters.length]);

  // Handle depth changes
  useEffect(() => {
    if (currentStarters.length === 0 || isCustom || masterCategory === "Girl's Night") return;
    
    const categoryData = conversationStarters.find(cat => cat.category === selectedCategory);
    if (!categoryData) return;

    if (depthLevel[0] === 1) {
      setCurrentStarters(categoryData.prompts);
    } else if (!isTransformingDepth) {
      transformQuestionsForDepth(categoryData.prompts, depthLevel[0]);
    }
  }, [depthLevel[0], selectedCategory, masterCategory, isCustom]);

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Clarity Coach
          </h1>
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Master meaningful conversations, practice with AI, and craft perfect responses
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-center">
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <Button
            variant={activeSection === 'starters' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('starters')}
            className="rounded-md px-4"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Starters
          </Button>
          <Button
            variant={activeSection === 'textgenie' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('textgenie')}
            className="rounded-md px-4"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Genie
          </Button>
          <Button
            variant={activeSection === 'practice' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveSection('practice')}
            className="rounded-md px-4"
          >
            <Zap className="w-4 h-4 mr-2" />
            Practice
          </Button>
        </div>
      </div>

      {/* Content Sections */}
      {activeSection === 'starters' && (
        <ConversationStartersSection
          userProfile={userProfile}
          conversationStarters={conversationStarters}
          masterCategory={masterCategory}
          selectedCategory={selectedCategory}
          customKeywords={customKeywords}
          currentStarters={currentStarters}
          currentQuestionIndex={currentQuestionIndex}
          isCustom={isCustom}
          customCategories={customCategories}
          savedPacks={savedPacks}
          showRename={showRename}
          showManage={showManage}
          newCategoryName={newCategoryName}
          depthLevel={depthLevel}
          isLoading={isLoading || isGeneratingQuestions || isTransformingDepth}
          isFullScreen={isFullScreen}
          touchStart={touchStart}
          touchEnd={touchEnd}
          showCategorySelection={showCategorySelection}
          setMasterCategory={setMasterCategory}
          setShowCategorySelection={setShowCategorySelection}
          setSelectedCategory={setSelectedCategory}
          setCustomKeywords={setCustomKeywords}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          setShowRename={setShowRename}
          setShowManage={setShowManage}
          setNewCategoryName={setNewCategoryName}
          setDepthLevel={setDepthLevel}
          setTouchStart={setTouchStart}
          setTouchEnd={setTouchEnd}
          selectCategory={selectCategory}
          generateCustomStarters={generateCustomStarters}
          saveCurrentCustom={saveCurrentCustom}
          deleteCustomCategory={deleteCustomCategory}
          renameCustomCategory={renameCustomCategory}
          previousQuestion={previousQuestion}
          nextQuestion={nextQuestion}
          openFullScreen={openFullScreen}
          handleTouchStart={handleTouchStart}
          handleTouchEnd={handleTouchEnd}
          handleShare={handleShare}
          isMultipleChoice={isMultipleChoice}
          getQuestionText={getQuestionText}
        />
      )}

      {activeSection === 'textgenie' && (
        <TextGenie userProfile={userProfile} />
      )}

      {activeSection === 'practice' && (
        <div className="space-y-6">
          {/* Practice Overview & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-soft border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Sessions</span>
                </div>
                <div className="text-2xl font-bold">{practiceStats.sessionsCompleted}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Average Score</span>
                </div>
                <div className="text-2xl font-bold">{practiceStats.averageRating}</div>
                <p className="text-xs text-muted-foreground">Out of 100</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-soft border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Session Time</span>
                </div>
                <div className="text-2xl font-bold">{formatTimer(sessionTimer)}</div>
                <p className="text-xs text-muted-foreground">Current Session</p>
              </CardContent>
            </Card>
          </div>

          {/* Practice Mode Selection */}
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                AI Practice Partner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Practice Mode</Label>
                <Select value={activePracticeMode} onValueChange={(value) => setActivePracticeMode(value as 'conversation' | 'roleplay' | 'coaching')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conversation">Conversation Practice</SelectItem>
                    <SelectItem value="roleplay">Roleplay Scenarios</SelectItem>
                    <SelectItem value="coaching">Personal Coaching</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conversation Practice Settings */}
              {activePracticeMode === 'conversation' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Scenario</Label>
                  <Select value={practiceScenario} onValueChange={setPracticeScenario}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_date">First Date</SelectItem>
                      <SelectItem value="relationship_talk">Relationship Talk</SelectItem>
                      <SelectItem value="conflict_resolution">Conflict Resolution</SelectItem>
                      <SelectItem value="workplace_chat">Workplace Chat</SelectItem>
                      <SelectItem value="party_networking">Party Networking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Roleplay Settings */}
              {activePracticeMode === 'roleplay' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Character Type</Label>
                  <Input
                    placeholder="e.g., Shy introvert, Confident artist, Busy professional..."
                    value={roleplayCharacter}
                    onChange={(e) => setRoleplayCharacter(e.target.value)}
                  />
                </div>
              )}

              {/* Coaching Settings */}
              {activePracticeMode === 'coaching' && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Coaching Focus</Label>
                  <Select value={coachingFocus} onValueChange={setCoachingFocus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confidence">Building Confidence</SelectItem>
                      <SelectItem value="communication">Communication Skills</SelectItem>
                      <SelectItem value="boundaries">Healthy Boundaries</SelectItem>
                      <SelectItem value="vulnerability">Emotional Vulnerability</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Session Controls */}
              <div className="flex gap-2">
                {!isSessionActive ? (
                  <Button onClick={startPracticeSession} className="flex-1">
                    <Play className="w-4 h-4 mr-2" />
                    Start Session
                  </Button>
                ) : (
                  <Button onClick={endPracticeSession} variant="outline" className="flex-1">
                    <Pause className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                )}
                <Button onClick={resetPracticeSession} variant="outline">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          {isSessionActive && (
            <Card className="shadow-soft border-primary/10">
              <CardContent className="space-y-4 p-4">
                {practiceMessages.length > 0 && (
                  <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-muted/20 rounded-lg">
                    {practiceMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-8'
                            : 'bg-background mr-8 border border-border'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        {msg.timestamp && (
                          <p className="text-xs opacity-70 mt-1">
                            {msg.timestamp.toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={currentPracticeMessage}
                    onChange={(e) => setCurrentPracticeMessage(e.target.value)}
                    className="flex-1"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendPracticeMessage();
                      }
                    }}
                  />
                  <Button
                    onClick={sendPracticeMessage}
                    disabled={!currentPracticeMessage.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {practiceMessages.length > 0 && (
                  <Button
                    onClick={generateSessionFeedback}
                    variant="outline"
                    disabled={isLoading}
                    className="w-full"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Get Session Feedback
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Practice Goals */}
          <Card className="shadow-soft border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Practice Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a practice goal..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addPracticeGoal((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
              </div>
              
              {practiceGoals.length > 0 && (
                <div className="space-y-2">
                  {practiceGoals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{goal}</span>
                      <Button
                        onClick={() => removePracticeGoal(goal)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Practice History */}
          {practiceHistory.length > 0 && (
            <Card className="shadow-soft border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {practiceHistory.slice(-5).reverse().map((session, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{session.scenario}</p>
                        <p className="text-xs text-muted-foreground">
                          {session.date.toLocaleDateString()} • Score: {session.score}/100
                        </p>
                      </div>
                      <Badge variant="secondary">{session.score}/100</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Full Screen Dialog */}
      <Dialog open={isFullScreen} onOpenChange={setIsFullScreen}>
        <DialogContent className="max-w-md bg-gradient-romance text-white border-none">
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              {selectedCategory}
            </DialogTitle>
          </DialogHeader>
          <div className="py-8">
            {currentStarters.length > 0 && (
              <div className="text-center">
                {isMultipleChoice(currentStarters[currentQuestionIndex]) ? (
                  <div>
                    <p className="text-xl font-bold mb-4">
                      {(currentStarters[currentQuestionIndex] as any).statement}
                    </p>
                    <div className="space-y-2 text-left">
                      {(currentStarters[currentQuestionIndex] as any).options.map((option: any) => (
                        <div key={option.key} className="text-white/90">
                          <span className="font-bold">{option.key}. </span>
                          <span>{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xl font-bold leading-relaxed">
                    {getQuestionText(currentStarters[currentQuestionIndex])}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-4">
            <Button 
              onClick={previousQuestion} 
              variant="outline" 
              size="sm"
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                {currentQuestionIndex + 1} of {currentStarters.length}
              </span>
            </div>
            
            <Button 
              onClick={nextQuestion} 
              variant="outline" 
              size="sm"
              disabled={isGeneratingQuestions}
              className="flex items-center gap-2"
            >
              {isGeneratingQuestions ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  {currentQuestionIndex === currentStarters.length - 1 ? 'Generate More' : 'Next'}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2 px-4">
            <Button
              onClick={() => handleShare(getQuestionText(currentStarters[currentQuestionIndex]))}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Feedback</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm leading-relaxed">{sessionFeedback}</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowFeedback(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlirtFuelModule;
