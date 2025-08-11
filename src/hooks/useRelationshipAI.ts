import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

type AIType = 'therapy' | 'flirt' | 'date' | 'intimacy' | 'general';

export type Audience = 'woman' | 'man' | 'couple' | 'unspecified';
export type LengthPref = 'short' | 'standard' | 'long';

export interface PurposelyOptions {
  audience: Audience;
  spice_level: number; // 1-5
  length: LengthPref;
  topic_tags: string[];
}

export interface PurposelyResult {
  rendered: string;
  json: {
    hook: string;
    pattern: string;
    validation: string;
    perspective: string;
    actions: string[];
    cta: string;
  } | null;
}

export const useRelationshipAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAIResponse = useCallback(async (
    prompt: string,
    userProfile: UserProfile,
    type: AIType = 'general'
  ): Promise<string> => {
    setIsLoading(true);
    try {
      console.log('Requesting AI response for type:', type);
      const { data, error } = await supabase.functions.invoke('relationship-ai', {
        body: { prompt, userProfile, type }
      });
      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }
      if ((data as any)?.error) {
        console.error('AI service error:', (data as any).error);
        throw new Error((data as any).error);
      }
      console.log('AI response received successfully');
      return (data as any).response as string;
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'AI Error',
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getTherapyInsight = useCallback((prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'therapy');
  }, [getAIResponse]);

  const getFlirtSuggestion = useCallback((prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'flirt');
  }, [getAIResponse]);

  const getDateIdea = useCallback((prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'date');
  }, [getAIResponse]);

  const getPurposelyPerspective = useCallback(async (
    user_question: string,
    userProfile: UserProfile,
    options: PurposelyOptions
  ): Promise<PurposelyResult> => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('relationship-ai', {
        body: {
          prompt: user_question,
          userProfile,
          type: 'purposely',
          audience: options.audience,
          spice_level: options.spice_level,
          length: options.length,
          topic_tags: options.topic_tags,
        }
      });
      if (error) throw new Error(error.message || 'Failed to get Purposely Perspective');
      if ((data as any)?.error) throw new Error((data as any).error);
      const rendered: string = (data as any).response ?? '';
      const json = (data as any).json ?? null;
      return { rendered, json };
    } catch (e) {
      console.error('Purposely AI error', e);
      toast({ title: 'AI Error', description: e instanceof Error ? e.message : 'Failed to get perspective', variant: 'destructive' });
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    getAIResponse,
    getTherapyInsight,
    getFlirtSuggestion,
    getDateIdea,
    getPurposelyPerspective,
  };
};