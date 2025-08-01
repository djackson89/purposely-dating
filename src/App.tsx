import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import SimpleOnboarding from "./components/SimpleOnboarding";

const queryClient = new QueryClient();

interface OnboardingData {
  firstName: string;
  profilePhoto?: string;
  loveLanguage: string;
  relationshipStatus: string;
  age: string;
  gender: string;
  personalityType: string;
}

const AppContent = () => {
  const { user, loading } = useAuth();
  const [userProfile, setUserProfile] = useState<OnboardingData | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check for existing profile on auth change
  useEffect(() => {
    if (user) {
      const savedProfile = localStorage.getItem('relationshipCompanionProfile');
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setUserProfile(profile);
          setNeedsOnboarding(false);
        } catch (error) {
          console.error('Error parsing saved profile:', error);
          localStorage.removeItem('relationshipCompanionProfile');
          setNeedsOnboarding(true);
        }
      } else {
        setNeedsOnboarding(true);
      }
    } else {
      setUserProfile(null);
      setNeedsOnboarding(false);
    }
  }, [user]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-soft">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading Purposely...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if no user
  if (!user) {
    return <Auth />;
  }

  // Show onboarding if needed
  if (needsOnboarding) {
    return (
      <SimpleOnboarding 
        onComplete={(data) => {
          setUserProfile(data);
          setNeedsOnboarding(false);
          localStorage.setItem('relationshipCompanionProfile', JSON.stringify(data));
        }}
      />
    );
  }

  // User is authenticated and has profile, show main app
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index userProfile={userProfile} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
