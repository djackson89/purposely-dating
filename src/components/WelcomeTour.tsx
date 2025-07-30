import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, MessageCircle, Sparkles, Grid3X3, Menu, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WelcomeTourProps {
  userFirstName?: string;
  isPremium: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  target?: string;
}

const WelcomeTour: React.FC<WelcomeTourProps> = ({ 
  userFirstName, 
  isPremium, 
  onComplete, 
  onSkip 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const { toast } = useToast();

  const tourSteps: TourStep[] = [
    {
      id: 'conversation-starters',
      title: 'Conversation Starter Section',
      description: 'Get fresh, engaging questions daily to spark meaningful conversations and move beyond small talk.',
      icon: MessageCircle,
    },
    {
      id: 'ask-purposely',
      title: 'Ask Purposely Section',
      description: 'Get personalized advice and insights on your dating situations with our AI-powered relationship coach.',
      icon: Sparkles,
    },
    {
      id: 'quick-start-modules',
      title: 'Quick Start Modules',
      description: 'Access powerful tools like FlirtFuel, Therapy Companion, and Date Concierge to level up your dating game.',
      icon: Grid3X3,
    },
    {
      id: 'main-menu',
      title: 'Main Menu',
      description: 'Navigate between different features using the bottom navigation bar for quick access to all tools.',
      icon: Menu,
    },
    {
      id: 'side-menu',
      title: 'Side Menu',
      description: 'Access settings, profile customization, and additional features by tapping the menu button in the top left.',
      icon: Settings,
    },
    {
      id: 'contact-info',
      title: 'Got Feedback?',
      description: 'We love hearing from you! Send your feedback, suggestions, or questions to info@thepurposelyapp.com',
      icon: MessageCircle,
    },
  ];

  const handleGetStarted = () => {
    setShowWelcome(false);
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipTour = () => {
    onSkip();
  };

  const formatUserName = () => {
    if (userFirstName && userFirstName.trim()) {
      return `${userFirstName}, `;
    }
    return '';
  };

  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-scale-in">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-romance rounded-full flex items-center justify-center shadow-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold bg-gradient-romance bg-clip-text text-transparent">
                {isPremium 
                  ? `Congrats ${formatUserName()}! You're now in Purposely Premium.`
                  : `Welcome, ${formatUserName()}!`
                }
              </CardTitle>
              
              <p className="text-muted-foreground">
                Let me show you around {isPremium ? 'Purposely' : 'Purposely'}!
              </p>
            </div>

            {isPremium && (
              <Badge variant="secondary" className="bg-gradient-romance text-white border-0 mx-auto">
                Premium Member
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex space-x-3">
              <Button
                onClick={handleGetStarted}
                className="flex-1 bg-gradient-romance hover:opacity-90 text-white font-semibold"
              >
                Get Started
              </Button>
              <Button
                onClick={handleSkipTour}
                variant="outline"
                className="flex-1"
              >
                Skip Tour
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentTourStep = tourSteps[currentStep];
  const Icon = currentTourStep.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-scale-in">
        <CardHeader className="relative">
          <button
            onClick={handleSkipTour}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-romance rounded-full flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-xl font-bold text-center">
            {currentTourStep.title}
          </CardTitle>
          
          <div className="flex justify-center space-x-1 mt-4">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-center leading-relaxed">
            {currentTourStep.description}
          </p>

          <div className="flex justify-between items-center">
            <Button
              onClick={handlePrevious}
              variant="outline"
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {tourSteps.length}
            </span>

            <Button
              onClick={handleNext}
              className="bg-gradient-romance hover:opacity-90 text-white flex items-center space-x-2"
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelcomeTour;