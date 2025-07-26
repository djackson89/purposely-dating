import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import Paywall from '@/components/Paywall';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import FlirtFuelModule from '@/components/modules/FlirtFuelModule';
import DateConciergeModule from '@/components/modules/DateConciergeModule';
import TherapyCompanionModule from '@/components/modules/TherapyCompanionModule';
import ProfileModule from '@/components/modules/ProfileModule';
import { useAppInitialization } from '@/hooks/useAppInitialization';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface OnboardingData {
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const Index = () => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedPaywall, setHasCompletedPaywall] = useState(false);
  const [isUsingFreeVersion, setIsUsingFreeVersion] = useState(false);
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);

  // Check for existing onboarding and paywall data
  useEffect(() => {
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    const savedPaywall = localStorage.getItem('relationshipCompanionPaywall');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
    // Temporarily comment out paywall check so you can preview it
    // if (savedPaywall) {
    //   setHasCompletedPaywall(true);
    // }
  }, []);

  const handleOnboardingComplete = (data: OnboardingData) => {
    setUserProfile(data);
    setHasCompletedOnboarding(true);
    // Save to localStorage for persistence
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(data));
  };

  const handlePlanSelected = () => {
    // For now, just complete the paywall flow
    // In a real implementation, this would integrate with Stripe
    console.log('Premium plan selected with 7-day trial');
    setHasCompletedPaywall(true);
    setShowPaywallModal(false);
    localStorage.setItem('relationshipCompanionPaywall', JSON.stringify({ plan: 'premium', hasTrial: true, completedAt: new Date().toISOString() }));
  };

  const handleSkipToFree = () => {
    console.log('User chose free version');
    setIsUsingFreeVersion(true);
    setShowPaywallModal(false);
  };

  const handlePremiumFeatureClick = () => {
    setShowPaywallModal(true);
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding || !userProfile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show paywall if onboarding is done but paywall not completed and not using free version
  if (!hasCompletedPaywall && !isUsingFreeVersion) {
    return <Paywall onPlanSelected={handlePlanSelected} onSkipToFree={handleSkipToFree} />;
  }

  const handleProfileUpdate = (updatedProfile: OnboardingData) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(updatedProfile));
  };

  const handleNavigateToFlirtFuel = () => {
    setActiveModule('flirtfuel');
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'home':
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} />;
      case 'flirtfuel':
        return <FlirtFuelModule userProfile={userProfile} />;
      case 'concierge':
        return <DateConciergeModule userProfile={userProfile} />;
      case 'therapy':
        return <TherapyCompanionModule userProfile={userProfile} />;
      case 'profile':
        return <ProfileModule userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} />;
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
    </div>
  );
};

export default Index;
