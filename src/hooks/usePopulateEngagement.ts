import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePopulateEngagement = () => {
  const [isPopulating, setIsPopulating] = useState(false);
  const { toast } = useToast();

  const botNames = [
    'Emma', 'Olivia', 'Ava', 'Isabella', 'Sophia', 'Charlotte', 'Mia', 'Amelia', 'Harper', 'Evelyn'
  ];

  const sampleComments = [
    "Girl, RUN! This is beyond disrespectful 💔",
    "Your dignity is worth more than this relationship",
    "He's training you to accept less. Don't let him!",
    "The audacity! You deserve someone who celebrates you",
    "This isn't love - love doesn't humiliate you publicly",
    "Trust your gut feeling. It's trying to protect you",
    "A real man builds you up, not tears you down",
    "You're not broken, your picker just needs an upgrade",
    "He's showing you who he is - believe him",
    "Standards aren't asking too much, they're the minimum"
  ];

  const populateEngagement = async (scenarioIndex: number) => {
    setIsPopulating(true);
    try {
      // First, create bot users if they don't exist
      const { data: existingBots } = await supabase
        .from('bot_users')
        .select('*')
        .limit(10);

      let bots = existingBots || [];

      if (bots.length < 10) {
        // Create missing bots
        const botsToCreate = botNames.slice(bots.length).map(name => ({
          name: name,
          bio: `Empowering women to know their worth 💖`,
          personality_traits: { supportive: true, direct: true },
          is_active: true,
          created_by: '00000000-0000-0000-0000-000000000000'
        }));

        const { data: newBots, error: botError } = await supabase
          .from('bot_users')
          .insert(botsToCreate)
          .select();

        if (botError) throw botError;
        bots = [...bots, ...(newBots || [])];
      }

      // Check if comments already exist for this scenario
      const { data: existingComments } = await supabase
        .from('scenario_comments')
        .select('*')
        .eq('scenario_index', scenarioIndex);

      if (existingComments && existingComments.length > 0) {
        toast({
          title: "Comments already exist",
          description: "This scenario already has comments",
        });
        return;
      }

      // Create comments
      const commentsToCreate = sampleComments.map((comment, index) => ({
        scenario_index: scenarioIndex,
        content: comment,
        bot_user_id: bots[index]?.id,
        user_id: null
      }));

      const { error: commentError } = await supabase
        .from('scenario_comments')
        .insert(commentsToCreate);

      if (commentError) throw commentError;

      // Create some likes for the scenario
      const likesCount = Math.floor(Math.random() * 501) + 1400;
      const likesToCreate = [];
      
      for (let i = 0; i < Math.min(likesCount, bots.length * 50); i++) {
        likesToCreate.push({
          scenario_index: scenarioIndex,
          user_id: bots[i % bots.length].id,
          interaction_type: 'like'
        });
      }

      // Insert in batches to avoid overwhelming the database
      for (let i = 0; i < likesToCreate.length; i += 100) {
        const batch = likesToCreate.slice(i, i + 100);
        await supabase
          .from('scenario_interactions')
          .insert(batch);
      }

      toast({
        title: "Engagement populated!",
        description: `Added ${commentsToCreate.length} comments and ${likesCount} likes`,
      });

    } catch (error) {
      console.error('Error populating engagement:', error);
      toast({
        title: "Error",
        description: "Failed to populate engagement",
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  return {
    populateEngagement,
    isPopulating
  };
};