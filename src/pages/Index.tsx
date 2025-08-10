import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import Paywall from '@/components/Paywall';
import PaywallPopup from '@/components/PaywallPopup';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import FlirtFuelModule from '@/components/modules/FlirtFuelModule';
import DateConciergeModule from '@/components/modules/DateConciergeModule';
import TherapyCompanionModule from '@/components/modules/TherapyCompanionModule';
import ProfileModule from '@/components/modules/ProfileModule';
import ReviewRequestModal from '@/components/ReviewRequestModal';
import NotificationPermissionStep from '@/components/NotificationPermissionStep';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useSubscription } from '@/hooks/useSubscription';
import { useReviewTracking } from '@/hooks/useReviewTracking';
import { useSneakPeekTracking } from '@/hooks/useSneakPeekTracking';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingData {
  firstName: string;
  profilePhoto?: string;
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasSeenPaywall, setHasSeenPaywall] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [hasCompletedNotifications, setHasCompletedNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [showPaywallPopup, setShowPaywallPopup] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<'view_limit' | 'ask_purposely' | 'next_question'>('view_limit');
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);
  
  // Subscription and review tracking hooks
  const { subscription, loading: subscriptionLoading, createCheckoutSession } = useSubscription();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();
  const sneakPeekTracking = useSneakPeekTracking();

  // Only block the UI on the very first load; after that, keep the current screen rendered
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => {
    if (!subscriptionLoading) setHasHydrated(true);
  }, [subscriptionLoading]);

  // Check for existing onboarding and paywall data
  useEffect(() => {
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    const savedPaywallFlag = localStorage.getItem('hasSeenPaywall');
    const savedWelcomeFlag = localStorage.getItem('hasSeenWelcome');
    const savedNotificationsFlag = localStorage.getItem('hasCompletedNotifications');
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
    
    if (savedPaywallFlag) {
      setHasSeenPaywall(true);
    }
    
    if (savedWelcomeFlag) {
      setHasSeenWelcome(true);
    }
    
    if (savedNotificationsFlag) {
      setHasCompletedNotifications(true);
    }
    
    // If user is already subscribed, skip paywall and welcome screens,
    // but do NOT auto-complete onboarding unless a profile already exists
    if (!subscriptionLoading && subscription.subscribed) {
      if (!savedProfile) {
        // Keep onboarding incomplete so user can enter first name and photo
      } else {
        setHasCompletedOnboarding(true);
      }
      setHasSeenPaywall(true);
      setHasSeenWelcome(true);
      setHasCompletedNotifications(true);
    }

    // Restore the module the user was on before opening the paywall (in-app upgrade)
    try {
      const returnModule = localStorage.getItem('returnToModule');
      if (returnModule) {
        const validModules = ['home', 'flirtfuel', 'concierge', 'therapy', 'profile'] as const;
        if ((validModules as readonly string[]).includes(returnModule)) {
          setActiveModule(returnModule as typeof validModules[number]);
        }
        localStorage.removeItem('returnToModule');
      }
    } catch {}
  }, [subscription.subscribed, subscriptionLoading]);

  const handleOnboardingComplete = async (data: OnboardingData) => {
    setUserProfile(data);
    setHasCompletedOnboarding(true);
    // Save to localStorage for persistence
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(data));
    
    // Save to Supabase if user is authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            ...data,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          });
      }
    } catch (error) {
      console.error('Error saving profile to Supabase:', error);
    }
  };

  const handleWelcomeComplete = () => {
    setHasSeenWelcome(true);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

  const handleNotificationsComplete = () => {
    setHasCompletedNotifications(true);
    localStorage.setItem('hasCompletedNotifications', 'true');
  };

  const handlePlanSelected = async () => {
    // Remember where the user was to restore after checkout
    try { localStorage.setItem('returnToModule', activeModule); } catch {}
    // Start the Stripe checkout process
    await createCheckoutSession('yearly', true);
    setShowPaywallModal(false);
    setShowPaywallPopup(false);
    setHasSeenPaywall(true);
    localStorage.setItem('hasSeenPaywall', 'true');
    // Set as free trial user
    sneakPeekTracking.setAsFreeTrial();
  };

  const handleSkipToFree = () => {
    console.log('User chose sneak peek version');
    setHasSeenPaywall(true);
    localStorage.setItem('hasSeenPaywall', 'true');
    setShowPaywallModal(false);
    // Set as sneak peek user
    sneakPeekTracking.setAsSneakPeek();
  };

  const handlePremiumFeatureClick = () => {
    setShowPaywallModal(true);
  };

  // Handle paywall popup triggers for sneak peek users
  const handlePaywallTrigger = (trigger: 'view_limit' | 'ask_purposely' | 'next_question') => {
    setPaywallTrigger(trigger);
    setShowPaywallPopup(true);
  };

  const handlePaywallPopupUpgrade = async () => {
    // Remember where the user was to restore after checkout
    try { localStorage.setItem('returnToModule', activeModule); } catch {}
    await createCheckoutSession('yearly', true);
    setShowPaywallPopup(false);
    sneakPeekTracking.setAsFreeTrial();
  };

  // 1. Show welcome screens first
  if (!subscriptionLoading && !hasSeenWelcome) {
    console.log('Rendering welcome screen');
    return <OnboardingFlow onComplete={handleWelcomeComplete} showOnlyWelcome />;
  }

  // 2. Show notifications permission after welcome
  if (!subscriptionLoading && hasSeenWelcome && !hasCompletedNotifications) {
    console.log('Rendering notifications screen');
    return <NotificationPermissionStep onComplete={handleNotificationsComplete} userProfile={null} />;
  }

  // 3. Show paywall after notifications if user doesn't have subscription
  if (!subscriptionLoading && hasCompletedNotifications && !subscription.subscribed && !hasSeenPaywall) {
    console.log('Rendering paywall');
    return <Paywall onPlanSelected={handlePlanSelected} onSkipToFree={handleSkipToFree} />;
  }

  // 4. Show intake quiz if paywall has been seen but onboarding not completed and not premium
  if (!subscriptionLoading && hasSeenPaywall && (!hasCompletedOnboarding || !userProfile)) {
    console.log('Rendering onboarding quiz');
    return <OnboardingFlow onComplete={handleOnboardingComplete} showOnlyQuiz />;
  }

  // Show loading state only on first hydration; keep UI during background refreshes
  if (subscriptionLoading && !hasHydrated) {
    console.log('Subscription loading (initial)...');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main app with state:', {
    subscriptionLoading,
    hasSeenWelcome, 
    hasCompletedNotifications,
    hasSeenPaywall,
    hasCompletedOnboarding,
    userProfile: !!userProfile
  });

  const handleProfileUpdate = (updatedProfile: OnboardingData) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(updatedProfile));
  };

  const handleNavigateToFlirtFuel = () => {
    setActiveModule('flirtfuel');
  };

  const handleNavigateToAIPractice = (scenario?: string) => {
    setActiveModule('flirtfuel');
    // Store the scenario for the FlirtFuelModule to use
    if (scenario) {
      localStorage.setItem('practiceScenario', scenario);
      localStorage.setItem('activePracticeSection', 'practice');
    }
  };

  const handleNavigateToModule = (module: string) => {
    const validModules = ['home', 'flirtfuel', 'concierge', 'therapy', 'profile'] as const;
    type ValidModule = typeof validModules[number];
    
    if (validModules.includes(module as ValidModule)) {
      setActiveModule(module as ValidModule);
    }
  };

  const renderActiveModule = () => {
    const moduleProps = {
      userProfile,
      sneakPeekTracking,
      onPaywallTrigger: handlePaywallTrigger
    };

    switch (activeModule) {
      case 'home':
        return <Home 
          userProfile={userProfile} 
          onNavigateToFlirtFuel={handleNavigateToFlirtFuel} 
          onNavigateToAIPractice={handleNavigateToAIPractice} 
          onNavigateToModule={handleNavigateToModule}
          sneakPeekTracking={sneakPeekTracking}
          onPaywallTrigger={handlePaywallTrigger}
        />;
      case 'flirtfuel':
        return <FlirtFuelModule {...moduleProps} />;
      case 'concierge':
        return <DateConciergeModule {...moduleProps} />;
      case 'therapy':
        return <TherapyCompanionModule {...moduleProps} />;
      case 'profile':
        return <ProfileModule userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Home 
          userProfile={userProfile} 
          onNavigateToFlirtFuel={handleNavigateToFlirtFuel} 
          onNavigateToAIPractice={handleNavigateToAIPractice} 
          sneakPeekTracking={sneakPeekTracking}
          onPaywallTrigger={handlePaywallTrigger}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveModule()}
      <Navigation 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
      
      {/* Paywall Modal for Premium Features */}
      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="max-w-lg">
          <Paywall 
            onPlanSelected={handlePlanSelected}
            onSkipToFree={handleSkipToFree}
            isModal={true}
          />
        </DialogContent>
      </Dialog>

      {/* Paywall Popup for Sneak Peek Users */}
      <PaywallPopup
        isOpen={showPaywallPopup}
        onClose={() => setShowPaywallPopup(false)}
        onUpgrade={handlePaywallPopupUpgrade}
        trigger={paywallTrigger}
      />

      {/* Review Request Modal */}
      <ReviewRequestModal 
        isOpen={shouldShowReview}
        onClose={() => {
          hideReviewModal();
          markReviewAsShown();
        }}
      />
    </div>
  );
};

export default Index;
