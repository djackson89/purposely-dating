import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface UserProfile {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

export const useQuestionPoolInitialization = (userProfile: UserProfile) => {
  const { toast } = useToast();

  useEffect(() => {
    const initializeQuestionPool = async () => {
      try {
        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Initializing question pool for new user...');

        // Call the populate-question-pool edge function
        const { data, error } = await supabase.functions.invoke('populate-question-pool', {
          body: {
            userId: user.id,
            userProfile: userProfile
          }
        });

        if (error) {
          console.error('Error populating question pool:', error);
          return;
        }

        if (data.success) {
          console.log('Question pool initialized successfully:', data.questionsGenerated, 'questions generated');
          toast({
            title: "Welcome!",
            description: "Your personalized conversation starters are ready.",
          });
        }

      } catch (error) {
        console.error('Error in question pool initialization:', error);
      }
    };

    // Only initialize if we have a complete user profile
    if (userProfile.loveLanguage && userProfile.relationshipStatus && userProfile.age && userProfile.gender && userProfile.personalityType) {
      initializeQuestionPool();
    }
  }, [userProfile, toast]);
};