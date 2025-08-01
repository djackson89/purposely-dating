import React, { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const { signOut } = useAuth();
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [activeModule, setActiveModule] = useState<'home' | 'flirtfuel' | 'concierge' | 'therapy' | 'profile'>('home');
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  
  // Initialize native app features
  const { isNative, isOnline } = useAppInitialization(userProfile);
  
  // Subscription and review tracking hooks
  const { subscription, loading: subscriptionLoading, createCheckoutSession } = useSubscription();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();

  // Simple profile loading
  useEffect(() => {
    const savedProfile = localStorage.getItem('relationshipCompanionProfile');
    if (savedProfile) {
      try {
        setUserProfile(JSON.parse(savedProfile));
      } catch (error) {
        console.error('Error parsing saved profile:', error);
        localStorage.removeItem('relationshipCompanionProfile');
      }
    }
  }, []);

  const handleProfileUpdate = (updatedProfile: OnboardingData) => {
    setUserProfile(updatedProfile);
    localStorage.setItem('relationshipCompanionProfile', JSON.stringify(updatedProfile));
  };

  const handleNavigateToFlirtFuel = () => {
    setActiveModule('flirtfuel');
  };

  const handleNavigateToAIPractice = (scenario?: string) => {
    setActiveModule('flirtfuel');
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

  const handlePlanSelected = async () => {
    await createCheckoutSession('yearly', true);
    setShowPaywallModal(false);
  };

  const handleSkipToFree = () => {
    setShowPaywallModal(false);
  };

  const handlePremiumFeatureClick = () => {
    setShowPaywallModal(true);
  };

  const handleLogout = async () => {
    await signOut();
    localStorage.clear(); // Clear all local storage
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
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} onNavigateToAIPractice={handleNavigateToAIPractice} onNavigateToModule={handleNavigateToModule} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Logout button for debugging */}
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={handleLogout} variant="outline" size="sm">
          Logout
        </Button>
      </div>

      {renderActiveModule()}
      
      <Navigation 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
      />
      
      {/* Paywall Modal for Premium Features */}
      <Dialog open={showPaywallModal} onOpenChange={setShowPaywallModal}>
        <DialogContent className="max-w-lg">
          <div>
            <h2 className="text-xl font-bold mb-4">Premium Feature</h2>
            <p className="mb-4">This feature requires a premium subscription.</p>
            <div className="flex gap-2">
              <Button onClick={handlePlanSelected}>Subscribe</Button>
              <Button onClick={handleSkipToFree} variant="outline">Skip</Button>
            </div>
          </div>
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