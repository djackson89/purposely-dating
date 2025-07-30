import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
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
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);
  
  // Subscription and review tracking hooks
  const { subscription, loading: subscriptionLoading, createCheckoutSession } = useSubscription();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();

  // Check for existing onboarding and paywall data
  useEffect(() => {
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    const savedPaywall = localStorage.getItem('relationshipCompanionPaywall');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
    
    // Premium users skip onboarding automatically
    if (!subscriptionLoading && subscription.subscribed) {
      if (!savedProfile) {
        // Create a default profile for premium users
        const defaultProfile: OnboardingData = {
          loveLanguage: 'Words of Affirmation',
          relationshipStatus: 'Single',
          age: '25-30',
          gender: 'Prefer not to say',
          personalityType: 'Explorer'
        };
        setUserProfile(defaultProfile);
        localStorage.setItem('relationshipCompanionProfile', JSON.stringify(defaultProfile));
      }
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
  };

  const handleSkipToFree = () => {
    console.log('User chose free version');
    localStorage.setItem('hasSeenPaywall', 'true');
    setShowPaywallModal(false);
  };

  const handlePremiumFeatureClick = () => {
    setShowPaywallModal(true);
  };

  // Show onboarding if not completed and not premium
  if (!subscriptionLoading && !subscription.subscribed && (!hasCompletedOnboarding || !userProfile)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show paywall if user doesn't have subscription and hasn't seen it yet
  if (!subscriptionLoading && !subscription.subscribed && !localStorage.getItem('hasSeenPaywall')) {
    return <Paywall onPlanSelected={handlePlanSelected} onSkipToFree={handleSkipToFree} />;
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
