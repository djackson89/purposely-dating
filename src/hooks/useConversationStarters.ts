import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRelationshipAI } from './useRelationshipAI';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface ConversationStarter {
  category: string;
  masterCategory?: string;
  type?: string;
  prompts: (string | { statement: string; options: { key: string; text: string; }[] })[];
}

interface UseConversationStartersReturn {
  // State
  masterCategory: string;
  selectedCategory: string;
  currentStarters: (string | { statement: string; options: { key: string; text: string; }[] })[];
  currentQuestionIndex: number;
  customKeywords: string;
  isCustom: boolean;
  customCategories: {[key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[]};
  savedPacks: {[key: string]: boolean};
  depthLevel: number[];
  isTransforming: boolean;
  questionCache: Map<string, any>;
  
  // Actions
  setMasterCategory: (category: string) => void;
  setCustomKeywords: (keywords: string) => void;
  setDepthLevel: (level: number[]) => void;
  selectCategory: (category: string) => void;
  generateCustomStarters: () => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  saveCurrentCustom: () => void;
  deleteCustomCategory: (category: string) => void;
  
  // Utilities
  isMultipleChoice: (question: string | { statement: string; options: { key: string; text: string; }[] }) => question is { statement: string; options: { key: string; text: string; }[] };
  getQuestionText: (question: string | { statement: string; options: { key: string; text: string; }[] }) => string;
  filteredStarters: ConversationStarter[];
}

export const useConversationStarters = (
  userProfile: OnboardingData,
  conversationStarters: ConversationStarter[]
): UseConversationStartersReturn => {
  // Core state
  const [masterCategory, setMasterCategory] = useState('Date Night');
  const [selectedCategory, setSelectedCategory] = useState('Relationship Talk');
  const [currentStarters, setCurrentStarters] = useState<(string | { statement: string; options: { key: string; text: string; }[] })[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [customKeywords, setCustomKeywords] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [customCategories, setCustomCategories] = useState<{[key: string]: (string | { statement: string; options: { key: string; text: string; }[] })[]}>({});
  const [savedPacks, setSavedPacks] = useState<{[key: string]: boolean}>({});
  const [depthLevel, setDepthLevel] = useState([1]);
  const [isTransforming, setIsTransforming] = useState(false);
  const [questionCache, setQuestionCache] = useState<Map<string, any>>(new Map());

  const { getAIResponse, isLoading } = useRelationshipAI();

  // Memoized filtered starters to prevent unnecessary re-filtering
  const filteredStarters = useMemo(() => 
    conversationStarters.filter(starter => 
      (starter.masterCategory || 'Date Night') === masterCategory
    ), [conversationStarters, masterCategory]
  );

  // Utility functions (memoized to prevent recreation)
  const isMultipleChoice = useCallback((
    question: string | { statement: string; options: { key: string; text: string; }[] }
  ): question is { statement: string; options: { key: string; text: string; }[] } => {
    return typeof question === 'object' && 'statement' in question;
  }, []);

  const getQuestionText = useCallback((
    question: string | { statement: string; options: { key: string; text: string; }[] }
  ): string => {
    return isMultipleChoice(question) ? question.statement : question;
  }, [isMultipleChoice]);

  // Optimized category selection with depth-based filtering
  const selectCategory = useCallback((category: string) => {
    const cacheKey = `${category}-${depthLevel[0]}`;
    
    if (questionCache.has(cacheKey)) {
      const cachedData = questionCache.get(cacheKey);
      setCurrentStarters(cachedData);
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setIsCustom(category in customCategories);
      return;
    }

    if (category === 'Customize') {
      setSelectedCategory(category);
      setCurrentStarters([]);
      setIsCustom(false);
      return;
    }

    if (category in customCategories) {
      const starters = customCategories[category];
      setCurrentStarters(starters);
      setQuestionCache(prev => new Map(prev).set(cacheKey, starters));
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setIsCustom(true);
      return;
    }

    const starterCategory = filteredStarters.find(s => s.category === category);
    if (starterCategory) {
      // Apply depth-based filtering to questions
      let filteredPrompts = starterCategory.prompts;
      
      // For depth filtering, we'll slice different portions of the questions array
      const totalQuestions = filteredPrompts.length;
      if (depthLevel[0] === 0) {
        // Light: Use first third of questions (lighter topics)
        filteredPrompts = filteredPrompts.slice(0, Math.ceil(totalQuestions / 3));
      } else if (depthLevel[0] === 1) {
        // Casual: Use middle third of questions
        const start = Math.floor(totalQuestions / 3);
        const end = Math.ceil((totalQuestions * 2) / 3);
        filteredPrompts = filteredPrompts.slice(start, end);
      } else {
        // Deep: Use last third of questions (deeper topics)
        const start = Math.floor((totalQuestions * 2) / 3);
        filteredPrompts = filteredPrompts.slice(start);
      }
      
      setCurrentStarters(filteredPrompts);
      setQuestionCache(prev => new Map(prev).set(cacheKey, filteredPrompts));
      setSelectedCategory(category);
      setCurrentQuestionIndex(0);
      setIsCustom(false);
    }
  }, [customCategories, filteredStarters, depthLevel, questionCache]);

  // Optimized question navigation
  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => 
      prev < currentStarters.length - 1 ? prev + 1 : 0
    );
  }, [currentStarters.length]);

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex(prev => 
      prev > 0 ? prev - 1 : currentStarters.length - 1
    );
  }, [currentStarters.length]);

  // Optimized custom starter generation
  const generateCustomStarters = useCallback(async () => {
    if (!customKeywords.trim()) return;

    setIsTransforming(true);
    try {
      const prompt = `Create 8 engaging conversation starter questions based on these keywords: "${customKeywords}". 
      Consider the user's profile: love language is ${userProfile.loveLanguage}, 
      they are ${userProfile.relationshipStatus}, age ${userProfile.age}, 
      personality type ${userProfile.personalityType}. 
      Return as a JSON array of strings, each question should be thought-provoking and relevant to dating/relationships.`;

      const response = await getAIResponse(prompt, userProfile, 'general');
      
      try {
        const questions = JSON.parse(response);
        if (Array.isArray(questions)) {
          setCurrentStarters(questions);
          setSelectedCategory('Custom: ' + customKeywords);
          setCurrentQuestionIndex(0);
          setIsCustom(true);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        const fallbackQuestions = response.split('\n').filter(q => q.trim()).slice(0, 8);
        setCurrentStarters(fallbackQuestions);
        setSelectedCategory('Custom: ' + customKeywords);
        setCurrentQuestionIndex(0);
        setIsCustom(true);
      }
    } catch (error) {
      console.error('Error generating custom starters:', error);
    } finally {
      setIsTransforming(false);
    }
  }, [customKeywords, userProfile, getAIResponse]);

  // Custom category management
  const saveCurrentCustom = useCallback(() => {
    if (currentStarters.length > 0 && selectedCategory.includes('Custom:')) {
      const categoryName = selectedCategory.replace('Custom: ', '');
      setCustomCategories(prev => ({
        ...prev,
        [categoryName]: currentStarters
      }));
      setSavedPacks(prev => ({
        ...prev,
        [categoryName]: true
      }));
    }
  }, [currentStarters, selectedCategory]);

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

  // Auto-select first category when master category changes
  useEffect(() => {
    if (filteredStarters.length > 0) {
      selectCategory(filteredStarters[0].category);
    }
  }, [filteredStarters, selectCategory]);

  // Re-apply depth filtering when depth level changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'Customize' && !isCustom) {
      // Clear cache for current category and re-select to apply new depth
      setQuestionCache(prev => {
        const newCache = new Map(prev);
        // Remove all cache entries for the current category
        for (const [key] of newCache) {
          if (key.startsWith(selectedCategory + '-')) {
            newCache.delete(key);
          }
        }
        return newCache;
      });
      selectCategory(selectedCategory);
    }
  }, [depthLevel, selectedCategory, isCustom, selectCategory]);

  return {
    // State
    masterCategory,
    selectedCategory,
    currentStarters,
    currentQuestionIndex,
    customKeywords,
    isCustom,
    customCategories,
    savedPacks,
    depthLevel,
    isTransforming: isTransforming || isLoading,
    questionCache,
    
    // Actions
    setMasterCategory,
    setCustomKeywords,
    setDepthLevel,
    selectCategory,
    generateCustomStarters,
    nextQuestion,
    previousQuestion,
    saveCurrentCustom,
    deleteCustomCategory,
    
    // Utilities
    isMultipleChoice,
    getQuestionText,
    filteredStarters,
  };
};