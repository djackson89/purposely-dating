import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import Paywall from '@/components/Paywall';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import TextGenieModule from '@/components/modules/TextGenieModule';
import DateConciergeModule from '@/components/modules/DateConciergeModule';
import TherapyCompanionModule from '@/components/modules/TherapyCompanionModule';
import ProfileModule from '@/components/modules/ProfileModule';
import { useAppInitialization } from '@/hooks/useAppInitialization';

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
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'textgenie' | 'concierge' | 'therapy' | 'profile'>('home');
  
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

  const handlePlanSelected = (plan: 'weekly' | 'yearly', hasTrial?: boolean) => {
    // For now, just complete the paywall flow
    // In a real implementation, this would integrate with Stripe
    console.log('Plan selected:', plan, 'Has trial:', hasTrial);
    setHasCompletedPaywall(true);
    localStorage.setItem('relationshipCompanionPaywall', JSON.stringify({ plan, hasTrial, completedAt: new Date().toISOString() }));
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding || !userProfile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show paywall if onboarding is done but paywall not completed
  if (!hasCompletedPaywall) {
    return <Paywall onPlanSelected={handlePlanSelected} />;
  }

  const handleProfileUpdate = (updatedProfile: OnboardingData) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(updatedProfile));
  };

  const handleNavigateToTextGenie = () => {
    setActiveModule('textgenie');
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'home':
        return <Home userProfile={userProfile} onNavigateToTextGenie={handleNavigateToTextGenie} />;
      case 'textgenie':
        return <TextGenieModule userProfile={userProfile} />;
      case 'concierge':
        return <DateConciergeModule userProfile={userProfile} />;
      case 'therapy':
        return <TherapyCompanionModule userProfile={userProfile} />;
      case 'profile':
        return <ProfileModule userProfile={userProfile} onProfileUpdate={handleProfileUpdate} />;
      default:
        return <Home userProfile={userProfile} onNavigateToTextGenie={handleNavigateToTextGenie} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderActiveModule()}
      <Navigation 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
    </div>
  );
};

export default Index;
