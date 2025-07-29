import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Users, MessageCircle, Heart, Share } from 'lucide-react';

export const BotManagement = () => {
  const [isCreatingBots, setIsCreatingBots] = useState(false);
  const [isGeneratingEngagement, setIsGeneratingEngagement] = useState(false);
  const { toast } = useToast();

  const createBots = async () => {
    setIsCreatingBots(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-bot-engagement', {
        body: { action: 'create_bots' }
      });

      if (error) throw error;

      toast({
        title: "Bot Users Created",
        description: `Successfully created ${data.bots?.length || 0} bot users`,
      });
    } catch (error) {
      console.error('Error creating bots:', error);
      toast({
        title: "Error",
        description: "Failed to create bot users",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBots(false);
    }
  };

  const generateEngagement = async () => {
    setIsGeneratingEngagement(true);
    try {
      // Generate engagement for scenario index 0 (default)
      const { data, error } = await supabase.functions.invoke('create-bot-engagement', {
        body: { 
          action: 'generate_engagement',
          scenarioIndex: 0
        }
      });

      if (error) throw error;

      toast({
        title: "Engagement Generated",
        description: `Generated ${data.comments} comments, ${data.likes} likes, and ${data.shares} shares`,
      });
    } catch (error) {
      console.error('Error generating engagement:', error);
      toast({
        title: "Error",
        description: "Failed to generate engagement",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingEngagement(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bot Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={createBots} 
          disabled={isCreatingBots}
          className="w-full"
        >
          {isCreatingBots ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Bots...
            </>
          ) : (
            <>
              <Users className="mr-2 h-4 w-4" />
              Create 50 Bot Users
            </>
          )}
        </Button>

        <Button 
          onClick={generateEngagement} 
          disabled={isGeneratingEngagement}
          className="w-full"
          variant="outline"
        >
          {isGeneratingEngagement ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <MessageCircle className="mr-2 h-4 w-4" />
              Generate Engagement
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex items-center gap-2">
            <Heart className="h-3 w-3" />
            <span>1400-1900 likes per post</span>
          </div>
          <div className="flex items-center gap-2">
            <Share className="h-3 w-3" />
            <span>800-1100 shares per post</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-3 w-3" />
            <span>10 realistic comments</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};