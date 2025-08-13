import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Share2, MessageCircle, Send, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipAI } from '@/hooks/useRelationshipAI';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import QuickStartModule from '@/components/QuickStartModule';
import SideMenu from '@/components/SideMenu';
import WelcomeTour from '@/components/WelcomeTour';
import AskPurposelySection from '@/components/AskPurposelySection';
import { QotdItem } from '@/features/qotd/types';
import { getDailyQotd } from '@/features/qotd/getDailyQotd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

interface HomeProps {
  userProfile: OnboardingData & {
    first_name?: string;
    full_name?: string;
  };
  onNavigateToFlirtFuel: () => void;
  onNavigateToAIPractice: (scenario?: string) => void;
  onNavigateToModule?: (module: string) => void;
  sneakPeekTracking?: any;
  onPaywallTrigger?: (trigger: 'view_limit' | 'ask_purposely' | 'next_question') => void;
}

// Module navigation mapping
const moduleNavigationMap = {
  'flirtfuel': 'flirtfuel',
  'therapy': 'therapy',
  'concierge': 'concierge'
};

const Home: React.FC<HomeProps> = ({ userProfile, onNavigateToFlirtFuel, onNavigateToAIPractice, onNavigateToModule, sneakPeekTracking, onPaywallTrigger }) => {
  const [qotd, setQotd] = useState<QotdItem | null>(null);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Touch/swipe handling state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { getAIResponse } = useRelationshipAI();
  const { subscription } = useSubscription();
  const { user } = useAuth();

  // Handle QuickStart module navigation
  const handleQuickStartNavigation = (module: string) => {
    if (onNavigateToModule) {
      switch (module) {
        case 'flirtfuel':
          onNavigateToModule('flirtfuel');
          break;
        case 'therapy':
          onNavigateToModule('therapy');
          break;
        case 'concierge':
          onNavigateToModule('concierge');
          break;
        default:
          onNavigateToModule('flirtfuel');
      }
    } else {
      // Fallback to existing behavior
      switch (module) {
        case 'flirtfuel':
          onNavigateToFlirtFuel();
          break;
        case 'therapy':
          toast({
            title: "Therapy Companion! 💝",
            description: "Navigate via the bottom menu to access this feature!",
          });
          break;
        case 'concierge':
          toast({
            title: "Date Planner! 📅",
            description: "Navigate via the bottom menu to access this feature!",
          });
          break;
        default:
          onNavigateToFlirtFuel();
      }
    }
  };

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Get or set daily QOTD (changes at midnight)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const item = await getDailyQotd();
        if (mounted) setQotd(item);
      } catch (e) {
        console.error('QOTD load failed', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Check if user is first-time and show welcome tour
  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (!user) return;

      try {
        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking user settings:', error);
          return;
        }

        // If no settings exist or onboarding not completed, show welcome tour
        const shouldShowTour = !settings || !settings.onboarding_completed;
        setIsFirstTimeUser(shouldShowTour);
        setShowWelcomeTour(shouldShowTour);
      } catch (error) {
        console.error('Error checking first time user:', error);
      }
    };

    checkFirstTimeUser();
  }, [user]);

  const handleTourComplete = async () => {
    setShowWelcomeTour(false);
    
    if (!user) return;

    try {
      // Mark onboarding as completed
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const handleTourSkip = async () => {
    setShowWelcomeTour(false);
    
    if (!user) return;

    try {
      // Mark onboarding as completed even if skipped
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
  };

  const getUserFirstName = () => {
    if (userProfile.first_name) return userProfile.first_name;
    if (userProfile.full_name) {
      const parts = userProfile.full_name.split(' ');
      return parts[0];
    }
    return '';
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Purposely Dating App',
          text: 'Know someone who\'d love the Purposely Dating App? Invite them to join you!',
          url: window.location.origin,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.origin);
      toast({
        title: "Link Copied!",
        description: "Share this link with your friends to invite them to Purposely Dating!",
      });
    }
  };

  // Touch event handlers for swipe detection
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    // Left to right swipe opens side menu (only if swipe starts from left edge)
    if (isRightSwipe && touchStart < 50) {
      setIsSideMenuOpen(true);
      toast({
        title: "Menu Opened! 📱",
        description: "Navigate to different features from here!",
      });
    }
    // Right to left swipe navigates to Conversation Starters
    else if (isLeftSwipe) {
      onNavigateToFlirtFuel();
      toast({
        title: "Swiped to Conversation Starters! 💬",
        description: "Enjoy exploring new conversation topics!",
      });
    }
  };

  const isPremiumUser = subscription?.subscription_tier === 'Premium' || subscription?.subscribed;

  return (
    <div 
      className="pb-8 pt-6 px-4 space-y-6 bg-gradient-soft min-h-screen safe-area-pt"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            data-tour="side-menu"
          >
            <Menu className="w-6 h-6 text-primary" />
          </button>
          <h1 className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
            Purposely 💕
          </h1>
          <div className="w-10 h-10" /> {/* Spacer for center alignment */}
        </div>
        
        {/* Invite Partner Banner */}
        <div className="w-screen bg-gradient-to-r from-burgundy to-primary -mx-4 relative left-1/2 right-1/2 ml-[-50vw] mr-[-50vw]">
          <div className="p-3 px-4 max-w-full mx-auto" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
            <div className="text-base font-bold text-white leading-relaxed text-left">
              Know someone else who's dating with
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">a purpose?</span>
              <Button
                onClick={handleShare}
                variant="outline"
                className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-semibold whitespace-nowrap py-1 px-3 h-auto"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Invite a Friend
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Question of the Day */}
      <Card className="shadow-romance border-primary/20" data-tour="conversation-starters">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-primary animate-heart-pulse" />
            <span>Question of the Day</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Card className="w-full shadow-elegant border-primary/20 bg-gradient-romance">
            <CardContent className="p-8 flex flex-col justify-center items-center text-center gap-3">
              <div className="flex items-center justify-center h-full w-full">
                <p className="text-xl font-bold text-white leading-relaxed">
                  {qotd?.question || 'Loading your question...'}
                </p>
              </div>
              {qotd?.angle && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-white/90 underline decoration-white/30 cursor-help">
                        Why this matters
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">{qotd.angle}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
          <Button
            onClick={onNavigateToFlirtFuel}
            variant="romance"
            className="w-full"
          >
            See More Conversation Starters
          </Button>
        </CardContent>
      </Card>

      {/* Ask Purposely Section */}
      <AskPurposelySection
        userProfile={userProfile}
        sneakPeekTracking={sneakPeekTracking}
        onPaywallTrigger={(t) => onPaywallTrigger?.(t)}
      />

      {/* Quick Start Module */}
      <div data-tour="quick-start-modules">
        <QuickStartModule onNavigateToModule={handleQuickStartNavigation} />
      </div>

      {/* Side Menu */}
      <SideMenu 
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        onNavigateToModule={onNavigateToModule}
      />

      {/* Welcome Tour */}
      {showWelcomeTour && (
        <WelcomeTour
          userFirstName={getUserFirstName()}
          isPremium={isPremiumUser}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
        />
      )}
    </div>
  );
};

export default Home;