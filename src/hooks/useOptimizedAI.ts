import { useState, useCallback, useRef } from 'react';
import { useRelationshipAI } from './useRelationshipAI';
import { useToast } from '@/components/ui/use-toast';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface CachedResponse {
  response: string;
  timestamp: number;
}

interface OptimizedAIOptions {
  cacheTimeout?: number; // Cache timeout in milliseconds
  batchSize?: number; // Batch size for processing
  retryAttempts?: number; // Number of retry attempts
}

export const useOptimizedAI = (options: OptimizedAIOptions = {}) => {
  const {
    cacheTimeout = 5 * 60 * 1000, // 5 minutes default
    batchSize = 3,
    retryAttempts = 2
  } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const cacheRef = useRef(new Map<string, CachedResponse>());
  const pendingRequestsRef = useRef(new Map<string, Promise<string>>());
  
  const { getAIResponse, getFlirtSuggestion, isLoading } = useRelationshipAI();
  const { toast } = useToast();

  // Optimized cache management
  const getCachedResponse = useCallback((key: string): string | null => {
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cacheTimeout) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.response;
  }, [cacheTimeout]);

  const setCachedResponse = useCallback((key: string, response: string) => {
    cacheRef.current.set(key, {
      response,
      timestamp: Date.now()
    });
  }, []);

  // Deduplicated AI requests
  const getOptimizedResponse = useCallback(async (
    prompt: string,
    userProfile: OnboardingData,
    type: 'therapy' | 'flirt' | 'date' | 'intimacy' | 'general' = 'general'
  ): Promise<string> => {
    const cacheKey = `${prompt}_${type}_${JSON.stringify(userProfile)}`;
    
    // Check cache first
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;
    
    // Check if request is already pending
    if (pendingRequestsRef.current.has(cacheKey)) {
      return pendingRequestsRef.current.get(cacheKey)!;
    }

    // Create new request
    const request = (async () => {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= retryAttempts; attempt++) {
        try {
          const response = await getAIResponse(prompt, userProfile, type);
          setCachedResponse(cacheKey, response);
          pendingRequestsRef.current.delete(cacheKey);
          return response;
        } catch (error) {
          lastError = error as Error;
          if (attempt < retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }
      
      pendingRequestsRef.current.delete(cacheKey);
      throw lastError || new Error('Max retries exceeded');
    })();

    pendingRequestsRef.current.set(cacheKey, request);
    return request;
  }, [getCachedResponse, setCachedResponse, getAIResponse, retryAttempts]);

  // Batch processing for multiple requests
  const processBatch = useCallback(async <T>(
    items: T[],
    processor: (item: T, index: number) => Promise<any>,
    onProgress?: (progress: number) => void
  ): Promise<any[]> => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      const results: any[] = [];
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(
          batch.map((item, batchIndex) => processor(item, i + batchIndex))
        );
        
        results.push(...batchResults);
        
        const progress = Math.min(100, ((i + batch.length) / items.length) * 100);
        setProcessingProgress(progress);
        onProgress?.(progress);
        
        // Small delay between batches to prevent overwhelming
        if (i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      return results;
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [batchSize]);

  // Optimized question transformation
  const transformQuestions = useCallback(async (
    questions: (string | { statement: string; options: { key: string; text: string; }[] })[],
    depth: number,
    userProfile: OnboardingData,
    onProgress?: (progress: number) => void
  ) => {
    const depthInstructions = {
      0: "Make this witty and sarcastic (80 chars max). ONLY return the question.",
      1: "Make this balanced and engaging (80 chars max). ONLY return the question.", 
      2: "Make this deep and psychological (80 chars max). ONLY return the question."
    };

    return processBatch(
      questions,
      async (question) => {
        if (typeof question === 'string') {
          const prompt = `Transform: "${question}"\n\n${depthInstructions[depth as keyof typeof depthInstructions]}`;
          const response = await getOptimizedResponse(prompt, userProfile, 'general');
          return response.trim().replace(/^["']|["']$/g, '').split('\n')[0].substring(0, 120) || question;
        } else {
          const prompt = `Transform: "${question.statement}"\n\n${depthInstructions[depth as keyof typeof depthInstructions]}`;
          const transformedStatement = await getOptimizedResponse(prompt, userProfile, 'general');
          return {
            statement: transformedStatement.trim().replace(/^["']|["']$/g, '').split('\n')[0].substring(0, 120) || question.statement,
            options: question.options
          };
        }
      },
      onProgress
    );
  }, [getOptimizedResponse, processBatch]);

  // Generate multiple response variations efficiently
  const generateResponseVariations = useCallback(async (
    context: string,
    userProfile: OnboardingData,
    variations: Array<{ tone: string; type: 'therapy' | 'flirt' | 'general'; prompt: string }>
  ) => {
    return processBatch(
      variations,
      async (variation) => {
        const fullPrompt = `${variation.prompt}: ${context}`;
        const response = await getOptimizedResponse(fullPrompt, userProfile, variation.type);
        return {
          tone: variation.tone,
          text: response.trim().replace(/^["']|["']$/g, '').replace(/\*/g, ''),
          response
        };
      }
    );
  }, [getOptimizedResponse, processBatch]);

  // Clear cache utility
  const clearCache = useCallback((pattern?: string) => {
    if (!pattern) {
      cacheRef.current.clear();
      return;
    }
    
    const keysToDelete = Array.from(cacheRef.current.keys())
      .filter(key => key.includes(pattern));
    
    keysToDelete.forEach(key => cacheRef.current.delete(key));
  }, []);

  // Get cache stats
  const getCacheStats = useCallback(() => {
    const now = Date.now();
    const validEntries = Array.from(cacheRef.current.values())
      .filter(entry => now - entry.timestamp < cacheTimeout);
    
    return {
      totalEntries: cacheRef.current.size,
      validEntries: validEntries.length,
      cacheHitRate: validEntries.length / Math.max(1, cacheRef.current.size)
    };
  }, [cacheTimeout]);

  return {
    // Core functions
    getOptimizedResponse,
    processBatch,
    transformQuestions,
    generateResponseVariations,
    
    // State
    isProcessing: isProcessing || isLoading,
    processingProgress,
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Legacy support
    getFlirtSuggestion: useCallback(async (prompt: string, userProfile: OnboardingData) => {
      return getOptimizedResponse(prompt, userProfile, 'flirt');
    }, [getOptimizedResponse])
  };
};