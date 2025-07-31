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
import { useAuth } from '@/hooks/useAuth';
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
  
  // Initialize native app features and auth
  const { isNative, isOnline } = useAppInitialization(userProfile);
  const { user, loading: authLoading } = useAuth();
  
  // Subscription and review tracking hooks
  const { subscription, loading: subscriptionLoading, createCheckoutSession } = useSubscription();
  const { shouldShowReview, hideReviewModal, markReviewAsShown } = useReviewTracking();

  // Handler functions - Define these before they're used
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
            full_name: data.firstName,
            love_language: data.loveLanguage,
            relationship_status: data.relationshipStatus,
            age: data.age,
            gender: data.gender,
            personality_type: data.personalityType,
            avatar_url: data.profilePhoto,
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
        return <Home userProfile={userProfile} onNavigateToFlirtFuel={handleNavigateToFlirtFuel} onNavigateToAIPractice={handleNavigateToAIPractice} onNavigateToModule={handleNavigateToModule} />;
    }
  };

  // Check for existing onboarding and flow state
  useEffect(() => {
    const initializeFlowState = async () => {
      // Don't initialize if still loading auth or subscription
      if (authLoading || subscriptionLoading) {
        console.log('Still loading - auth:', authLoading, 'subscription:', subscriptionLoading);
        return;
      }

      console.log('Initializing flow state - user:', !!user, 'subscription:', subscription.subscribed);

      const savedProfile = localStorage.getItem('relationshipCompanionProfile');
      const savedPaywallFlag = localStorage.getItem('hasSeenPaywall');
      const savedWelcomeFlag = localStorage.getItem('hasSeenWelcomeSlides');
      const savedNotificationFlag = localStorage.getItem('hasSeenNotificationPrompt');
      
      // If user is authenticated, check if they have completed onboarding
      if (user) {
        console.log('User is authenticated, checking profile completion');
        
        // Load saved profile data
        if (savedProfile) {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
          setHasCompletedOnboarding(true);
          console.log('Loaded profile from localStorage:', profile);
        } else {
          // Try to load from Supabase for authenticated users
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();
            
            if (profile && profile.love_language) {
              console.log('Loaded profile from Supabase:', profile);
              // User has completed onboarding, create local profile
              const profileData: OnboardingData = {
                firstName: profile.full_name?.split(' ')[0] || 'User',
                profilePhoto: profile.avatar_url,
                loveLanguage: profile.love_language,
                relationshipStatus: profile.relationship_status || 'Single',
                age: profile.age || '25-30',
                gender: profile.gender || 'Prefer not to say',
                personalityType: profile.personality_type || 'Explorer'
              };
              setUserProfile(profileData);
              setHasCompletedOnboarding(true);
              localStorage.setItem('relationshipCompanionProfile', JSON.stringify(profileData));
            } else {
              console.log('No profile found in Supabase, user needs onboarding');
              // User needs to complete onboarding
              setHasCompletedOnboarding(false);
            }
          } catch (error) {
            console.error('Error loading profile from Supabase:', error);
            // If error loading from Supabase, user needs to complete onboarding
            setHasCompletedOnboarding(false);
          }
        }
        
        // For authenticated users, mark all onboarding steps as seen so they skip to the app
        setHasSeenWelcomeSlides(true);
        setHasSeenNotificationPrompt(true);
        setHasSeenPaywall(true);
        
        return;
      }
      
      // For unauthenticated users, check localStorage flags
      if (savedPaywallFlag) {
        setHasSeenPaywall(true);
      }
      
      if (savedWelcomeFlag) {
        setHasSeenWelcomeSlides(true);
      }
      
      if (savedNotificationFlag) {
        setHasSeenNotificationPrompt(true);
      }
      
      if (savedProfile) {
        setUserProfile(JSON.parse(savedProfile));
        setHasCompletedOnboarding(true);
      }
      
      // Premium users skip all onboarding automatically (even if not authenticated)
      if (subscription.subscribed) {
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
      
      console.log('Flow state initialization complete');
    };

    initializeFlowState();
  }, [user?.id, authLoading, subscription.subscribed, subscriptionLoading]); // More specific dependencies

  // Show loading while auth or subscription is loading
  if (authLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // For authenticated users, if they have completed onboarding, show the app
  if (user && hasCompletedOnboarding && userProfile) {
    console.log('Showing app for authenticated user with profile');
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
  }

  // For authenticated users who need to complete onboarding
  if (user && !hasCompletedOnboarding) {
    console.log('Authenticated user needs onboarding');
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // For unauthenticated users, show the onboarding flow
  // 1. Show welcome slides first (for first-time visitors only)
  if (!user && !hasSeenWelcomeSlides) {
    return <WelcomeTour 
      isPremium={subscription.subscribed} 
      onComplete={handleWelcomeSlidesComplete} 
      onSkip={handleWelcomeSlidesComplete} 
    />;
  }

  // 2. Show notification permission after welcome slides (for first-time visitors only)
  if (!user && hasSeenWelcomeSlides && !hasSeenNotificationPrompt) {
    return <NotificationPermissionStep onComplete={handleNotificationPromptComplete} userProfile={{}} />;
  }

  // 3. Show paywall after notification permission (if not premium and not seen)
  if (!user && !subscription.subscribed && hasSeenNotificationPrompt && !hasSeenPaywall) {
    return <Paywall onPlanSelected={handlePlanSelected} onSkipToFree={handleSkipToFree} />;
  }

  // 4. Show onboarding quiz after paywall (if not completed)
  if (!user && hasSeenPaywall && (!hasCompletedOnboarding || !userProfile)) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // 5. If user has completed onboarding but is not authenticated, show the app
  if (!user && hasCompletedOnboarding && userProfile) {
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
  }

  // Fallback - should not reach here normally
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-muted-foreground">Initializing...</p>
      </div>
    </div>
  );
};

export default Index;
