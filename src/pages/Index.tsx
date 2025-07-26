import React, { useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import FlirtFuelModule from '@/components/modules/FlirtFuelModule';
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
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);

  // Check for existing onboarding data
  useEffect(() => {
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
      setHasCompletedOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = (data: OnboardingData) => {
    setUserProfile(data);
    setHasCompletedOnboarding(true);
    // Save to localStorage for persistence
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(data));
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding || !userProfile) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
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
    </div>
  );
};

export default Index;
