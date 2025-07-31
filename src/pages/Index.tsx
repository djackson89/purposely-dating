import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import WelcomeTour from '@/components/WelcomeTour';
import NotificationPermissionStep from '@/components/NotificationPermissionStep';
import Paywall from '@/components/Paywall';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import FlirtFuelModule from '@/components/modules/FlirtFuelModule';
import DateConciergeModule from '@/components/modules/DateConciergeModule';
import TherapyCompanionModule from '@/components/modules/TherapyCompanionModule';
import ProfileModule from '@/components/modules/ProfileModule';
import ReviewRequestModal from '@/components/ReviewRequestModal';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { useSubscription } from '@/hooks/useSubscription';
import { useReviewTracking } from '@/hooks/useReviewTracking';
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
  const [hasSeenWelcomeSlides, setHasSeenWelcomeSlides] = useState(false);
  const [hasSeenNotificationPrompt, setHasSeenNotificationPrompt] = useState(false);
  const [hasSeenPaywall, setHasSeenPaywall] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);
  
  // Subscription and review tracking hooks
  const { subscription, loading: subscriptionLoading, createCheckoutSession } = useSubscription();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();

  // Check for existing onboarding and flow state
  useEffect(() => {
    // Clear all flow data to restart the flow properly
    localStorage.removeItem('relationshipCompanionProfile');
    localStorage.removeItem('hasSeenPaywall');
    localStorage.removeItem('hasSeenWelcomeSlides');
    localStorage.removeItem('hasSeenNotificationPrompt');
    
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    const savedPaywallFlag = localStorage.getItem('hasSeenPaywall');
    const savedWelcomeFlag = localStorage.getItem('hasSeenWelcomeSlides');
    const savedNotificationFlag = localStorage.getItem('hasSeenNotificationPrompt');
    
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
    
    if (savedPaywallFlag) {
      setHasSeenPaywall(true);
    }
    
    if (savedWelcomeFlag) {
      setHasSeenWelcomeSlides(true);
    }
    
    if (savedNotificationFlag) {
      setHasSeenNotificationPrompt(true);
    }
    
    // Premium users skip all onboarding automatically
    if (!subscriptionLoading && subscription.subscribed) {
      if (!savedProfile) {
        // Create a default profile for premium users
        const defaultProfile: OnboardingData = {
          firstName: 'User',
          profilePhoto: undefined,
          loveLanguage: 'Words of Affirmation',
          relationshipStatus: 'Single',
          age: '25-30',
          gender: 'Prefer not to say',
          personalityType: 'Explorer'
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('relationshipCompanionProfile', JSON.stringify(defaultProfile));
      }
      setHasSeenWelcomeSlides(true);
      setHasSeenNotificationPrompt(true);
      setHasSeenPaywall(true);
      setHasCompletedOnboarding(true);
    }
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

  const handlePlanSelected = async () => {
    // Start the Stripe checkout process
    await createCheckoutSession('yearly', true);
    setShowPaywallModal(false);
    setHasSeenPaywall(true);
    localStorage.setItem('hasSeenPaywall', 'true');
  };

  const handleSkipToFree = () => {
    console.log('User chose free version');
    setHasSeenPaywall(true);
    localStorage.setItem('hasSeenPaywall', 'true');
    setShowPaywallModal(false);
  };

  const handlePremiumFeatureClick = () => {
    setShowPaywallModal(true);
  };

  // Handler for welcome slides completion
  const handleWelcomeSlidesComplete = () => {
    setHasSeenWelcomeSlides(true);
    localStorage.setItem('hasSeenWelcomeSlides', 'true');
  };

  // Handler for notification permission completion
  const handleNotificationPromptComplete = () => {
    setHasSeenNotificationPrompt(true);
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
  };

  // 1. Show welcome slides first (if not seen)
  if (!subscriptionLoading && !hasSeenWelcomeSlides) {
    return <WelcomeTour 
      isPremium={subscription.subscribed} 
      onComplete={handleWelcomeSlidesComplete} 
      onSkip={handleWelcomeSlidesComplete} 
    />;
  }

  // 2. Show notification permission after welcome slides (if not seen)
  if (!subscriptionLoading && hasSeenWelcomeSlides && !hasSeenNotificationPrompt) {
    return <NotificationPermissionStep onComplete={handleNotificationPromptComplete} userProfile={{}} />;
  }

  // 3. Show paywall after notification permission (if not premium and not seen)
  if (!subscriptionLoading && !subscription.subscribed && hasSeenNotificationPrompt && !hasSeenPaywall) {
    return <Paywall onPlanSelected={handlePlanSelected} onSkipToFree={handleSkipToFree} />;
  }

  // 4. Show onboarding quiz after paywall (if not completed)
  if (!subscriptionLoading && hasSeenPaywall && (!hasCompletedOnboarding || !userProfile)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

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
    switch (activeModule) {
      case 'home':
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} onNavigateToAIPractice={handleNavigateToAIPractice} onNavigateToModule={handleNavigateToModule} />;
      case 'flirtfuel':
        return <FlirtFuelModule userProfile={userProfile} />;
      case 'concierge':
        return <DateConciergeModule userProfile={userProfile} />;
      case 'therapy':
        return <TherapyCompanionModule userProfile={userProfile} />;
      case 'profile':
        return <ProfileModule userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} onNavigateToAIPractice={handleNavigateToAIPractice} />;
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
