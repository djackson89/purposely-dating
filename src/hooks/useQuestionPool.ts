import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseQuestionPoolProps {
  userProfile: any;
  selectedCategories?: string[];
}

export const useQuestionPool = ({ userProfile, selectedCategories = [] }: UseQuestionPoolProps) => {
  
  // Initialize pools for multiple categories on app startup
  useEffect(() => {
    if (!userProfile) return;

    const initializePools = async () => {
      // Default categories to pre-populate
      const defaultCategories = selectedCategories.length > 0 
        ? selectedCategories 
        : [
          'Boundaries & Values',
          'Communication & Conflict', 
          'Emotional Intelligence',
          'Pillow Talk & Tea',
          'Trust & Transparency'
        ];

      console.log('Initializing question pools for categories:', defaultCategories);

      for (const category of defaultCategories) {
        for (const depthLevel of [1, 2, 3]) {
          try {
            // Check if pool needs initialization
            const { data, error } = await supabase.functions.invoke('manage-question-pool', {
              body: { 
                action: 'check_pool_count',
                category,
                depthLevel
              }
            });

            if (!error && data?.success && data.count < 5) {
              console.log(`Populating pool for ${category} depth ${depthLevel}`);
              await supabase.functions.invoke('manage-question-pool', {
                body: { 
                  action: 'populate_pool',
                  userProfile,
                  category,
                  depthLevel,
                  questionsToGenerate: 20
                }
              });
            }
          } catch (error) {
            console.error(`Error initializing pool for ${category} depth ${depthLevel}:`, error);
          }
        }
      }

      console.log('Question pool initialization complete');
    };

    // Small delay to ensure user is fully authenticated
    const timer = setTimeout(initializePools, 2000);
    return () => clearTimeout(timer);
  }, [userProfile]);

  return {
    // Can add pool status methods here if needed
  };
};