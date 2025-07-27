import { useState } from 'react';
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

export const useRelationshipAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getAIResponse = async (
    prompt: string, 
    userProfile: UserProfile, 
    type: AIType = 'general'
  ): Promise<string> => {
    setIsLoading(true);
    
    try {
      console.log('Requesting AI response for type:', type);
      
      const { data, error } = await supabase.functions.invoke('relationship-ai', {
        body: { 
          prompt, 
          userProfile, 
          type 
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to get AI response');
      }

      if (data.error) {
        console.error('AI service error:', data.error);
        throw new Error(data.error);
      }

      console.log('AI response received successfully');
      return data.response;
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "AI Error",
        description: error instanceof Error ? error.message : 'Failed to get AI response',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTherapyInsight = async (prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'therapy');
  };

  const getFlirtSuggestion = async (prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'flirt');
  };

  const getDateIdea = async (prompt: string, userProfile: UserProfile) => {
    return getAIResponse(prompt, userProfile, 'date');
  };

  return {
    isLoading,
    getAIResponse,
    getTherapyInsight,
    getFlirtSuggestion,
    getDateIdea
  };
};